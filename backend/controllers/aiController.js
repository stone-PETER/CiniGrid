import {
  findAndRankLocations,
  isAIAgentAvailable,
} from "../services/aiAgent.js";
import mockAiService from "../services/mockAiService.js";

// Search for location suggestions using AI Agent (or fallback to mock)
export const searchLocations = async (req, res) => {
  try {
    const {
      prompt,
      forceRefresh = false,
      maxResults = 5,
      useMock = false,
    } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required and must be a non-empty string.",
      });
    }

    // Check if AI Agent is available and user doesn't explicitly want mock
    const useRealAI = isAIAgentAvailable() && !useMock;

    let suggestions;
    let cached = false;
    let metadata = null;

    if (useRealAI) {
      // Use real AI Agent with Google Places + Gemini
      console.log("🤖 Using real AI Agent for location recommendations");

      const result = await findAndRankLocations(prompt, {
        forceRefresh,
        maxResults: Math.min(maxResults, 10),
      });

      // Transform AI Agent results to match the expected format
      suggestions = result.results.map((location) => ({
        title: location.name,
        description: location.reason,
        coordinates: location.coordinates,
        region: location.address || "Location address",
        tags: location.types || ["location"],
        rating: location.rating,
        placeId: location.placeId,
        address: location.address,
        photos: location.photos || [],
        additionalInfo: location.additionalInfo || {},
        permits: [
          {
            name: "Local Filming Permit",
            required: true,
            notes: "Contact local authorities for filming permissions",
          },
          {
            name: "Property Owner Permission",
            required: true,
            notes: "Obtain permission from property owner/manager",
          },
        ],
        images: location.photos?.map((photo) => photo.photoReference) || [],
        confidence: location.rating / 10, // Convert 0-10 rating to 0-1 confidence
        createdAt: new Date(),
      }));

      cached = result.cached;
      metadata = result.metadata;
    } else {
      // Fallback to mock AI service
      console.log("⚠️ AI Agent not available, using mock data");
      suggestions = await mockAiService.searchLocations(prompt);
    }

    res.json({
      success: true,
      data: {
        prompt,
        suggestions,
        count: suggestions.length,
        source: useRealAI ? "ai-agent" : "mock",
        cached: cached || false,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    console.error("AI search error:", error);

    // Fallback to mock data on error
    try {
      console.log("⚠️ Error with AI Agent, falling back to mock data");
      const suggestions = await mockAiService.searchLocations(req.body.prompt);

      return res.json({
        success: true,
        data: {
          prompt: req.body.prompt,
          suggestions,
          count: suggestions.length,
          source: "mock",
          fallback: true,
          error: error.message,
        },
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        error: "Internal server error during AI search.",
        details: error.message,
      });
    }
  }
};
