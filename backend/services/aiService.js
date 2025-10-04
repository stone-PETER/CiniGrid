import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// Initialize AI clients
let anthropicClient = null;
let openaiClient = null;

if (process.env.ANTHROPIC_API_KEY) {
  anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
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

    // Try Claude first, then OpenAI
    if (anthropicClient) {
      const message = await anthropicClient.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      response = message.content[0].text;
    } else if (openaiClient) {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      });

      response = completion.choices[0].message.content;
    } else {
      throw new Error("No AI API key configured");
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

    if (anthropicClient) {
      const message = await anthropicClient.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      response = message.content[0].text;
    } else if (openaiClient) {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
      });

      response = completion.choices[0].message.content;
    } else {
      throw new Error("No AI API key configured");
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
  return !!(anthropicClient || openaiClient);
};
