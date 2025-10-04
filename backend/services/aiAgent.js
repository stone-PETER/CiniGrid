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

/**
 * Generate a hash for the description to use as cache key
 */
const generateDescriptionHash = (description) => {
  return crypto
    .createHash("sha256")
    .update(description.toLowerCase().trim())
    .digest("hex");
};

/**
 * Search for places using Google Places API (Text Search)
 */
const searchPlacesWithGoogleAPI = async (description) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key not configured");
  }

  try {
    // Text search with broader query
    const response = await mapsClient.textSearch({
      params: {
        query: description,
        key: process.env.GOOGLE_MAPS_API_KEY,
        type: "point_of_interest", // Broad category for locations
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error("Google Places API error:", error);
    throw error;
  }
};

/**
 * Search for additional places using nearby search
 */
const searchNearbyPlaces = async (location, description, radius = 10000) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return [];
  }

  try {
    const response = await mapsClient.placesNearby({
      params: {
        location,
        radius,
        keyword: description,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error("Google Nearby Search error:", error);
    return [];
  }
};

/**
 * Get additional location details
 */
const getPlaceDetails = async (placeId) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return null;
  }

  try {
    const response = await mapsClient.placeDetails({
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY,
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "rating",
          "user_ratings_total",
          "price_level",
          "opening_hours",
          "photos",
          "types",
        ],
      },
    });

    return response.data.result;
  } catch (error) {
    console.error("Place details error:", error);
    return null;
  }
};

/**
 * Format places data for Gemini AI
 */
const formatPlacesForAI = (places) => {
  return places.map((place, index) => ({
    id: index + 1,
    name: place.name,
    address:
      place.formatted_address || place.vicinity || "Address not available",
    coordinates: {
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
    },
    rating: place.rating || 0,
    userRatingsTotal: place.user_ratings_total || 0,
    types: place.types || [],
    placeId: place.place_id,
    photos:
      place.photos?.slice(0, 3).map((photo) => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })) || [],
  }));
};

/**
 * Use Gemini AI to rank locations based on suitability
 */
const rankLocationsWithGemini = async (description, places) => {
  // Re-initialize gemini client if not already done
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

    const placesData = formatPlacesForAI(places);

    const prompt = `You are an expert location scout for film and TV production. 

Scene Description: "${description}"

Analyze and rank the following filming locations based on their suitability for this scene. Consider factors like:
- Visual appeal and aesthetics matching the scene
- Accessibility for film crew and equipment
- Practical filming considerations
- Atmosphere and ambiance
- Unique features that enhance the scene

Locations to analyze:
${JSON.stringify(placesData, null, 2)}

CRITICAL JSON FORMATTING RULES:
1. Return ONLY a valid JSON array - no markdown, no code blocks, no additional text
2. Each location MUST be a complete, valid JSON object
3. NO trailing commas after the last property in any object
4. NO incomplete objects - if you can't complete an object, omit it entirely
5. All strings must be properly escaped
6. All photo references must be complete (no truncation)
7. Limit to maximum 5 locations

Required JSON structure for each location:
{
  "name": "Location name",
  "reason": "2-3 sentences explaining suitability",
  "rating": 8.5,
  "coordinates": {
    "lat": 10.123,
    "lng": 76.456
  },
  "address": "Full address string",
  "placeId": "Google place ID",
  "photos": [{"photoReference": "complete_reference", "width": 1920, "height": 1080}],
  "types": ["type1", "type2"],
  "additionalInfo": {
    "rating": 4.5,
    "userRatingsTotal": 100,
    "priceLevel": 2
  }
}

Return ONLY the JSON array starting with [ and ending with ]. Do NOT truncate photo references or any other data.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    // Remove markdown code blocks if present
    let jsonText = text.trim();

    // Remove markdown code blocks
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "").replace(/```\n?$/g, "");
    }

    // Find JSON array in the text (in case there's extra text)
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Clean up any potential issues
    jsonText = jsonText.trim();

    // Additional cleaning: remove trailing commas before closing brackets/braces
    jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1");

    // Remove any incomplete trailing objects (common AI mistake)
    const lastCompleteClose = jsonText.lastIndexOf("}");
    const lastArrayClose = jsonText.lastIndexOf("]");
    if (lastCompleteClose > lastArrayClose) {
      // There might be incomplete objects, try to close the array properly
      jsonText = jsonText.substring(0, lastCompleteClose + 1) + "\n]";
    }

    let rankedLocations;
    try {
      rankedLocations = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message);
      console.error(
        "Received text (first 1000 chars):",
        text.substring(0, 1000)
      );
      console.error(
        "Cleaned JSON text (first 1000 chars):",
        jsonText.substring(0, 1000)
      );

      // Try aggressive recovery strategies
      try {
        let recoveredJson = null;

        // Strategy 1: Find and extract complete array
        const arrayStart = jsonText.indexOf("[");
        const arrayEnd = jsonText.lastIndexOf("]");
        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          let potentialJson = jsonText.substring(arrayStart, arrayEnd + 1);

          // Strategy 2: Remove trailing commas
          potentialJson = potentialJson.replace(/,(\s*[}\]])/g, "$1");

          // Strategy 3: Try to find complete objects only
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
                    // Skip malformed object
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
            recoveredJson = objects;
            console.log(
              `✓ Recovered ${objects.length} valid objects from malformed JSON`
            );
          } else {
            // Fallback: try direct parse
            recoveredJson = JSON.parse(potentialJson);
            console.log("✓ Recovered JSON from response using direct parse");
          }
        }

        if (recoveredJson) {
          rankedLocations = Array.isArray(recoveredJson)
            ? recoveredJson
            : [recoveredJson];
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

    // Ensure we only return top 5
    return rankedLocations.slice(0, 5);
  } catch (error) {
    console.error("Gemini AI ranking error:", error);
    throw new Error(`Failed to rank locations with AI: ${error.message}`);
  }
};

