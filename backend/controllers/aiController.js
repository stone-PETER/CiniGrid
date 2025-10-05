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
      projectId, // NEW: project-scoped searches
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

    // projectId is optional for backward compatibility, but recommended
    if (!projectId) {
      console.warn(
        "⚠️ AI search without projectId - results won't be project-scoped"
      );
    }

    // Check if AI Agent is available and user doesn't explicitly want mock
    const useRealAI = isAIAgentAvailable() && !useMock;

    let suggestions;
    let cached = false;
    let metadata = null;

    if (useRealAI) {
      // Use real AI Agent with Google Places + Gemini
      console.log(
        `🤖 Using real AI Agent for location recommendations${
          projectId ? ` (project: ${projectId})` : ""
        }`
      );

      const result = await findAndRankLocations(prompt, {
        projectId, // Pass projectId for project-scoped caching
        userId: req.user.id,
        forceRefresh,
        maxResults: Math.min(maxResults, 10),
      });

      // Transform AI Agent results to match the expected format
      suggestions = result.results.map((location) => ({
        title: location.name,
        name: location.name, // Keep both for compatibility
        description: location.reason || location.description,
        reason: location.reason,
        coordinates: location.coordinates,
        region: location.address || "Location address",
        address: location.address,
        tags: location.tags || location.types || ["location"],
        rating: location.rating, // Gemini rating 0-10

        // NEW HYBRID FIELDS
        verified: location.verified || false, // Whether Google Places verified
        placeId: location.placeId || null, // Google Place ID
        mapsLink: location.mapsLink || null, // Google Maps link
        photos: location.photos || [], // Array of photo objects with urls
        googleTypes: location.googleTypes || [],

        // Filming details from Gemini
        filmingDetails: location.filmingDetails || {},
        estimatedCost: location.estimatedCost || null,

        // Permits from Gemini (with full details)
        permits: location.permits || [
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

        // Legacy fields for backward compatibility
        images: location.photos?.map((photo) => photo.url) || [],
        confidence: location.rating ? location.rating / 10 : 0.5, // Convert 0-10 rating to 0-1 confidence
        additionalInfo: location.additionalInfo || {},
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
