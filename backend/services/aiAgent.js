import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@googlemaps/google-maps-services-js";
import crypto from "crypto";
import AIRecommendation from "../models/AIRecommendation.js";

// Initialize clients
const mapsClient = new Client({});
let geminiClient = null;

if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const generateDescriptionHash = (description) => {
  return crypto
    .createHash("sha256")
    .update(description.toLowerCase().trim())
    .digest("hex");
};

const generateLocationsWithGemini = async (description) => {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  if (!geminiClient) {
    throw new Error("Gemini API key not configured");
  }

  try {
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const prompt = `You are an expert location scout for film and TV production with deep knowledge of filming locations worldwide.

Scene Description: "${description}"

Generate 10 REALISTIC filming locations that would be perfect for this scene. These should be actual real places (or based on real locations you know about).

For each location, provide COMPLETE information:

CRITICAL JSON FORMATTING RULES:
1. Return ONLY a valid JSON array - no markdown, no code blocks, no additional text
2. Each location MUST be a complete, valid JSON object
3. NO trailing commas after the last property in any object
4. NO incomplete objects - if you can't complete an object, omit it entirely
5. All strings must be properly escaped
6. Generate exactly 10 locations

Required JSON structure for each location:
{
  "name": "Actual location name",
  "address": "Complete street address with city, state, country",
  "coordinates": {
    "lat": <realistic latitude>,
    "lng": <realistic longitude>
  },
  "rating": <number 0-10 representing suitability>,
  "tags": ["tag1", "tag2", "tag3"],
  "reason": "Detailed 3-4 sentence explanation",
  "filmingDetails": {
    "accessibility": "Description of access for film crew and equipment",
    "parking": "Parking availability details",
    "powerAccess": "Availability of electrical power",
    "bestTimeToFilm": "Recommended time of day/season",
    "crowdLevel": "Expected crowd levels",
    "weatherConsiderations": "Weather-related filming notes"
  },
  "permits": [
    {
      "name": "Permit name",
      "required": true,
      "estimatedCost": "Cost range or Free",
      "processingTime": "Time to obtain",
      "authority": "Issuing authority"
    }
  ],
  "estimatedCost": "Estimated filming cost per day"
}

Return ONLY the JSON array starting with [ and ending with ]. Generate exactly 10 complete location objects.`;

    console.log(
      `🤖 Requesting Gemini to generate 10 location recommendations...`
    );

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let jsonText = text.trim();
    const codeBlockPattern = /```(?:json)?\n?/g;
    jsonText = jsonText.replace(codeBlockPattern, "");

    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    jsonText = jsonText.trim();
    jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1");

    let locations;
    try {
      locations = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message);
      console.error(
        "Received text (first 1000 chars):",
        text.substring(0, 1000)
      );

      try {
        const arrayStart = jsonText.indexOf("[");
        const arrayEnd = jsonText.lastIndexOf("]");
        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          let potentialJson = jsonText.substring(arrayStart, arrayEnd + 1);
          potentialJson = potentialJson.replace(/,(\s*[}\]])/g, "$1");

          const objects = [];
          let depth = 0;
          let currentObj = "";
          let inString = false;
          let escapeNext = false;

          for (let i = 1; i < potentialJson.length - 1; i++) {
            const char = potentialJson[i];

            if (escapeNext) {
              currentObj += char;
              escapeNext = false;
              continue;
            }

            if (char === "\\") {
              escapeNext = true;
              currentObj += char;
              continue;
            }

            if (char === '"') {
              inString = !inString;
            }

            if (!inString) {
              if (char === "{") {
                if (depth === 0) currentObj = "";
                depth++;
              } else if (char === "}") {
                depth--;
                if (depth === 0) {
                  currentObj += char;
                  try {
                    const obj = JSON.parse(currentObj);
                    objects.push(obj);
                    currentObj = "";
                  } catch (e) {
                    currentObj = "";
                  }
                  continue;
                }
              }
            }

            if (depth > 0) {
              currentObj += char;
            }
          }

          if (objects.length > 0) {
            locations = objects;
            console.log(
              `✓ Recovered ${objects.length} valid objects from malformed JSON`
            );
          } else {
            throw parseError;
          }
        } else {
          throw parseError;
        }
      } catch (recoveryError) {
        console.error("Recovery also failed:", recoveryError.message);
        throw new Error(
          `Failed to parse AI response as JSON: ${parseError.message}`
        );
      }
    }

    if (!Array.isArray(locations)) {
      throw new Error("AI response is not an array");
    }

    console.log(`✅ Gemini generated ${locations.length} locations`);
    return locations;
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw new Error(
      `Failed to generate locations with Gemini: ${error.message}`
    );
  }
};

const verifyLocationWithGooglePlaces = async (geminiLocation) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.warn(
      "⚠️ Google Maps API key not configured, skipping verification"
    );
    return {
      ...geminiLocation,
      verified: false,
      placeId: null,
      mapsLink: null,
      photos: [],
    };
  }

  try {
    const searchQuery = `${geminiLocation.name}, ${geminiLocation.address}`;
    console.log(`  🔍 Verifying: "${geminiLocation.name}"...`);

    const response = await mapsClient.textSearch({
      params: {
        query: searchQuery,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const results = response.data.results || [];

    if (results.length === 0) {
      console.log(`  ❌ Not found in Google Places - using Gemini data`);
      return {
        ...geminiLocation,
        verified: false,
        placeId: null,
        mapsLink: null,
        photos: [],
      };
    }

    const place = results[0];

    const photos = [];
    if (place.photos && place.photos.length > 0) {
      for (let i = 0; i < Math.min(2, place.photos.length); i++) {
        const photo = place.photos[i];
        // Use backend proxy URL instead of direct Google API URL
        // This avoids CORS issues and keeps API key secure
        const photoUrl = `${
          process.env.BACKEND_URL || "http://localhost:5000"
        }/api/photos/place-photo?photoreference=${
          photo.photo_reference
        }&maxwidth=800`;
        photos.push({
          url: photoUrl,
          width: photo.width,
          height: photo.height,
          photoReference: photo.photo_reference,
        });
      }
    }

    const googleCoords = place.geometry?.location;
    const mapsLink = googleCoords
      ? `https://www.google.com/maps/search/?api=1&query=${googleCoords.lat},${googleCoords.lng}&query_place_id=${place.place_id}`
      : null;

    console.log(`  ✅ Verified with Google Places (${photos.length} photos)`);

    return {
      ...geminiLocation,
      address: place.formatted_address || geminiLocation.address,
      coordinates: googleCoords
        ? {
            lat: googleCoords.lat,
            lng: googleCoords.lng,
          }
        : geminiLocation.coordinates,
      verified: true,
      placeId: place.place_id,
      mapsLink: mapsLink,
      photos: photos,
      googleTypes: place.types || [],
    };
  } catch (error) {
    console.error(`  ⚠️ Error verifying location:`, error.message);
    return {
      ...geminiLocation,
      verified: false,
      placeId: null,
      mapsLink: null,
      photos: [],
    };
  }
};