/**
 * Main AI Agent function to find and rank filming locations
 * @param {string} description - Scene description to find locations for
 * @param {object} options - Optional parameters (forceRefresh, maxResults, etc.)
 * @returns {Promise<object>} - Top 5 ranked locations with metadata
 */
export const findAndRankLocations = async (description, options = {}) => {
  const startTime = Date.now();
  const { forceRefresh = false, maxResults = 5 } = options;

  if (!description || description.trim().length === 0) {
    throw new Error("Description is required");
  }

  const descriptionHash = generateDescriptionHash(description);

  // Check cache first (unless forceRefresh is true)
  if (!forceRefresh) {
    const cached = await AIRecommendation.findOne({ descriptionHash });
    if (cached) {
      await cached.recordAccess();
      console.log(
        `✅ Cache hit for description hash: ${descriptionHash.substring(
          0,
          8
        )}...`
      );
      return {
        success: true,
        cached: true,
        description: cached.description,
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

  console.log(`🔍 Processing new request for: "${description}"`);

  // Step 1: Search Google Places API
  console.log("📍 Searching Google Places API...");
  let places = await searchPlacesWithGoogleAPI(description);
  const initialPlacesCount = places.length;
  console.log(`Found ${initialPlacesCount} places from text search`);

  // Step 2: If we have at least one result, search nearby for more options
  if (places.length > 0 && places.length < 20) {
    console.log("📍 Searching nearby places for more options...");
    const firstLocation = places[0].geometry?.location;
    if (firstLocation) {
      const nearbyPlaces = await searchNearbyPlaces(firstLocation, description);
      console.log(`Found ${nearbyPlaces.length} additional nearby places`);

      // Merge and deduplicate by place_id
      const placeIds = new Set(places.map((p) => p.place_id));
      const newPlaces = nearbyPlaces.filter((p) => !placeIds.has(p.place_id));
      places = [...places, ...newPlaces];
    }
  }

  console.log(`📊 Total places found: ${places.length}`);

  if (places.length === 0) {
    throw new Error("No locations found matching the description");
  }

  // Limit to top 20 places for AI analysis (to manage API costs and processing time)
  const placesToAnalyze = places.slice(0, 20);
  console.log(
    `🤖 Analyzing top ${placesToAnalyze.length} locations with Gemini AI...`
  );

  // Step 3: Rank locations using Gemini AI
  const rankedLocations = await rankLocationsWithGemini(
    description,
    placesToAnalyze
  );
  console.log(`✨ Gemini ranked ${rankedLocations.length} locations`);

  const processingTime = Date.now() - startTime;

  // Step 4: Cache the results (optional - continues if cache fails)
  let cacheStatus = "not-saved";
  try {
    const recommendation = new AIRecommendation({
      description,
      descriptionHash,
      results: rankedLocations,
      metadata: {
        totalPlacesFound: places.length,
        totalPlacesAnalyzed: placesToAnalyze.length,
        processingTime,
        apiCalls: {
          googlePlaces: places.length > initialPlacesCount ? 2 : 1,
          gemini: 1,
        },
      },
    });

    await recommendation.save();
    console.log(`💾 Cached results for future use (expires in 7 days)`);
    cacheStatus = "saved";
  } catch (cacheError) {
    console.warn(
      `⚠️  Cache save failed (continuing without cache):`,
      cacheError.message
    );
    cacheStatus = "failed";
  }

  return {
    success: true,
    cached: false,
    cacheStatus,
    description,
    results: rankedLocations.slice(0, maxResults),
    metadata: {
      totalPlacesFound: places.length,
      totalPlacesAnalyzed: placesToAnalyze.length,
      processingTime,
      apiCalls: {
        googlePlaces: places.length > initialPlacesCount ? 2 : 1,
        gemini: 1,
      },
    },
  };
};

/**
 * Clear expired cache entries manually
 */
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

/**
 * Get cache statistics
 */
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

/**
 * Check if AI agent is properly configured
 */
export const isAIAgentAvailable = () => {
  return !!(process.env.GEMINI_API_KEY && process.env.GOOGLE_MAPS_API_KEY);
};

export default {
  findAndRankLocations,
  clearExpiredCache,
  getCacheStats,
  isAIAgentAvailable,
};
