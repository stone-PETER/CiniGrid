/**
 * TEST IMPLEMENTATION: Pure Gemini AI Location Recommendations
 *
 * This service generates location recommendations directly from Gemini AI
 * WITHOUT using Google Places API. Gemini creates fictional/hypothetical
 * locations based on the scene description.
 *
 * Use Case: Testing, demos, no API rate limits, faster responses
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

let geminiClient = null;

/**
 * Initialize Gemini client lazily
 */
const getGeminiClient = () => {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  if (!geminiClient) {
    throw new Error("Gemini API key not configured");
  }

  return geminiClient;
};

/**
 * Generate location recommendations directly from Gemini (no Google Places)
 * @param {string} description - Scene description
 * @param {object} options - Optional parameters
 * @returns {Promise<object>} - AI-generated locations
 */
export const generateLocationsWithGeminiOnly = async (
  description,
  options = {}
) => {
  const startTime = Date.now();
  const { maxResults = 5, region = "India" } = options;

  if (!description || description.trim().length === 0) {
    throw new Error("Description is required");
  }

  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const prompt = `You are an expert location scout for film and TV production. You have deep knowledge of filming locations worldwide.

Scene Description: "${description}"

Generate ${maxResults} REALISTIC filming locations that would be perfect for this scene. These should be real-sounding places (you can base them on real locations you know about), but you will provide ALL the details including:

CRITICAL REQUIREMENTS:
1. Generate COMPLETE location information (name, full address with city/state/country, realistic coordinates)
2. Base locations primarily in ${region} (but can suggest other regions if particularly suitable)
3. Provide detailed reasoning for why each location is perfect
4. Include realistic details: permits needed, accessibility notes, best filming times
5. Rate each location 0-10 for suitability
6. Generate realistic photo descriptions (what the location looks like)

Return ONLY valid JSON (no markdown, no code blocks). Each location must have this EXACT structure:

[
  {
    "name": "Actual location name or descriptive name",
    "address": "Complete street address, City, State/Province, Country, Postal Code",
    "coordinates": {
      "lat": <realistic latitude>,
      "lng": <realistic longitude>
    },
    "reason": "Detailed 3-4 sentence explanation of why this location is perfect for the scene. Mention specific visual features, atmosphere, practical considerations, and unique advantages.",
    "rating": <number 0-10>,
    "placeType": "Category of location (e.g., historic building, modern office, outdoor park, etc.)",
    "photos": [
      {
        "description": "Detailed description of what this view shows",
        "angle": "front/aerial/interior/side view",
        "lighting": "golden hour/midday/overcast/evening"
      }
    ],
    "filmingDetails": {
      "permits": [
        {
          "name": "Permit name",
          "required": true/false,
          "estimatedCost": "Cost range or 'Free'",
          "processingTime": "Time to obtain"
        }
      ],
      "accessibility": "Description of how easy it is to access with film equipment",
      "parking": "Parking availability details",
      "nearbyAmenities": ["List", "of", "nearby", "facilities"],
      "bestTimeToFilm": "Recommended time of day/season",
      "crowdLevel": "Expected crowd levels",
      "powerAccess": "Availability of electrical power",
      "restrictions": ["Any", "filming", "restrictions"]
    },
    "surroundings": "Description of the surrounding area and what else is nearby",
    "weatherConsiderations": "Weather-related filming considerations",
    "similarLocations": ["Names of 2-3 similar alternative locations"],
    "estimatedDailyRate": "Estimated cost to film here per day (or 'Public - Free' or 'Negotiable')"
  }
]

IMPORTANT JSON RULES:
- NO trailing commas
- ALL strings must be properly escaped
- Return ONLY the JSON array (starting with [ and ending with ])
- Each object must be complete (no truncation)
- Coordinates must be realistic for the region specified
- Make it as detailed and professional as possible

Generate locations now:`;

    console.log(
      `🤖 Requesting pure Gemini AI recommendations for: "${description.substring(
        0,
        50
      )}..."`
    );

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response (same cleaning logic as original)
    let jsonText = text.trim();

    // Remove markdown code blocks
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "").replace(/```\n?$/g, "");
    }

    // Find JSON array
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Clean up
    jsonText = jsonText.trim();
    jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas

    let locations;
    try {
      locations = JSON.parse(jsonText);
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

      // Try aggressive recovery
      try {
        const arrayStart = jsonText.indexOf("[");
        const arrayEnd = jsonText.lastIndexOf("]");
        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          let potentialJson = jsonText.substring(arrayStart, arrayEnd + 1);
          potentialJson = potentialJson.replace(/,(\s*[}\]])/g, "$1");

          // Extract complete objects only
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

    // Ensure we have valid array
    if (!Array.isArray(locations)) {
      throw new Error("AI response is not an array");
    }

    // Validate and enrich each location
    const validatedLocations = locations
      .slice(0, maxResults)
      .map((loc, index) => {
        // Ensure required fields exist
        if (!loc.name || !loc.reason || !loc.coordinates) {
          console.warn(`⚠️ Skipping incomplete location at index ${index}`);
          return null;
        }

        return {
          id: `gemini-${Date.now()}-${index}`,
          source: "gemini-ai-only",
          generatedAt: new Date().toISOString(),
          ...loc,
          // Ensure rating is a number
          rating:
            typeof loc.rating === "number"
              ? loc.rating
              : parseFloat(loc.rating) || 0,
          // Add default values for optional fields
          photos: loc.photos || [],
          filmingDetails: loc.filmingDetails || {},
          surroundings: loc.surroundings || "",
          weatherConsiderations: loc.weatherConsiderations || "",
          similarLocations: loc.similarLocations || [],
          estimatedDailyRate: loc.estimatedDailyRate || "Contact for pricing",
        };
      })
      .filter((loc) => loc !== null); // Remove any null entries

    const processingTime = Date.now() - startTime;

    console.log(
      `✅ Generated ${validatedLocations.length} locations with Gemini AI in ${processingTime}ms`
    );

    return {
      success: true,
      locations: validatedLocations,
      count: validatedLocations.length,
      metadata: {
        source: "gemini-ai-only",
        model: "gemini-2.5-flash-lite",
        processingTime: `${processingTime}ms`,
        description: description,
        region: region,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Gemini-only generation error:", error);
    throw new Error(
      `Failed to generate locations with Gemini: ${error.message}`
    );
  }
};

export default {
  generateLocationsWithGeminiOnly,
};
