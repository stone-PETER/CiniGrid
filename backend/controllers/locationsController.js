import PotentialLocation from "../models/PotentialLocation.js";
import FinalizedLocation from "../models/FinalizedLocation.js";
import mockAiService from "../services/mockAiService.js";
import {
  findAndRankLocations,
  isAIAgentAvailable,
} from "../services/aiAgent.js";

/**
 * Helper function to convert photo references to full URLs
 */
const convertPhotoReferencesToUrls = (photos) => {
  if (!photos || !Array.isArray(photos)) return [];

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  return photos
    .map((photo) => {
      if (typeof photo === "string") {
        // Already a URL
        return photo;
      }
      if (photo.photoReference) {
        // Convert photoReference to URL
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photoReference}&key=${apiKey}`;
      }
      if (photo.url) {
        return photo.url;
      }
      return null;
    })
    .filter((url) => url !== null);
};

/**
 * Helper function to map AI location results to consistent response format
 * Includes all hybrid fields from Gemini-first approach
 */
const mapAILocationToResponse = (loc) => ({
  title: loc.name,
  name: loc.name,
  description: loc.reason || loc.description,
  reason: loc.reason,
  coordinates: loc.coordinates,
  address: loc.address,
  region: loc.address,
  tags: loc.tags || loc.types || [],
  rating: loc.rating,

  // NEW HYBRID FIELDS (Gemini-first approach)
  verified: loc.verified || false,
  placeId: loc.placeId || null,
  mapsLink: loc.mapsLink || null,
  photos: loc.photos || [],
  googleTypes: loc.googleTypes || [],
  filmingDetails: loc.filmingDetails || {},
  estimatedCost: loc.estimatedCost || null,
  permits: loc.permits || [],

  // Legacy fields for backward compatibility
  confidence: loc.rating ? loc.rating / 10 : 0.5,
  images: loc.photos?.map((photo) => photo.url) || [],
  source: "ai-agent",
});

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
                verified: loc.verified,
                photos: loc.photos,
              })),
            },
            similarLocations: result.results
              .slice(1, 4)
              .map(mapAILocationToResponse),
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

        const suggestions = result.results.map(mapAILocationToResponse);

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

        aiSuggestions = result.results.map(mapAILocationToResponse);
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

    const {
      suggestionId,
      suggestionData,
      manualData,
      projectId,
      locationRecordId,
    } = req.body;

    // projectId is optional for backward compatibility, but recommended
    if (!projectId) {
      console.warn(
        "⚠️ Adding location without projectId - won't be project-scoped"
      );
    }

    let locationData;

    if (suggestionData) {
      // New approach: Frontend passes full suggestion object with all hybrid fields
      console.log("Using suggestionData (full object)");

      locationData = {
        title: suggestionData.title || suggestionData.name,
        name: suggestionData.name || suggestionData.title,
        description: suggestionData.description || suggestionData.reason,
        reason: suggestionData.reason || suggestionData.description,
        coordinates: suggestionData.coordinates,
        address: suggestionData.address,
        region: suggestionData.region || suggestionData.address,
        projectId: projectId || null, // Store projectId for project-scoped locations
        locationRecordId: locationRecordId || null, // Link to location record if provided

        // Enhanced fields from hybrid approach
        rating: suggestionData.rating,
        verified: suggestionData.verified || false,
        placeId: suggestionData.placeId,

        // Images - convert photo references to full URLs
        images: convertPhotoReferencesToUrls(suggestionData.photos),
        photos: suggestionData.photos || [],

        // Tags and types
        tags: suggestionData.tags || suggestionData.types || [],
        googleTypes: suggestionData.googleTypes || [],

        // Filming details
        filmingDetails: suggestionData.filmingDetails || {},

        // Permits - ensure proper format
        permits: (suggestionData.permits || []).map((permit) => {
          if (typeof permit === "string") {
            return { name: permit, required: true };
          }
          return permit;
        }),

        estimatedCost: suggestionData.estimatedCost,
        mapsLink: suggestionData.mapsLink,

        addedBy: req.user._id,
      };
    } else if (suggestionId) {
      // Legacy approach: Try to fetch from mock service (for backward compatibility)
      console.log("Using suggestionId (legacy approach)");
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
        projectId: projectId || null,
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
        projectId: projectId || null,
        permits: transformedPermits,
        images: manualData.images || [],
        tags: manualData.tags || [],
        addedBy: req.user._id,
      };
    } else {
      return res.status(400).json({
        success: false,
        error:
          "Either suggestionData, suggestionId, or manualData is required.",
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
    const { projectId } = req.query;

    // Build query - filter by projectId if provided
    const query = {};
    if (projectId) {
      query.projectId = projectId;
    } else {
      console.warn("⚠️ Fetching potential locations without projectId filter");
    }

    const locations = await PotentialLocation.find(query)
      .populate("addedBy", "username role")
      .populate("notes.author", "username role")
      .populate("approvals.userId", "username role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        locations,
        count: locations.length,
        projectId: projectId || null,
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

    // Create finalized location with preserved data
    const finalizedLocationData = {
      title: potentialLocation.title || potentialLocation.name,
      name: potentialLocation.name,
      description: potentialLocation.description,
      address: potentialLocation.address,
      coordinates: potentialLocation.coordinates,
      region: potentialLocation.region,
      projectId: potentialLocation.projectId, // Preserve projectId
      locationRecordId: potentialLocation.locationRecordId, // Preserve location record link
      potentialLocationId: potentialLocation._id, // Link back to original potential
      permits: potentialLocation.permits,
      images: potentialLocation.images,
      photos: potentialLocation.photos,
      rating: potentialLocation.rating,
      placeId: potentialLocation.placeId,
      mapsLink: potentialLocation.mapsLink,
      googleTypes: potentialLocation.googleTypes,
      filmingDetails: potentialLocation.filmingDetails,
      estimatedCost: potentialLocation.estimatedCost,
      verified: potentialLocation.verified,
      budget: potentialLocation.budget,
      amenities: potentialLocation.amenities,
      cachedData: potentialLocation.cachedData,
      addedBy: potentialLocation.addedBy,
      notes: potentialLocation.notes,
      teamNotes: potentialLocation.teamNotes || [], // Preserve team notes!
      approvals: potentialLocation.approvals,
      tags: potentialLocation.tags,
      finalizedBy: req.user._id,
      finalizedAt: new Date(),
    };

    const finalizedLocation = new FinalizedLocation(finalizedLocationData);
    await finalizedLocation.save();

    console.log(
      `✅ Finalized location "${finalizedLocation.title}" with ${
        finalizedLocation.teamNotes?.length || 0
      } team notes preserved`
    );

    // Remove from potential locations
    await PotentialLocation.findByIdAndDelete(id);

    await finalizedLocation.populate([
      { path: "addedBy", select: "username role" },
      { path: "finalizedBy", select: "username role" },
      { path: "notes.author", select: "username role" },
      { path: "approvals.userId", select: "username role" },
      { path: "teamNotes.userId", select: "name email" },
      { path: "locationRecordId", select: "name description" },
    ]);

    res.json({
      success: true,
      data: { location: finalizedLocation },
      message: `Location finalized with ${
        finalizedLocation.teamNotes?.length || 0
      } team notes preserved`,
    });
  } catch (error) {
    console.error("Finalize location error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while finalizing location.",
    });
  }
};

/**
 * Un-finalize a location (move back to potentials)
 * POST /api/locations/unfinalize/:id
 */
export const unfinalizeLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const finalizedLocation = await FinalizedLocation.findById(id);
    if (!finalizedLocation) {
      return res.status(404).json({
        success: false,
        error: "Finalized location not found.",
      });
    }

    // Check if user has permission (must be admin or the person who finalized it)
    if (
      finalizedLocation.finalizedBy.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Only the person who finalized this location or an admin can un-finalize it.",
      });
    }

    // Move back to potential locations
    const potentialLocationData = {
      projectId: finalizedLocation.projectId,
      locationRecordId: finalizedLocation.locationRecordId,
      title: finalizedLocation.title,
      name: finalizedLocation.name,
      description: finalizedLocation.description,
      address: finalizedLocation.address,
      coordinates: finalizedLocation.coordinates,
      region: finalizedLocation.region,
      permits: finalizedLocation.permits,
      images: finalizedLocation.images,
      photos: finalizedLocation.photos,
      rating: finalizedLocation.rating,
      placeId: finalizedLocation.placeId,
      mapsLink: finalizedLocation.mapsLink,
      googleTypes: finalizedLocation.googleTypes,
      filmingDetails: finalizedLocation.filmingDetails,
      estimatedCost: finalizedLocation.estimatedCost,
      verified: finalizedLocation.verified,
      budget: finalizedLocation.budget,
      amenities: finalizedLocation.amenities,
      cachedData: finalizedLocation.cachedData,
      addedBy: finalizedLocation.addedBy,
      notes: finalizedLocation.notes,
      teamNotes: finalizedLocation.teamNotes || [], // Preserve team notes
      approvals: finalizedLocation.approvals,
      tags: finalizedLocation.tags,
    };

    const potentialLocation = new PotentialLocation(potentialLocationData);
    await potentialLocation.save();

    console.log(
      `↩️ Un-finalized location "${
        finalizedLocation.title
      }" back to potentials with ${
        potentialLocation.teamNotes?.length || 0
      } team notes preserved`
    );

    // Remove from finalized locations
    await FinalizedLocation.findByIdAndDelete(id);

    await potentialLocation.populate([
      { path: "addedBy", select: "username role" },
      { path: "teamNotes.userId", select: "name email" },
      { path: "locationRecordId", select: "name description" },
    ]);

    res.json({
      success: true,
      data: { location: potentialLocation },
      message: "Location moved back to potentials successfully",
    });
  } catch (error) {
    console.error("Un-finalize location error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while un-finalizing location.",
    });
  }
};

// Get all finalized locations
export const getFinalizedLocations = async (req, res) => {
  try {
    const { projectId } = req.query;

    // Build query - filter by projectId if provided
    const query = {};
    if (projectId) {
      query.projectId = projectId;
    } else {
      console.warn("⚠️ Fetching finalized locations without projectId filter");
    }

    const locations = await FinalizedLocation.find(query)
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
        projectId: projectId || null,
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

    const {
      title,
      description,
      coordinates,
      region,
      permits,
      images,
      tags,
      projectId,
    } = req.body;

    // Validation
    if (!title || !description || !coordinates || !region) {
      return res.status(400).json({
        success: false,
        error: "Title, description, coordinates, and region are required.",
      });
    }

    // projectId is optional for backward compatibility
    if (!projectId) {
      console.warn(
        "⚠️ Direct add without projectId - location won't be project-scoped"
      );
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
      projectId: projectId || null,
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

    const {
      title,
      description,
      coordinates,
      region,
      permits,
      images,
      tags,
      projectId,
    } = req.body;

    // Validation
    if (!title || !description || !coordinates || !region) {
      return res.status(400).json({
        success: false,
        error: "Title, description, coordinates, and region are required.",
      });
    }

    // projectId is optional for backward compatibility
    if (!projectId) {
      console.warn(
        "⚠️ Direct add to finalized without projectId - location won't be project-scoped"
      );
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
      projectId: projectId || null,
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

/**
 * Add a team note to a potential location
 * POST /api/locations/potential/:id/team-notes
 */
export const addTeamNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const userId = req.userId;
    const user = req.user;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        error: "Note text is required",
      });
    }

    const location = await PotentialLocation.findById(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Potential location not found",
      });
    }

    // Add team note
    const teamNote = {
      userId,
      userName: user.name || user.username || "Unknown User",
      userRole: user.role || "",
      note: note.trim(),
      timestamp: new Date(),
      edited: false,
    };

    location.teamNotes.push(teamNote);
    await location.save();

    res.status(201).json({
      success: true,
      message: "Team note added successfully",
      data: teamNote,
    });
  } catch (error) {
    console.error("Add team note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add team note",
    });
  }
};

/**
 * Edit a team note (own notes only)
 * PATCH /api/locations/potential/:id/team-notes/:noteId
 */
export const editTeamNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { note } = req.body;
    const userId = req.userId;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        error: "Note text is required",
      });
    }

    const location = await PotentialLocation.findById(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Potential location not found",
      });
    }

    // Find the note
    const teamNote = location.teamNotes.id(noteId);

    if (!teamNote) {
      return res.status(404).json({
        success: false,
        error: "Team note not found",
      });
    }

    // Check if user owns the note
    if (teamNote.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only edit your own notes",
      });
    }

    // Update note
    teamNote.note = note.trim();
    teamNote.edited = true;
    teamNote.editedAt = new Date();

    await location.save();

    res.status(200).json({
      success: true,
      message: "Team note updated successfully",
      data: teamNote,
    });
  } catch (error) {
    console.error("Edit team note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to edit team note",
    });
  }
};

/**
 * Delete a team note (own notes only)
 * DELETE /api/locations/potential/:id/team-notes/:noteId
 */
export const deleteTeamNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const userId = req.userId;

    const location = await PotentialLocation.findById(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Potential location not found",
      });
    }

    // Find the note
    const teamNote = location.teamNotes.id(noteId);

    if (!teamNote) {
      return res.status(404).json({
        success: false,
        error: "Team note not found",
      });
    }

    // Check if user owns the note
    if (teamNote.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own notes",
      });
    }

    // Remove note
    teamNote.remove();
    await location.save();

    res.status(200).json({
      success: true,
      message: "Team note deleted successfully",
    });
  } catch (error) {
    console.error("Delete team note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete team note",
    });
  }
};

/**
 * Get all team notes for a potential location
 * GET /api/locations/potential/:id/team-notes
 */
export const getTeamNotes = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await PotentialLocation.findById(id)
      .select("teamNotes")
      .populate("teamNotes.userId", "name email");

    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Potential location not found",
      });
    }

    res.status(200).json({
      success: true,
      data: location.teamNotes,
    });
  } catch (error) {
    console.error("Get team notes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get team notes",
    });
  }
};
