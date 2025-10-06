import LocationRecord from "../models/LocationRecord.js";
import PotentialLocation from "../models/PotentialLocation.js";
import FinalizedLocation from "../models/FinalizedLocation.js";
import ProjectMember from "../models/ProjectMember.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Create a new location record
 * POST /api/location-records
 */
export const createLocationRecord = async (req, res) => {
  try {
    const userId = req.userId;
    const { projectId, name, description, userNotes, tags } = req.body;

    // Validate required fields
    if (!projectId || !name || !description) {
      return res.status(400).json({
        success: false,
        error: "Project ID, name, and description are required",
      });
    }

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

    // Create location record
    const locationRecord = new LocationRecord({
      projectId,
      name,
      description,
      userNotes: userNotes || "",
      tags: tags || [],
      createdBy: userId,
    });

    await locationRecord.save();

    res.status(201).json({
      success: true,
      message: "Location record created successfully",
      data: locationRecord,
    });
  } catch (error) {
    console.error("Create location record error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create location record",
    });
  }
};

/**
 * Get all location records for a project
 * GET /api/location-records/:projectId
 */
export const getLocationRecords = async (req, res) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;

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

    // Get all location records for this project
    const records = await LocationRecord.find({ projectId })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Get counts for each record
    const recordsWithCounts = await Promise.all(
      records.map(async (record) => {
        const potentialsCount = await PotentialLocation.countDocuments({
          locationRecordId: record._id,
        });
        const finalizedCount = await FinalizedLocation.countDocuments({
          locationRecordId: record._id,
        });

        return {
          ...record.toObject(),
          stats: {
            potentialsCount,
            finalizedCount,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: recordsWithCounts,
    });
  } catch (error) {
    console.error("Get location records error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get location records",
    });
  }
};

/**
 * Get a single location record
 * GET /api/location-records/single/:recordId
 */
export const getLocationRecord = async (req, res) => {
  try {
    const userId = req.userId;
    const { recordId } = req.params;

    const record = await LocationRecord.findById(recordId).populate(
      "createdBy",
      "name email"
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Location record not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: record.projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    // Get counts
    const potentialsCount = await PotentialLocation.countDocuments({
      locationRecordId: record._id,
    });
    const finalizedCount = await FinalizedLocation.countDocuments({
      locationRecordId: record._id,
    });

    res.status(200).json({
      success: true,
      data: {
        ...record.toObject(),
        stats: {
          potentialsCount,
          finalizedCount,
        },
      },
    });
  } catch (error) {
    console.error("Get location record error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get location record",
    });
  }
};

/**
 * Update a location record
 * PATCH /api/location-records/:recordId
 */
export const updateLocationRecord = async (req, res) => {
  try {
    const userId = req.userId;
    const { recordId } = req.params;
    const updates = req.body;

    const record = await LocationRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Location record not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: record.projectId,
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
      "name",
      "description",
      "userNotes",
      "tags",
      "status",
    ];
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        record[field] = updates[field];
      }
    });

    await record.save();

    res.status(200).json({
      success: true,
      message: "Location record updated successfully",
      data: record,
    });
  } catch (error) {
    console.error("Update location record error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update location record",
    });
  }
};

/**
 * Delete a location record
 * DELETE /api/location-records/:recordId
 */
export const deleteLocationRecord = async (req, res) => {
  try {
    const userId = req.userId;
    const { recordId } = req.params;

    const record = await LocationRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Location record not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: record.projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    // Check if admin (only admins can delete)
    if (!member.isAdmin()) {
      return res.status(403).json({
        success: false,
        error: "Only project admins can delete location records",
      });
    }

    // Check if there are finalized locations linked to this record
    const finalizedCount = await FinalizedLocation.countDocuments({
      locationRecordId: record._id,
    });

    if (finalizedCount > 0) {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete location record with finalized locations. Un-finalize locations first.",
      });
    }

    // Delete the record (potential locations will be orphaned but kept)
    await LocationRecord.findByIdAndDelete(recordId);

    res.status(200).json({
      success: true,
      message: "Location record deleted successfully",
    });
  } catch (error) {
    console.error("Delete location record error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete location record",
    });
  }
};

/**
 * Get potential locations for a location record
 * GET /api/location-records/:recordId/potentials
 */
export const getPotentialLocationsForRecord = async (req, res) => {
  try {
    const userId = req.userId;
    const { recordId } = req.params;

    const record = await LocationRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Location record not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: record.projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    // Get potential locations for this record
    const potentials = await PotentialLocation.find({
      locationRecordId: recordId,
    })
      .populate("addedBy", "name email")
      .populate("teamNotes.userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: potentials,
    });
  } catch (error) {
    console.error("Get potential locations for record error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get potential locations",
    });
  }
};

/**
 * Get finalized locations for a location record
 * GET /api/location-records/:recordId/finalized
 */
export const getFinalizedLocationsForRecord = async (req, res) => {
  try {
    const userId = req.userId;
    const { recordId } = req.params;

    const record = await LocationRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Location record not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: record.projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    // Get finalized locations for this record
    const finalized = await FinalizedLocation.find({
      locationRecordId: recordId,
    })
      .populate("finalizedBy", "name email")
      .populate("teamNotes.userId", "name email")
      .sort({ finalizedAt: -1 });

    res.status(200).json({
      success: true,
      data: finalized,
    });
  } catch (error) {
    console.error("Get finalized locations for record error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get finalized locations",
    });
  }
};

/**
 * Compare potential locations for a location record using AI
 * POST /api/location-records/:recordId/compare
 */