export const findAndRankLocations = async (description, options = {}) => {
  const startTime = Date.now();
  const { projectId, userId, forceRefresh = false, maxResults = 5 } = options;

  if (!description || description.trim().length === 0) {
    throw new Error("Description is required");
  }

  const descriptionHash = generateDescriptionHash(description);

  // Check cache - filter by projectId if provided
  if (!forceRefresh) {
    const cacheQuery = { descriptionHash };
    if (projectId) {
      cacheQuery.projectId = projectId;
    }

    const cached = await AIRecommendation.findOne(cacheQuery);
    if (cached) {
      await cached.recordAccess();
      console.log(
        `✅ Cache hit for description hash: ${descriptionHash.substring(
          0,
          8
        )}...${projectId ? ` (project: ${projectId})` : ""}`
      );
      return {
        success: true,
        cached: true,
        description: cached.description,
        projectId: cached.projectId,
        results: cached.results.slice(0, maxResults),
        metadata: {
          ...cached.metadata,
          cacheAge: Date.now() - cached.createdAt.getTime(),
          lastAccessed: cached.lastAccessedAt,
          accessCount: cached.accessCount,
        },
      };
    }
  }

  console.log(
    `\n🔍 NEW HYBRID APPROACH: Processing request for: "${description}"${
      projectId ? ` (project: ${projectId})` : ""
    }`
  );

  console.log("🤖 Step 1: Generating locations with Gemini AI...");
  const geminiLocations = await generateLocationsWithGemini(description);
  console.log(`✨ Gemini generated ${geminiLocations.length} locations`);

  console.log("\n📍 Step 2: Verifying locations with Google Places...");
  const verifiedLocations = [];
  const unverifiedLocations = [];

  for (const location of geminiLocations) {
    const enrichedLocation = await verifyLocationWithGooglePlaces(location);
    if (enrichedLocation.verified) {
      verifiedLocations.push(enrichedLocation);
    } else {
      unverifiedLocations.push(enrichedLocation);
    }
  }

  console.log(`\n✅ Verified: ${verifiedLocations.length} locations`);
  console.log(`❌ Unverified: ${unverifiedLocations.length} locations`);

  const finalLocations = [];
  finalLocations.push(...verifiedLocations);

  if (finalLocations.length < maxResults) {
    const needed = maxResults - finalLocations.length;
    finalLocations.push(...unverifiedLocations.slice(0, needed));
  }

  const results = finalLocations.slice(0, maxResults);

  const processingTime = Date.now() - startTime;

  console.log(
    `\n📊 Final results: ${results.length} locations (${
      results.filter((l) => l.verified).length
    } verified, ${results.filter((l) => !l.verified).length} unverified)`
  );

  let cacheStatus = "not-saved";
  try {
    const recommendation = new AIRecommendation({
      projectId: projectId || null, // Store projectId for project-scoped searches
      description,
      descriptionHash,
      results: results,
      metadata: {
        totalGenerated: geminiLocations.length,
        totalVerified: verifiedLocations.length,
        totalUnverified: unverifiedLocations.length,
        processingTime,
        apiCalls: {
          gemini: 1,
          googlePlaces: geminiLocations.length,
        },
        approach: "hybrid-gemini-first",
      },
    });

    await recommendation.save();
    console.log(
      `💾 Cached results for future use (expires in 7 days)${
        projectId ? ` (project: ${projectId})` : ""
      }\n`
    );
    cacheStatus = "saved";
  } catch (cacheError) {
    console.warn(
      `⚠️ Cache save failed (continuing without cache):`,
      cacheError.message
    );
    cacheStatus = "failed";
  }

  return {
    success: true,
    cached: false,
    cacheStatus,
    description,
    projectId,
    results: results,
    metadata: {
      totalGenerated: geminiLocations.length,
      totalVerified: verifiedLocations.length,
      totalUnverified: unverifiedLocations.length,
      processingTime,
      apiCalls: {
        gemini: 1,
        googlePlaces: geminiLocations.length,
      },
      approach: "hybrid-gemini-first",
    },
  };
};

export const clearExpiredCache = async () => {
  try {
    const result = await AIRecommendation.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    console.log(`🗑️ Cleared ${result.deletedCount} expired cache entries`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error clearing expired cache:", error);
    throw error;
  }
};

export const getCacheStats = async () => {
  try {
    const total = await AIRecommendation.countDocuments();
    const recentlyUsed = await AIRecommendation.countDocuments({
      lastAccessedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const popular = await AIRecommendation.find()
      .sort({ accessCount: -1 })
      .limit(10)
      .select("description accessCount lastAccessedAt");

    return {
      totalCachedRequests: total,
      recentlyUsed24h: recentlyUsed,
      popularQueries: popular,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    throw error;
  }
};

export const isAIAgentAvailable = () => {
  return !!(process.env.GEMINI_API_KEY && process.env.GOOGLE_MAPS_API_KEY);
};

export default {
  findAndRankLocations,
  clearExpiredCache,
  getCacheStats,
  isAIAgentAvailable,
};
