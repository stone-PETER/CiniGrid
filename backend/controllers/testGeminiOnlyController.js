/**
 * TEST CONTROLLER: Pure Gemini AI Location Recommendations
 *
 * This controller handles requests for AI-generated locations
 * WITHOUT using Google Places API. Pure Gemini creativity!
 */

import { generateLocationsWithGeminiOnly } from "../services/testGeminiOnlyService.js";

/**
 * Test endpoint: Generate locations using only Gemini AI
 * POST /api/ai/test-gemini-only
 */
export const testGeminiOnly = async (req, res) => {
  try {
    const { description, maxResults = 5, region = "India" } = req.body;

    // Validate input
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Description is required",
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Description must be less than 1000 characters",
      });
    }

    console.log(`\n🧪 TEST REQUEST - Gemini Only Generation`);
    console.log(
      `Description: "${description.substring(0, 100)}${
        description.length > 100 ? "..." : ""
      }"`
    );
    console.log(`Max Results: ${maxResults}`);
    console.log(`Region: ${region}`);

    // Generate locations with Gemini only (no Google Places)
    const result = await generateLocationsWithGeminiOnly(description, {
      maxResults: parseInt(maxResults) || 5,
      region: region || "India",
    });

    console.log(`✅ Test successful: ${result.count} locations generated`);
    console.log(`Processing time: ${result.metadata.processingTime}\n`);

    return res.status(200).json({
      success: true,
      data: {
        suggestions: result.locations,
        count: result.count,
        metadata: result.metadata,
      },
      message: `Generated ${result.count} AI-only location recommendations`,
    });
  } catch (error) {
    console.error("❌ Test Gemini-only error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate locations with Gemini",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Compare Gemini-only vs Full AI Agent (with Google Places)
 * POST /api/ai/test-compare
 */
export const testCompare = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Description is required",
      });
    }

    console.log(`\n🔬 COMPARISON TEST`);
    console.log(`Description: "${description}"`);

    // Run both methods in parallel
    const [geminiOnly, fullAgent] = await Promise.allSettled([
      generateLocationsWithGeminiOnly(description, { maxResults: 3 }),
      // Import and use full AI agent if needed
      Promise.resolve({
        success: true,
        locations: [],
        count: 0,
        metadata: { note: "Full AI agent comparison not implemented yet" },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        geminiOnly:
          geminiOnly.status === "fulfilled"
            ? geminiOnly.value
            : { error: geminiOnly.reason },
        fullAgent:
          fullAgent.status === "fulfilled"
            ? fullAgent.value
            : { error: fullAgent.reason },
      },
      message: "Comparison complete",
    });
  } catch (error) {
    console.error("❌ Comparison test error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  testGeminiOnly,
  testCompare,
};
