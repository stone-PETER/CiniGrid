import PotentialLocation from "../models/PotentialLocation.js";
import FinalizedLocation from "../models/FinalizedLocation.js";
import LocationRequirement from "../models/LocationRequirement.js";
import ProjectMember from "../models/ProjectMember.js";
import {
  fetchLocationEnrichmentData,
  calculateDistance,
} from "../services/googlePlacesService.js";
import { fetchWeatherData } from "../services/weatherService.js";
import {
  extractAmenities,
  estimateLocationExpense,
} from "../services/aiService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiClient = null;
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Enrich location with cached API data (if cache expired or missing)
 * @param {Object} location - Location document
 * @returns {Promise<Object>} Enriched location data
 */
async function enrichLocationData(location) {
  const needsEnrichment =
    !location.cachedData ||
    !location.cachedData.cacheExpiry ||
    new Date(location.cachedData.cacheExpiry) < new Date();

  if (needsEnrichment) {
    console.log(`🔄 Enriching location data for: ${location.title}`);

    // Fetch Google Places and Weather data
    const enrichmentData = await fetchLocationEnrichmentData(
      location.coordinates.lat,
      location.coordinates.lng
    );

    const weatherData = await fetchWeatherData(
      location.coordinates.lat,
      location.coordinates.lng
    );

    // Extract amenities if not already done
    if (!location.amenities || !location.amenities.extractedAt) {
      const amenities = await extractAmenities(
        location.description,
        location.address || ""
      );
      location.amenities = amenities;
    }

    // Estimate budget if not set
    if (!location.budget || !location.budget.dailyRate) {
      const budgetEstimate = await estimateLocationExpense(
        location.description,
        location.address || "",
        location.googleTypes?.[0] || ""
      );
      location.budget = {
        dailyRate: budgetEstimate.dailyRate,
        estimatedMin: budgetEstimate.estimatedMin,
        estimatedMax: budgetEstimate.estimatedMax,
        confidence: budgetEstimate.confidence,
        reasoning: budgetEstimate.reasoning,
        currency: budgetEstimate.currency,
        lastUpdated: budgetEstimate.lastUpdated,
      };
    }

    // Update cached data
    location.cachedData = {
      ...enrichmentData,
      weather: weatherData,
    };

    await location.save();
    console.log(`✅ Enrichment complete for: ${location.title}`);
  }

  return location;
}

/**
 * Calculate distances to finalized locations
 * @param {Object} location - Potential location
 * @param {Array} finalizedLocations - Array of finalized locations
 * @returns {Array} Distance data
 */
function calculateDistancesToFinalized(location, finalizedLocations) {
  return finalizedLocations.map((finalized) => {
    const distance = calculateDistance(
      location.coordinates.lat,
      location.coordinates.lng,
      finalized.coordinates.lat,
      finalized.coordinates.lng
    );

    return {
      locationId: finalized._id,
      locationName: finalized.title,
      distance: distance,
    };
  });
}

/**
 * Calculate comparison scores for a location
 * @param {Object} location - Location document
 * @param {Object} requirement - Location requirement
 * @param {Object} weights - User-defined weights {budget, similarity, crewAccess, transportation}
 * @returns {Object} Scores object
 */
