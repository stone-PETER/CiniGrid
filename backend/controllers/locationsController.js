import PotentialLocation from "../models/PotentialLocation.js";
import FinalizedLocation from "../models/FinalizedLocation.js";
import mockAiService from "../services/mockAiService.js";
import {
  findAndRankLocations,
  isAIAgentAvailable,
} from "../services/aiAgent.js";

// AI-powered location analysis
export const analyzeLocation = async (req, res) => {
  try {
    const { title, description, coordinates, region, sceneType } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: "Title and description are required for analysis.",
      });
    }

    // Check if AI Agent is available
    const useRealAI = isAIAgentAvailable();

    if (useRealAI) {
      try {
        // Use real AI to analyze and find similar locations
        const prompt = `${
          sceneType || "filming location"
        }: ${title}. ${description}. Location: ${region || "unspecified"}`;

        const result = await findAndRankLocations(prompt, {
          forceRefresh: true,
          maxResults: 5,
        });

        // Extract the top match for analysis
        const topMatch = result.results[0];

        return res.json({
          success: true,
          data: {
            analysis: {
              suitabilityScore: topMatch?.rating || 7.5,
              pros: [topMatch?.reason || "Good location for filming"],
              cons: ["Requires proper permits", "May need crew accommodations"],
              recommendations: result.results.slice(0, 3).map((loc) => ({
                name: loc.name,
                reason: loc.reason,
                rating: loc.rating,
              })),
            },
            similarLocations: result.results.slice(1, 4).map((loc) => ({
              title: loc.name,
              description: loc.reason,
              coordinates: loc.coordinates,
              region: loc.address,
              rating: loc.rating,
              placeId: loc.placeId,
            })),
            source: "ai-agent",
            cacheStatus: result.cacheStatus,
            metadata: result.metadata,
          },
        });
      } catch (aiError) {
        console.error(
          "AI analysis failed, falling back to mock:",
          aiError.message
        );
        // Fall through to mock response below
      }
    }

    // Fallback to mock analysis (if AI unavailable or failed)
    return res.json({
      success: true,
      data: {
        analysis: {
          suitabilityScore: 8.2,
          pros: [
            "Good accessibility for crew and equipment",
            "Authentic atmosphere for the scene",
            "Available natural lighting",
            "Cost-effective location",
          ],
          cons: [
            "May require special permits",
            "Weather dependent for outdoor scenes",
            "Limited parking for production vehicles",
          ],
          recommendations: [
            "Visit during golden hour for best lighting",
            "Obtain necessary filming permits in advance",
            "Scout for backup locations nearby",
          ],
        },
        similarLocations: [],
        source: "mock",
      },
    });
  } catch (error) {
    console.error("Analyze location error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during location analysis.",
      details: error.message,
    });
  }
};

// Get AI suggestions for similar locations
export const getSimilarLocations = async (req, res) => {
  try {
    const { id } = req.params;

    const location =
      (await PotentialLocation.findById(id)) ||
      (await FinalizedLocation.findById(id));

    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Location not found.",
      });
    }

    // Check if AI Agent is available
    const useRealAI = isAIAgentAvailable();

    if (useRealAI) {
      try {
        // Use real AI to find similar locations
        const prompt = `Similar to: ${location.title}. ${location.description}. Region: ${location.region}`;

        const result = await findAndRankLocations(prompt, {
          forceRefresh: false,
          maxResults: 5,
        });

        const suggestions = result.results.map((loc) => ({
          title: loc.name,
          description: loc.reason,
          coordinates: loc.coordinates,
          region: loc.address,
          rating: loc.rating,
          placeId: loc.placeId,
          tags: loc.types || [],
          confidence: loc.rating / 10,
        }));

        return res.json({
          success: true,
          data: {
            original: {
              title: location.title,
              region: location.region,
            },
            suggestions,
            count: suggestions.length,
            source: "ai-agent",
            cached: result.cached,
            cacheStatus: result.cacheStatus,
            metadata: result.metadata,
          },
        });
      } catch (aiError) {
        console.error(
          "AI similar locations failed, falling back to mock:",
          aiError.message
        );
        // Fall through to mock response below
      }
    }

    // Fallback to mock suggestions (if AI unavailable or failed)
    const mockSuggestions = await mockAiService.searchLocations(
      location.description
    );

    return res.json({
      success: true,
      data: {
        original: {
          title: location.title,
          region: location.region,
        },
        suggestions: mockSuggestions.slice(0, 3),
        count: mockSuggestions.length,
        source: "mock",
      },
    });
  } catch (error) {
    console.error("Get similar locations error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while finding similar locations.",
      details: error.message,
    });
  }
};