export const compareLocationsForRecord = async (req, res) => {
  try {
    const userId = req.userId;
    const { recordId } = req.params;
    const { projectId } = req.body;

    console.log(`🏆 Comparing locations for record: ${recordId}`);

    // Get the location record
    const record = await LocationRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Location record not found",
      });
    }

    // Check project access
    const member = await ProjectMember.findOne({
      projectId: projectId || record.projectId,
      userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    // Get all potential locations for this record
    const potentials = await PotentialLocation.find({
      locationRecordId: recordId,
    }).populate("teamNotes.userId", "name email");

    if (potentials.length === 0) {
      return res.json({
        success: true,
        message: "No potential locations found for this record",
        data: {
          locations: [],
          bestMatch: null,
          summary:
            "No potential locations have been added for this location record yet. Search and add some locations first.",
        },
      });
    }

    console.log(
      `📊 Comparing ${potentials.length} potential locations against: "${record.description}"`
    );

    // Build comparison prompt for AI
    const prompt = `You are a professional location scout comparing potential filming locations.

LOCATION RECORD TO MATCH:
Name: ${record.name}
Description: ${record.description}
${record.userNotes ? `User Notes: ${record.userNotes}` : ""}

POTENTIAL LOCATIONS TO COMPARE (${potentials.length} total):
${potentials
  .map(
    (loc, idx) => `
${idx + 1}. ${loc.name}
   Address: ${loc.address || "Not specified"}
   Description: ${loc.description || "No description"}
   Rating: ${loc.rating ? `${loc.rating}/5 stars` : "No rating"}
   Price Level: ${loc.priceLevel ? "$".repeat(loc.priceLevel) : "Unknown"}
   Photos: ${loc.photos?.length || 0} available
   ${
     loc.teamNotes && loc.teamNotes.length > 0
       ? `Team Notes: ${loc.teamNotes
           .map((note) => `"${note.note}"`)
           .join(", ")}`
       : ""
   }
`
  )
  .join("")}

TASK:
1. Compare each potential location against the location record's description
2. Score each location from 0-10 based on how well it matches the requirements
3. Provide reasoning for each score (2-3 sentences explaining the match quality)
4. Identify the best overall match
5. Provide an overall summary comparing all locations

Return your analysis in this EXACT JSON format (no markdown, no code blocks):
{
  "locations": [
    {
      "id": "potential_location_id_here",
      "name": "location name",
      "overall": 8.5,
      "matchScore": 8.5,
      "reasoning": "Detailed explanation of why this location scored as it did, considering the description match, amenities, and team feedback."
    }
  ],
  "bestMatchId": "id_of_best_location",
  "summary": "2-3 paragraph summary comparing all locations and explaining which is best and why. Consider all factors including location characteristics, team notes, and match to requirements."
}`;

    // Call Gemini AI for comparison
    let aiResponse;
    try {
      // Initialize Gemini client
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key not configured");
      }

      const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = geminiClient.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiResponse = response.text();

      console.log("🤖 AI Response received:", aiResponse.substring(0, 200));
    } catch (aiError) {
      console.error("AI comparison failed:", aiError);
      return res.status(500).json({
        success: false,
        error: "AI comparison service unavailable. Please try again later.",
      });
    }

    // Parse AI response
    let comparisonData;
    try {
      // Remove markdown code blocks if present
      let jsonText = aiResponse.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
      }

      comparisonData = JSON.parse(jsonText);
      console.log(
        `✅ Parsed comparison data for ${comparisonData.locations.length} locations`
      );
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw AI response:", aiResponse);

      // Fallback: create basic comparison based on rating and team notes
      comparisonData = {
        locations: potentials.map((loc) => {
          const baseScore = loc.rating || 5;
          const teamNotesBonus = loc.teamNotes ? loc.teamNotes.length * 0.5 : 0;
          const score = Math.min(10, baseScore + teamNotesBonus);

          return {
            id: loc._id.toString(),
            name: loc.name,
            overall: score,
            matchScore: score,
            reasoning:
              "Score based on location rating and team engagement. AI analysis unavailable.",
          };
        }),
        bestMatchId: potentials[0]._id.toString(),
        summary:
          "AI comparison is temporarily unavailable. Locations are ranked by rating and team notes count.",
      };
    }

    // Map scores back to potential locations
    const rankedLocations = potentials
      .map((loc) => {
        const scoreData = comparisonData.locations.find(
          (s) => s.id === loc._id.toString()
        );

        return {
          ...loc.toObject(),
          comparisonScore: scoreData
            ? {
                overall: scoreData.overall || 5,
                matchScore: scoreData.matchScore || 5,
                reasoning: scoreData.reasoning || "No reasoning provided",
              }
            : {
                overall: 5,
                matchScore: 5,
                reasoning: "No comparison data available",
              },
        };
      })
      .sort((a, b) => b.comparisonScore.overall - a.comparisonScore.overall);

    // Find best match
    const bestMatch =
      rankedLocations.find(
        (loc) => loc._id.toString() === comparisonData.bestMatchId
      ) || rankedLocations[0];

    console.log(
      `🥇 Best match: ${bestMatch.name} (Score: ${bestMatch.comparisonScore.overall})`
    );

    res.json({
      success: true,
      data: {
        locations: rankedLocations,
        bestMatch: bestMatch,
        summary: comparisonData.summary || "Comparison completed successfully",
      },
    });
  } catch (error) {
    console.error("Compare locations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to compare locations",
    });
  }
};
