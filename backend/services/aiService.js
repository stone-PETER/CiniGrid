import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize AI clients
// Note: Only Gemini AI is currently used in this project
// Anthropic and OpenAI imports removed to avoid missing dependency errors
let geminiClient = null;

// Lazy initialization function to avoid premature warnings
function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

// Analyze location suitability
export const analyzeLocationSuitability = async (
  locationData,
  projectRequirements = ""
) => {
  try {
    const prompt = `You are an expert location scout for film and TV production. Analyze the following location for filming suitability:

Location Details:
- Name: ${locationData.name}
- Address: ${locationData.address}
- Category: ${locationData.category}
- Description: ${locationData.description}
- Features: ${locationData.features?.join(", ") || "None specified"}
- Accessibility: Parking: ${
      locationData.accessibility?.parking ? "Yes" : "No"
    }, Public Transport: ${
      locationData.accessibility?.publicTransport ? "Yes" : "No"
    }, Wheelchair Accessible: ${
      locationData.accessibility?.wheelchairAccessible ? "Yes" : "No"
    }

${projectRequirements ? `Project Requirements: ${projectRequirements}` : ""}

Please provide:
1. Overall suitability score (0-10)
2. A brief suitability summary (2-3 sentences)
3. Specific suggestions for filming (2-3 points)
4. Three key pros
5. Three key cons

Format your response as JSON with this structure:
{
  "visualAppeal": <number 0-10>,
  "suitability": "<brief summary>",
  "suggestions": "<filming suggestions>",
  "pros": ["<pro1>", "<pro2>", "<pro3>"],
  "cons": ["<con1>", "<con2>", "<con3>"]
}`;

    let response;

    // Use Gemini AI for analysis
    const client = getGeminiClient();
    if (client) {
      const model = client.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });

      const result = await model.generateContent(prompt);
      response = result.response.text();
    } else {
      throw new Error(
        "GEMINI_API_KEY not configured. Please add it to your .env file."
      );
    }

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        analyzed: true,
        analysisDate: new Date(),
        ...analysis,
      };
    }

    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error("AI analysis error:", error);
    throw error;
  }
};

// Generate location recommendations based on requirements
export const generateLocationRecommendations = async (
  requirements,
  availableLocations
) => {
  try {
    const locationsInfo = availableLocations.map((loc) => ({
      id: loc._id,
      name: loc.name,
      address: loc.address,
      category: loc.category,
      description: loc.description,
      features: loc.features,
      rating: loc.averageRating,
    }));

    const prompt = `You are an expert location scout. Given the following project requirements and available locations, recommend the best matches and explain why.

Project Requirements:
${JSON.stringify(requirements, null, 2)}

Available Locations:
${JSON.stringify(locationsInfo, null, 2)}

For each suitable location, provide:
1. Location ID
2. Match score (0-100)
3. Brief reasoning (2-3 sentences)

Format your response as JSON array:
[
  {
    "locationId": "<id>",
    "score": <number>,
    "reasoning": "<explanation>"
  }
]`;

    let response;

    // Use Gemini AI for recommendations
    const client = getGeminiClient();
    if (client) {
      const model = client.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });

      const result = await model.generateContent(prompt);
      response = result.response.text();
    } else {
      throw new Error(
        "GEMINI_API_KEY not configured. Please add it to your .env file."
      );
    }

    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error("AI recommendation error:", error);
    throw error;
  }
};

// Check if AI service is available
export const isAIAvailable = () => {
  return !!getGeminiClient();
};

/**
 * Extract amenities from location description and address using Gemini AI
 * @param {string} description - Location description
 * @param {string} address - Location address
 * @returns {Promise<Object>} Extracted amenities
 */