// AI-enhanced search for potential locations
export const searchPotentialLocations = async (req, res) => {
  try {
    const { query, tags, region, limit = 10 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Search query is required.",
      });
    }

    // Build MongoDB search query
    const searchQuery = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { region: { $regex: query, $options: "i" } },
      ],
    };

    if (tags && tags.length > 0) {
      searchQuery.tags = { $in: tags };
    }

    if (region) {
      searchQuery.region = { $regex: region, $options: "i" };
    }

    // Search existing locations
    const existingLocations = await PotentialLocation.find(searchQuery)
      .populate("addedBy", "username role")
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Check if AI Agent is available for additional suggestions
    const useRealAI = isAIAgentAvailable();
    let aiSuggestions = [];

    if (useRealAI && existingLocations.length < limit) {
      try {
        const result = await findAndRankLocations(query, {
          forceRefresh: false,
          maxResults: limit - existingLocations.length,
        });

        aiSuggestions = result.results.map((loc) => ({
          title: loc.name,
          description: loc.reason,
          coordinates: loc.coordinates,
          region: loc.address,
          rating: loc.rating,
          placeId: loc.placeId,
          tags: loc.types || [],
          source: "ai-suggestion",
          cached: result.cached,
        }));
      } catch (error) {
        console.error("AI suggestion error:", error);
        // Continue without AI suggestions
      }
    }

    res.json({
      success: true,
      data: {
        query,
        existingLocations,
        aiSuggestions,
        counts: {
          existing: existingLocations.length,
          aiSuggestions: aiSuggestions.length,
          total: existingLocations.length + aiSuggestions.length,
        },
        source: useRealAI ? "hybrid" : "database-only",
      },
    });
  } catch (error) {
    console.error("Search potential locations error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during location search.",
      details: error.message,
    });
  }
};