function calculateScores(location, requirement, weights) {
  const scores = {
    budget: 0,
    similarity: 0,
    crewAccess: 0,
    transportation: 0,
  };

  // Budget Score (0-10): Lower cost = higher score
  if (location.budget && location.budget.dailyRate) {
    const rate = location.budget.dailyRate;
    const maxBudget = requirement?.budget?.max || 2000; // Default max $2000/day

    if (rate <= maxBudget) {
      // Linear scale: $0 = 10 points, maxBudget = 5 points
      scores.budget = Math.max(5, 10 - (rate / maxBudget) * 5);
    } else {
      // Over budget: decreasing score
      const overBudgetRatio = rate / maxBudget;
      scores.budget = Math.max(0, 5 - overBudgetRatio * 2);
    }
  } else {
    scores.budget = 5; // Neutral score if no budget data
  }

  // Similarity Score (0-10): Based on description match to requirement
  // This is simplified - in production, use vector similarity or LLM comparison
  if (requirement && requirement.prompt) {
    const prompt = requirement.prompt.toLowerCase();
    const description = (location.description || "").toLowerCase();
    const title = (location.title || "").toLowerCase();

    // Simple keyword matching (can be improved with NLP)
    const promptWords = prompt.split(/\s+/).filter((w) => w.length > 3);
    const matchCount = promptWords.filter(
      (word) => description.includes(word) || title.includes(word)
    ).length;

    scores.similarity = Math.min(
      10,
      (matchCount / Math.max(promptWords.length, 1)) * 10
    );
  } else {
    scores.similarity = 5; // Neutral if no requirement
  }

  // Crew Access Score (0-10): Based on nearby hotels/restaurants
  if (location.cachedData) {
    const hotels = location.cachedData.nearbyHotels || [];
    const restaurants = location.cachedData.nearbyRestaurants || [];

    const avgHotelDistance =
      hotels.length > 0
        ? hotels.reduce((sum, h) => sum + h.distance, 0) / hotels.length
        : 10;
    const avgRestaurantDistance =
      restaurants.length > 0
        ? restaurants.reduce((sum, r) => sum + r.distance, 0) /
          restaurants.length
        : 10;

    // Closer = better (within 3 miles is ideal)
    const hotelScore = Math.max(0, 10 - avgHotelDistance * 2);
    const restaurantScore = Math.max(0, 10 - avgRestaurantDistance * 3);

    scores.crewAccess = (hotelScore + restaurantScore) / 2;
  } else {
    scores.crewAccess = 5; // Neutral if no data
  }

  // Transportation Score (0-10): Based on public transit and parking
  if (location.cachedData && location.cachedData.transportation) {
    const transport = location.cachedData.transportation;
    let score = 0;

    // Metro access (40% weight)
    if (transport.nearestMetro) {
      const metroDistance = transport.nearestMetro.distance;
      score += Math.max(0, 4 - metroDistance * 2); // Closer = better
    }

    // Bus access (30% weight)
    if (transport.nearestBusStop) {
      const busDistance = transport.nearestBusStop.distance;
      score += Math.max(0, 3 - busDistance * 3);
    }

    // Parking (30% weight)
    const parkingCount = transport.parkingFacilities?.length || 0;
    score += Math.min(3, parkingCount); // More parking = better

    scores.transportation = Math.min(10, score);
  } else {
    scores.transportation = 5; // Neutral if no data
  }

  // Calculate weighted overall score
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const overall =
    (scores.budget * weights.budget +
      scores.similarity * weights.similarity +
      scores.crewAccess * weights.crewAccess +
      scores.transportation * weights.transportation) /
    totalWeight;

  return {
    overall: Math.round(overall * 10) / 10,
    budget: Math.round(scores.budget * 10) / 10,
    similarity: Math.round(scores.similarity * 10) / 10,
    crewAccess: Math.round(scores.crewAccess * 10) / 10,
    transportation: Math.round(scores.transportation * 10) / 10,
    lastCalculated: new Date(),
  };
}

/**
 * Generate AI recommendation for location comparison
 * @param {Array} rankedLocations - Array of locations with scores
 * @param {Object} requirement - Location requirement
 * @returns {Promise<string>} AI recommendation text
 */
