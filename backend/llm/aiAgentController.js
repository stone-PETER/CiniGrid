import {
  findAndRankLocations,
  clearExpiredCache,
  getCacheStats,
  isAIAgentAvailable,
} from "../services/aiAgent.js";

// @desc    Find and rank locations using AI Agent
// @route   POST /api/ai-agent/find-locations
// @access  Private
export const findLocations = async (req, res) => {
  try {
    const { description, forceRefresh = false, maxResults = 5 } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!isAIAgentAvailable()) {
      return res.status(503).json({
        success: false,
        message:
          "AI Agent service is not available. Please configure GEMINI_API_KEY and GOOGLE_MAPS_API_KEY.",
      });
    }

    // Call AI Agent service
    const result = await findAndRankLocations(description, {
      forceRefresh,
      maxResults,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("AI Agent find locations error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to find and rank locations",
    });
  }
};

// @desc    Get AI Agent cache statistics
// @route   GET /api/ai-agent/stats
// @access  Private (director, producer)
export const getStats = async (req, res) => {
  try {
    const stats = await getCacheStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get cache stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve cache statistics",
    });
  }
};

// @desc    Clear expired cache entries
// @route   DELETE /api/ai-agent/cache/expired
// @access  Private (director, producer)
export const clearCache = async (req, res) => {
  try {
    const deletedCount = await clearExpiredCache();

    res.json({
      success: true,
      message: `Cleared ${deletedCount} expired cache entries`,
      deletedCount,
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
    });
  }
};

// @desc    Check if AI Agent is available
// @route   GET /api/ai-agent/status
// @access  Public
export const checkStatus = async (req, res) => {
  try {
    const available = isAIAgentAvailable();

    res.json({
      success: true,
      available,
      message: available
        ? "AI Agent is ready"
        : "AI Agent is not configured. Please add GEMINI_API_KEY and GOOGLE_MAPS_API_KEY to .env",
      services: {
        gemini: !!process.env.GEMINI_API_KEY,
        googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
      },
    });
  } catch (error) {
    console.error("Check status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check AI Agent status",
    });
  }
};