// Add location to potential list (from AI suggestion or manual data)
export const addToPotential = async (req, res) => {
  try {
    console.log("=== ADD TO POTENTIAL REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log(
      "User:",
      req.user
        ? { id: req.user._id, username: req.user.username, role: req.user.role }
        : "No user"
    );

    const { suggestionId, manualData } = req.body;

    let locationData;

    if (suggestionId) {
      // For this mock implementation, we'll get the suggestion data from the AI service
      // In a real app, you might store suggestions temporarily or fetch from a suggestions collection
      const suggestions = await mockAiService.searchLocations("dummy prompt");
      const suggestion = suggestions.find(
        (_, index) => index.toString() === suggestionId
      );

      if (!suggestion) {
        return res.status(404).json({
          success: false,
          error: "Suggestion not found.",
        });
      }

      locationData = {
        title: suggestion.title,
        description: suggestion.description,
        coordinates: suggestion.coordinates,
        region: suggestion.region,
        permits: suggestion.permits,
        images: suggestion.images || [],
        tags: suggestion.tags || [],
        addedBy: req.user._id,
      };
    } else if (manualData) {
      // Validate manual data
      const { title, description, coordinates, region } = manualData;
      if (!title || !description || !coordinates || !region) {
        return res.status(400).json({
          success: false,
          error: "Title, description, coordinates, and region are required.",
        });
      }

      // Transform permits array - handle both string array and object array formats
      let transformedPermits = [];
      if (manualData.permits && Array.isArray(manualData.permits)) {
        transformedPermits = manualData.permits
          .map((permit) => {
            if (typeof permit === "string") {
              // Transform string to permit object
              return {
                name: permit,
                required: true,
                notes: "",
              };
            } else if (permit && typeof permit === "object" && permit.name) {
              // Already in correct format
              return {
                name: permit.name,
                required:
                  permit.required !== undefined ? permit.required : true,
                notes: permit.notes || "",
              };
            } else {
              // Invalid permit format, skip
              console.warn("Invalid permit format:", permit);
              return null;
            }
          })
          .filter((permit) => permit !== null);
      }

      console.log("Transformed permits:", transformedPermits);

      locationData = {
        title: manualData.title,
        description: manualData.description,
        coordinates: manualData.coordinates,
        region: manualData.region,
        permits: transformedPermits,
        images: manualData.images || [],
        tags: manualData.tags || [],
        addedBy: req.user._id,
      };
    } else {
      return res.status(400).json({
        success: false,
        error: "Either suggestionId or manualData is required.",
      });
    }

    console.log(
      "Final location data to save:",
      JSON.stringify(locationData, null, 2)
    );

    const potentialLocation = new PotentialLocation(locationData);
    console.log("Created PotentialLocation instance");

    await potentialLocation.save();
    console.log("Successfully saved to database");

    await potentialLocation.populate("addedBy", "username role");
    console.log("Successfully populated addedBy field");

    res.status(201).json({
      success: true,
      data: { location: potentialLocation },
    });
  } catch (error) {
    console.error("=== ADD TO POTENTIAL ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Handle specific mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));

      console.error("Validation errors:", validationErrors);

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Duplicate location already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error while adding to potential locations.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all potential locations
export const getPotentialLocations = async (req, res) => {
  try {
    const locations = await PotentialLocation.find()
      .populate("addedBy", "username role")
      .populate("notes.author", "username role")
      .populate("approvals.userId", "username role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        locations,
        count: locations.length,
      },
    });
  } catch (error) {
    console.error("Get potential locations error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching potential locations.",
    });
  }
};

// Get single potential location
export const getPotentialLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await PotentialLocation.findById(id)
      .populate("addedBy", "username role")
      .populate("notes.author", "username role")
      .populate("approvals.userId", "username role");

    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Potential location not found.",
      });
    }

    res.json({
      success: true,
      data: { location },
    });
  } catch (error) {
    console.error("Get potential location error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching potential location.",
    });
  }
};

// Finalize a potential location
export const finalizeLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const potentialLocation = await PotentialLocation.findById(id);
    if (!potentialLocation) {
      return res.status(404).json({
        success: false,
        error: "Potential location not found.",
      });
    }

    // Create finalized location
    const finalizedLocationData = {
      title: potentialLocation.title,
      description: potentialLocation.description,
      coordinates: potentialLocation.coordinates,
      region: potentialLocation.region,
      permits: potentialLocation.permits,
      images: potentialLocation.images,
      addedBy: potentialLocation.addedBy,
      notes: potentialLocation.notes,
      approvals: potentialLocation.approvals,
      tags: potentialLocation.tags,
      finalizedBy: req.user._id,
      finalizedAt: new Date(),
    };

    const finalizedLocation = new FinalizedLocation(finalizedLocationData);
    await finalizedLocation.save();

    // Remove from potential locations
    await PotentialLocation.findByIdAndDelete(id);

    await finalizedLocation.populate([
      { path: "addedBy", select: "username role" },
      { path: "finalizedBy", select: "username role" },
      { path: "notes.author", select: "username role" },
      { path: "approvals.userId", select: "username role" },
    ]);

    res.json({
      success: true,
      data: { location: finalizedLocation },
    });
  } catch (error) {
    console.error("Finalize location error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while finalizing location.",
    });
  }
};

