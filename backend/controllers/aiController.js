import mockAiService from '../services/mockAiService.js';

// Search for location suggestions using mock AI
export const searchLocations = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a non-empty string.'
      });
    }

    // Get suggestions from mock AI service
    const suggestions = await mockAiService.searchLocations(prompt);

    res.json({
      success: true,
      data: {
        prompt,
        suggestions,
        count: suggestions.length
      }
    });
  } catch (error) {
    console.error('AI search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during AI search.'
    });
  }
};