async function generateAIRecommendation(rankedLocations, requirement) {
  if (!geminiClient || rankedLocations.length === 0) {
    return "No recommendations available.";
  }

  try {
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const locationsData = rankedLocations.slice(0, 5).map((loc, index) => ({
      rank: index + 1,
      name: loc.title,
      score: loc.comparisonScore.overall,
      budget: loc.budget?.dailyRate || "Unknown",
      similarity: loc.comparisonScore.similarity,
      crewAccess: loc.comparisonScore.crewAccess,
      transportation: loc.comparisonScore.transportation,
      nearbyHotels: loc.cachedData?.nearbyHotels?.length || 0,
      nearbyRestaurants: loc.cachedData?.nearbyRestaurants?.length || 0,
    }));

    const prompt = `You are an expert location manager providing recommendations for filming locations.

Requirement: ${requirement?.prompt || "General location search"}
Budget Limit: $${requirement?.budget?.max || "Not specified"}/day
Priority: ${requirement?.priority || "Medium"}

Top Locations (ranked by overall score):
${JSON.stringify(locationsData, null, 2)}

Based on this data, provide a 3-4 sentence recommendation explaining:
1. Which location is the best overall choice and why
2. Which location offers the best value for budget
3. Any important trade-offs to consider

Keep it concise and actionable. Focus on practical production considerations.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating AI recommendation:", error.message);
    return "Unable to generate AI recommendation at this time.";
  }
}

/**
 * Compare all potential locations for a requirement
 * POST /api/locations/compare/:requirementId
 */
export const compareLocations = async (req, res) => {
  try {
    const { requirementId } = req.params;
    const userId = req.userId;
    const {
      weights = {
        budget: 30,
        similarity: 35,
        crewAccess: 20,
        transportation: 15,
      },
    } = req.body;

    // Get requirement
    const requirement = await LocationRequirement.findById(requirementId);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: "Location requirement not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: requirement.projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    console.log(
      `📊 Comparing locations for requirement: ${requirement.prompt}`
    );

    // Get all potential locations for this requirement
    const potentialLocations = await PotentialLocation.find({
      projectId: requirement.projectId,
      requirementId: requirementId,
    });

    if (potentialLocations.length === 0) {
      return res.json({
        success: true,
        message: "No potential locations found for this requirement",
        data: {
          locations: [],
          recommendation: "",
          requirement: requirement,
        },
      });
    }

    // Get finalized locations for distance calculations
    const finalizedLocations = await FinalizedLocation.find({
      projectId: requirement.projectId,
    });

    // Enrich and score each location
    const enrichedLocations = [];
    for (const location of potentialLocations) {
      // Enrich with cached data
      const enriched = await enrichLocationData(location);

      // Calculate distances to finalized locations
      if (finalizedLocations.length > 0) {
        enriched.cachedData.distanceToFinalizedLocations =
          calculateDistancesToFinalized(enriched, finalizedLocations);
      }

      // Calculate comparison scores
      enriched.comparisonScore = calculateScores(
        enriched,
        requirement,
        weights
      );

      // Save updates
      await enriched.save();

      enrichedLocations.push(enriched);
    }

    // Sort by overall score (highest first)
    const rankedLocations = enrichedLocations.sort(
      (a, b) => b.comparisonScore.overall - a.comparisonScore.overall
    );

    // Generate AI recommendation
    const aiRecommendation = await generateAIRecommendation(
      rankedLocations,
      requirement
    );

    res.json({
      success: true,
      message: `Compared ${rankedLocations.length} locations`,
      data: {
        locations: rankedLocations,
        recommendation: aiRecommendation,
        requirement: requirement,
        weights: weights,
      },
    });
  } catch (error) {
    console.error("Compare locations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to compare locations: " + error.message,
    });
  }
};

/**
 * Get all location requirements for a project
 * GET /api/locations/requirements/:projectId
 */
export const getLocationRequirements = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    // Check project access
    const member = await ProjectMember.findOne({
      projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    const requirements = await LocationRequirement.find({ projectId }).sort({
      createdAt: -1,
    });

    // Get counts of potential locations for each requirement
    for (const req of requirements) {
      const count = await PotentialLocation.countDocuments({
        projectId: projectId,
        requirementId: req._id,
      });
      req.potentialLocationsCount = count;
    }

    res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    console.error("Get location requirements error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch location requirements",
    });
  }
};

/**
 * Create a new location requirement
 * POST /api/locations/requirements
 */
export const createLocationRequirement = async (req, res) => {
  try {
    const userId = req.userId;
    const { projectId, prompt, notes, priority, budget, constraints } =
      req.body;

    // Check project access
    const member = await ProjectMember.findOne({
      projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    const requirement = new LocationRequirement({
      projectId,
      prompt,
      notes: notes || "",
      priority: priority || "Medium",
      budget: budget || {},
      constraints: constraints || {},
      createdBy: userId,
    });

    await requirement.save();

    res.status(201).json({
      success: true,
      message: "Location requirement created successfully",
      data: requirement,
    });
  } catch (error) {
    console.error("Create location requirement error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create location requirement",
    });
  }
};

/**
 * Update a location requirement
 * PATCH /api/locations/requirements/:requirementId
 */
export const updateLocationRequirement = async (req, res) => {
  try {
    const { requirementId } = req.params;
    const userId = req.userId;
    const updates = req.body;

    const requirement = await LocationRequirement.findById(requirementId);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: "Location requirement not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: requirement.projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    // Update allowed fields
    const allowedFields = [
      "prompt",
      "notes",
      "priority",
      "budget",
      "constraints",
      "status",
    ];
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        requirement[field] = updates[field];
      }
    });

    await requirement.save();

    res.json({
      success: true,
      message: "Location requirement updated successfully",
      data: requirement,
    });
  } catch (error) {
    console.error("Update location requirement error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update location requirement",
    });
  }
};

/**
 * Delete a location requirement
 * DELETE /api/locations/requirements/:requirementId
 */
export const deleteLocationRequirement = async (req, res) => {
  try {
    const { requirementId } = req.params;
    const userId = req.userId;

    const requirement = await LocationRequirement.findById(requirementId);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: "Location requirement not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: requirement.projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    await LocationRequirement.findByIdAndDelete(requirementId);

    res.json({
      success: true,
      message: "Location requirement deleted successfully",
    });
  } catch (error) {
    console.error("Delete location requirement error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete location requirement",
    });
  }
};

/**
 * Manually refresh cached data for a location
 * POST /api/locations/:locationId/refresh-cache
 */
export const refreshLocationCache = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.userId;

    const location = await PotentialLocation.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Location not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: location.projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    // Force refresh by clearing cache
    location.cachedData = undefined;
    await location.save();

    // Enrich with fresh data
    const enriched = await enrichLocationData(location);

    res.json({
      success: true,
      message: "Location cache refreshed successfully",
      data: enriched,
    });
  } catch (error) {
    console.error("Refresh location cache error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh location cache",
    });
  }
};