// Get all finalized locations
export const getFinalizedLocations = async (req, res) => {
  try {
    const locations = await FinalizedLocation.find()
      .populate("addedBy", "username role")
      .populate("finalizedBy", "username role")
      .populate("notes.author", "username role")
      .populate("approvals.userId", "username role")
      .sort({ finalizedAt: -1 });

    res.json({
      success: true,
      data: {
        locations,
        count: locations.length,
      },
    });
  } catch (error) {
    console.error("Get finalized locations error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching finalized locations.",
    });
  }
};

// Direct add to potential locations
export const directAddToPotential = async (req, res) => {
  try {
    console.log("=== DIRECT ADD TO POTENTIAL REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { title, description, coordinates, region, permits, images, tags } =
      req.body;

    // Validation
    if (!title || !description || !coordinates || !region) {
      return res.status(400).json({
        success: false,
        error: "Title, description, coordinates, and region are required.",
      });
    }

    // Transform permits array - handle both string array and object array formats
    let transformedPermits = [];
    if (permits && Array.isArray(permits)) {
      transformedPermits = permits
        .map((permit) => {
          if (typeof permit === "string") {
            // Transform string to permit object
            return {
              name: permit,
              required: true,
              notes: "",
            };
          } else if (permit && typeof permit === "object" && permit.name) {
            // Already in correct format
            return {
              name: permit.name,
              required: permit.required !== undefined ? permit.required : true,
              notes: permit.notes || "",
            };
          } else {
            // Invalid permit format, skip
            console.warn("Invalid permit format:", permit);
            return null;
          }
        })
        .filter((permit) => permit !== null);
    }

    const locationData = {
      title,
      description,
      coordinates,
      region,
      permits: transformedPermits,
      images: images || [],
      tags: tags || [],
      addedBy: req.user._id,
    };

    console.log(
      "Location data to save:",
      JSON.stringify(locationData, null, 2)
    );

    const potentialLocation = new PotentialLocation(locationData);
    await potentialLocation.save();

    await potentialLocation.populate("addedBy", "username role");

    res.status(201).json({
      success: true,
      data: { location: potentialLocation },
    });
  } catch (error) {
    console.error("=== DIRECT ADD TO POTENTIAL ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Handle specific mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      error:
        "Internal server error while adding location directly to potential.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Direct add to finalized locations
export const directAddToFinalized = async (req, res) => {
  try {
    console.log("=== DIRECT ADD TO FINALIZED REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { title, description, coordinates, region, permits, images, tags } =
      req.body;

    // Validation
    if (!title || !description || !coordinates || !region) {
      return res.status(400).json({
        success: false,
        error: "Title, description, coordinates, and region are required.",
      });
    }

    // Transform permits array - handle both string array and object array formats
    let transformedPermits = [];
    if (permits && Array.isArray(permits)) {
      transformedPermits = permits
        .map((permit) => {
          if (typeof permit === "string") {
            // Transform string to permit object
            return {
              name: permit,
              required: true,
              notes: "",
            };
          } else if (permit && typeof permit === "object" && permit.name) {
            // Already in correct format
            return {
              name: permit.name,
              required: permit.required !== undefined ? permit.required : true,
              notes: permit.notes || "",
            };
          } else {
            // Invalid permit format, skip
            console.warn("Invalid permit format:", permit);
            return null;
          }
        })
        .filter((permit) => permit !== null);
    }

    const locationData = {
      title,
      description,
      coordinates,
      region,
      permits: transformedPermits,
      images: images || [],
      tags: tags || [],
      addedBy: req.user._id,
      finalizedBy: req.user._id,
      finalizedAt: new Date(),
    };

    const finalizedLocation = new FinalizedLocation(locationData);
    await finalizedLocation.save();

    await finalizedLocation.populate([
      { path: "addedBy", select: "username role" },
      { path: "finalizedBy", select: "username role" },
    ]);

    res.status(201).json({
      success: true,
      data: { location: finalizedLocation },
    });
  } catch (error) {
    console.error("=== DIRECT ADD TO FINALIZED ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // Handle specific mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      error:
        "Internal server error while adding location directly to finalized.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