export const extractAmenities = async (description, address = "") => {
  const client = getGeminiClient();
  if (!client) {
    console.warn("⚠️ Gemini API not configured for amenity extraction");
    return {
      parking: false,
      wifi: false,
      power: false,
      kitchen: false,
      greenRoom: false,
      bathroom: false,
      loadingDock: false,
      cateringSpace: false,
      extractedAt: new Date(),
    };
  }

  try {
    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const prompt = `You are an expert location scout analyzing filming locations. Based on the following location information, determine which amenities are available.

Location Description: ${description}
Address: ${address}

Analyze the description and address to determine if the following amenities are present or likely available:

1. **Parking** - Onsite parking, parking lot, street parking, or mentions of parking availability
2. **WiFi** - Internet access, WiFi, wireless internet
3. **Power** - Electrical outlets, power access, industrial power, generator hookups
4. **Kitchen** - Full kitchen, kitchenette, food prep area
5. **Green Room** - Green room, dressing room, makeup room, preparation space for talent
6. **Bathroom** - Restrooms, bathrooms, facilities
7. **Loading Dock** - Loading dock, truck access, freight elevator, easy equipment loading
8. **Catering Space** - Space for catering setup, dining area, craft services area

Return ONLY valid JSON with this EXACT structure (no markdown, no explanation):
{
  "parking": true/false,
  "wifi": true/false,
  "power": true/false,
  "kitchen": true/false,
  "greenRoom": true/false,
  "bathroom": true/false,
  "loadingDock": true/false,
  "cateringSpace": true/false
}

Be conservative - only mark true if clearly mentioned or strongly implied.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean and parse JSON
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/```json\n?|\n?```/g, "");
    cleaned = cleaned.replace(/^[^{]*/, "");
    cleaned = cleaned.replace(/[^}]*$/, "");

    const amenities = JSON.parse(cleaned);

    return {
      ...amenities,
      extractedAt: new Date(),
    };
  } catch (error) {
    console.error("Error extracting amenities:", error.message);
    return {
      parking: false,
      wifi: false,
      power: false,
      kitchen: false,
      greenRoom: false,
      bathroom: false,
      loadingDock: false,
      cateringSpace: false,
      extractedAt: new Date(),
    };
  }
};

/**
 * Estimate location rental expense using Gemini AI
 * @param {string} description - Location description
 * @param {string} address - Location address
 * @param {string} locationType - Type of location (optional)
 * @returns {Promise<Object>} Expense estimation
 */
export const estimateLocationExpense = async (
  description,
  address = "",
  locationType = ""
) => {
  const client = getGeminiClient();
  if (!client) {
    console.warn("⚠️ Gemini API not configured for expense estimation");
    return {
      dailyRate: 0,
      estimatedMin: 0,
      estimatedMax: 0,
      confidence: "low",
      reasoning: "API not configured",
      currency: "USD",
      lastUpdated: new Date(),
    };
  }

  try {
    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const prompt = `You are an expert location manager with extensive knowledge of filming location rental rates in North America. Estimate the daily rental cost for this location.

Location Description: ${description}
Address: ${address}
${locationType ? `Type: ${locationType}` : ""}

Consider these factors in your estimation:
1. **Location/Neighborhood** - Premium areas (Beverly Hills, Manhattan) cost 2-5x more than suburban areas
2. **Property Type** - Mansions ($2000-5000/day), Homes ($500-2000/day), Offices ($500-1500/day), Coffee shops ($200-800/day), Warehouses ($300-1000/day)
3. **Size/Square Footage** - Larger spaces cost more
4. **Condition/Quality** - Upscale/renovated spaces command premium rates
5. **Amenities** - Parking, power, accessibility add value
6. **Market Rates** - Current industry standard rates

Provide a realistic estimate based on these factors.

Return ONLY valid JSON with this EXACT structure (no markdown, no explanation):
{
  "dailyRate": <number, best estimate in USD>,
  "estimatedMin": <number, conservative low estimate>,
  "estimatedMax": <number, high estimate>,
  "confidence": "<low/medium/high>",
  "reasoning": "<2-3 sentence explanation of your estimate>",
  "currency": "USD"
}

Example for a modern downtown coffee shop:
{
  "dailyRate": 600,
  "estimatedMin": 400,
  "estimatedMax": 800,
  "confidence": "medium",
  "reasoning": "Modern coffee shop in downtown area suggests $400-800/day range. Renovated spaces and trendy locations command mid-range rates. Estimate assumes standard filming hours and basic amenities.",
  "currency": "USD"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean and parse JSON
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/```json\n?|\n?```/g, "");
    cleaned = cleaned.replace(/^[^{]*/, "");
    cleaned = cleaned.replace(/[^}]*$/, "");

    const estimate = JSON.parse(cleaned);

    return {
      ...estimate,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error estimating expense:", error.message);
    return {
      dailyRate: 0,
      estimatedMin: 0,
      estimatedMax: 0,
      confidence: "low",
      reasoning: "Error estimating expense: " + error.message,
      currency: "USD",
      lastUpdated: new Date(),
    };
  }
};
