import { GoogleGenerativeAI } from "@google/generative-ai";
import Project from "../models/Project.js";
import ProjectMember from "../models/ProjectMember.js";
import Scene from "../models/Scene.js";

// Initialize Gemini
let geminiClient = null;
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Generate scene breakdown from uploaded script
 * POST /api/projects/:projectId/breakdown/generate
 */
export const generateBreakdown = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Check if user is owner
    if (project.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only project owner can generate breakdown",
      });
    }

    // Check if script exists
    if (!project.script || !project.script.textContent) {
      return res.status(400).json({
        success: false,
        error: "No script uploaded. Please upload a script first.",
      });
    }

    console.log("🎬 Generating scene breakdown with Gemini...");

    // Check if Gemini is configured
    if (!geminiClient) {
      return res.status(500).json({
        success: false,
        error:
          "Gemini API not configured. Please set GEMINI_API_KEY in environment variables.",
      });
    }

    // Generate breakdown with Gemini AI
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const prompt = `You are a professional script supervisor. Analyze this screenplay and create a detailed scene breakdown.

For EACH scene in the script, extract:
1. Scene number (e.g., "1", "2A", "10")
2. Scene heading (e.g., "INT. OFFICE - DAY")
3. INT, EXT, or INT/EXT
4. Location name (e.g., "Office", "Beach", "Car")
5. Time of day (DAY, NIGHT, DAWN, DUSK, MORNING, AFTERNOON, EVENING, CONTINUOUS, MAGIC HOUR, or LATER)
6. Brief description (2-3 sentences summarizing the action)
7. Estimated page count (use 1/8 page increments: 0.125, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, etc.)
8. Characters present (names only, as an array)
9. Props needed (as an array)
10. Vehicles (if any, as an array)
11. Wardrobe notes (special costumes only, as an array)
12. Makeup/Hair notes (special requirements only, as an array)
13. Special effects (VFX, practical effects, as an array)
14. Stunts (if any action/stunt work, as an array)
15. Animals (if any, as an array)
16. Number of extras/background actors (just the number)
17. Any production notes (as a STRING, not an array - use empty string "" if none)

Return as a JSON object with this EXACT structure:
{
  "scenes": [
    {
      "sceneNumber": "1",
      "heading": "INT. COFFEE SHOP - DAY",
      "intExt": "INT",
      "location": "Coffee Shop",
      "timeOfDay": "DAY",
      "description": "Sarah enters the busy coffee shop. She spots Mike at a corner table and walks over.",
      "pageCount": 0.5,
      "characters": ["Sarah", "Mike", "Barista"],
      "props": ["Coffee cups", "Laptop", "Newspaper"],
      "vehicles": [],
      "wardrobe": [],
      "makeupHair": [],
      "specialEffects": [],
      "stunts": [],
      "animals": [],
      "extras": 8,
      "notes": "Need establishing shot of shop exterior"
    }
  ]
}

IMPORTANT: 
- Return ONLY valid JSON, no markdown formatting, no explanation
- Include ALL scenes from the script
- Be thorough but concise
- Use consistent character name spelling throughout
- For pageCount, estimate realistically based on scene length
- Leave arrays empty [] if not applicable (but notes must be a STRING, use "" for empty)
- For extras, use 0 if none needed
- The "notes" field must be a string, NOT an array

Screenplay:
${project.script.textContent.substring(0, 50000)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log(
      "📝 Raw Gemini response (first 500 chars):",
      responseText.substring(0, 500)
    );

    // Clean and parse JSON
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/```json\n?|\n?```/g, "");
    cleaned = cleaned.replace(/^[^{]*/, ""); // Remove any text before first {
    cleaned = cleaned.replace(/[^}]*$/, ""); // Remove any text after last }

    let breakdown;
    try {
      breakdown = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Cleaned response:", cleaned.substring(0, 1000));

      return res.status(500).json({
        success: false,
        error: "Failed to parse AI response. Please try again.",
      });
    }

    // Validate structure
    if (!breakdown.scenes || !Array.isArray(breakdown.scenes)) {
      return res.status(500).json({
        success: false,
        error: "Invalid breakdown structure from AI",
      });
    }

    console.log(`✅ Generated breakdown for ${breakdown.scenes.length} scenes`);

    // Sanitize scene data before saving
    breakdown.scenes = breakdown.scenes.map((scene) => {
      // Convert empty arrays to empty strings for notes field
      if (Array.isArray(scene.notes)) {
        scene.notes = scene.notes.length > 0 ? scene.notes.join("; ") : "";
      }
      // Ensure notes is a string
      if (typeof scene.notes !== "string") {
        scene.notes = "";
      }
      // Validate timeOfDay - default to DAY if invalid
      const validTimeOfDay = [
        "DAY",
        "NIGHT",
        "DAWN",
        "DUSK",
        "MORNING",
        "AFTERNOON",
        "EVENING",
        "CONTINUOUS",
        "MAGIC HOUR",
        "LATER",
      ];
      if (!validTimeOfDay.includes(scene.timeOfDay)) {
        console.warn(
          `⚠️ Invalid timeOfDay "${scene.timeOfDay}" for scene ${scene.sceneNumber}, defaulting to "DAY"`
        );
        scene.timeOfDay = "DAY";
      }
      // Ensure all array fields are arrays
      const arrayFields = [
        "characters",
        "props",
        "vehicles",
        "wardrobe",
        "makeupHair",
        "specialEffects",
        "stunts",
        "animals",
      ];
      arrayFields.forEach((field) => {
        if (!Array.isArray(scene[field])) {
          scene[field] = [];
        }
      });
      return scene;
    });

    // Calculate statistics
    const stats = {
      totalScenes: breakdown.scenes.length,
      totalPages: breakdown.scenes.reduce(
        (sum, scene) => sum + (scene.pageCount || 0),
        0
      ),
      uniqueLocations: [
        ...new Set(breakdown.scenes.map((s) => s.location).filter(Boolean)),
      ],
      uniqueCharacters: [
        ...new Set(breakdown.scenes.flatMap((s) => s.characters || [])),
      ],
      intScenes: breakdown.scenes.filter((s) => s.intExt === "INT").length,
      extScenes: breakdown.scenes.filter((s) => s.intExt === "EXT").length,
      dayScenes: breakdown.scenes.filter((s) => s.timeOfDay === "DAY").length,
      nightScenes: breakdown.scenes.filter((s) => s.timeOfDay === "NIGHT")
        .length,
      generatedAt: new Date(),
    };

    // Save to project
    project.script.scenes = breakdown.scenes;
    project.script.breakdownStats = stats;
    await project.save();

    res.json({
      success: true,
      message: "Scene breakdown generated successfully",
      data: {
        scenes: breakdown.scenes,
        stats,
      },
    });
  } catch (error) {
    console.error("Generate breakdown error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate scene breakdown: " + error.message,
    });
  }
};

/**
 * Get scene breakdown
 * GET /api/projects/:projectId/breakdown
 */
export const getBreakdown = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const project = await Project.findById(projectId).select(
      "script.scenes script.breakdownStats ownerId"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Check if user has access to project
    const member = await ProjectMember.findOne({
      projectId,
      userId,
      status: "active",
    });

    const isOwner = project.ownerId.toString() === userId;
    const hasAccess = isOwner || member;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    res.json({
      success: true,
      data: {
        hasBreakdown: !!project.script?.scenes?.length,
        scenes: project.script?.scenes || [],
        stats: project.script?.breakdownStats || null,
        isOwner,
      },
    });
  } catch (error) {
    console.error("Get breakdown error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch scene breakdown",
    });
  }
};

/**
 * Import a single scene from breakdown to production scenes
 * POST /api/projects/:projectId/breakdown/import/:sceneId
 */
export const importScene = async (req, res) => {
  try {
    const { projectId, sceneId } = req.params;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Find the scene in breakdown
    const breakdownScene = project.script.scenes.id(sceneId);
    if (!breakdownScene) {
      return res.status(404).json({
        success: false,
        error: "Scene not found in breakdown",
      });
    }

    // Check if scene already imported (by scene number - S1 detection strategy)
    const existingScene = await Scene.findOne({
      projectId,
      sceneNumber: breakdownScene.sceneNumber,
    });

    if (existingScene) {
      return res.status(409).json({
        success: false,
        error: `Scene ${breakdownScene.sceneNumber} already imported`,
        data: {
          existingSceneId: existingScene._id,
        },
      });
    }

    // Create tags array (T1 format)
    const tags = [];
    if (breakdownScene.intExt) tags.push(breakdownScene.intExt);
    if (breakdownScene.timeOfDay) tags.push(breakdownScene.timeOfDay);

    // Create Scene record
    const newScene = new Scene({
      projectId,
      sceneNumber: breakdownScene.sceneNumber,
      title: breakdownScene.heading,
      description: breakdownScene.description || "No description provided",
      location: breakdownScene.location,
      status: "backlogged",
      priority: "Medium",
      equipment: [
        ...(breakdownScene.props || []),
        ...(breakdownScene.vehicles || []),
      ],
      tags,
      createdBy: userId,
    });

    // Map characters to cast array
    if (breakdownScene.characters && breakdownScene.characters.length > 0) {
      newScene.cast = breakdownScene.characters.map((charName) => ({
        name: charName,
        role: charName, // Default role is the character name
        contact: "",
      }));
    }

    await newScene.save();

    // Update breakdown scene with importedToSceneId
    breakdownScene.importedToSceneId = newScene._id;
    await project.save();

    console.log(
      `✅ Imported scene ${breakdownScene.sceneNumber} → Scene ID: ${newScene._id}`
    );

    res.json({
      success: true,
      message: `Scene ${breakdownScene.sceneNumber} imported successfully`,
      data: {
        scene: newScene,
      },
    });
  } catch (error) {
    console.error("Import scene error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to import scene: " + error.message,
    });
  }
};

/**
 * Import all scenes from breakdown
 * POST /api/projects/:projectId/breakdown/import-all
 */
export const importAllScenes = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (!project.script?.scenes || project.script.scenes.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No scenes in breakdown to import",
      });
    }

    const imported = [];
    const skipped = [];
    const errors = [];

    for (const breakdownScene of project.script.scenes) {
      try {
        // Check if already imported (I1 strategy: skip existing)
        const existingScene = await Scene.findOne({
          projectId,
          sceneNumber: breakdownScene.sceneNumber,
        });

        if (existingScene) {
          skipped.push({
            sceneNumber: breakdownScene.sceneNumber,
            reason: "Already imported",
            existingSceneId: existingScene._id,
          });
          continue;
        }

        // Create tags
        const tags = [];
        if (breakdownScene.intExt) tags.push(breakdownScene.intExt);
        if (breakdownScene.timeOfDay) tags.push(breakdownScene.timeOfDay);

        // Create Scene record
        const newScene = new Scene({
          projectId,
          sceneNumber: breakdownScene.sceneNumber,
          title: breakdownScene.heading,
          description: breakdownScene.description || "No description provided",
          location: breakdownScene.location,
          status: "backlogged",
          priority: "Medium",
          equipment: [
            ...(breakdownScene.props || []),
            ...(breakdownScene.vehicles || []),
          ],
          tags,
          createdBy: userId,
        });

        // Map characters to cast
        if (breakdownScene.characters && breakdownScene.characters.length > 0) {
          newScene.cast = breakdownScene.characters.map((charName) => ({
            name: charName,
            role: charName,
            contact: "",
          }));
        }

        await newScene.save();

        // Update breakdown with importedToSceneId
        breakdownScene.importedToSceneId = newScene._id;

        imported.push({
          sceneNumber: breakdownScene.sceneNumber,
          sceneId: newScene._id,
        });
      } catch (error) {
        errors.push({
          sceneNumber: breakdownScene.sceneNumber,
          error: error.message,
        });
      }
    }

    // Save project with updated importedToSceneId fields
    await project.save();

    console.log(
      `✅ Import complete: ${imported.length} imported, ${skipped.length} skipped, ${errors.length} errors`
    );

    res.json({
      success: true,
      message: `Imported ${imported.length} scenes, skipped ${skipped.length} existing scenes`,
      data: {
        imported,
        skipped,
        errors,
        summary: {
          total: project.script.scenes.length,
          imported: imported.length,
          skipped: skipped.length,
          errors: errors.length,
        },
      },
    });
  } catch (error) {
    console.error("Import all scenes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to import scenes: " + error.message,
    });
  }
};

/**
 * Re-import and overwrite an existing scene
 * POST /api/projects/:projectId/breakdown/reimport/:sceneId
 */
export const reimportScene = async (req, res) => {
  try {
    const { projectId, sceneId } = req.params;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Find the scene in breakdown
    const breakdownScene = project.script.scenes.id(sceneId);
    if (!breakdownScene) {
      return res.status(404).json({
        success: false,
        error: "Scene not found in breakdown",
      });
    }

    // Find and update existing scene
    let existingScene = await Scene.findOne({
      projectId,
      sceneNumber: breakdownScene.sceneNumber,
    });

    if (!existingScene) {
      return res.status(404).json({
        success: false,
        error: "No existing scene found to overwrite. Use import instead.",
      });
    }

    // Create tags
    const tags = [];
    if (breakdownScene.intExt) tags.push(breakdownScene.intExt);
    if (breakdownScene.timeOfDay) tags.push(breakdownScene.timeOfDay);

    // Overwrite with breakdown data
    existingScene.title = breakdownScene.heading;
    existingScene.description =
      breakdownScene.description || "No description provided";
    existingScene.location = breakdownScene.location;
    existingScene.equipment = [
      ...(breakdownScene.props || []),
      ...(breakdownScene.vehicles || []),
    ];
    existingScene.tags = tags;

    // Update cast
    if (breakdownScene.characters && breakdownScene.characters.length > 0) {
      existingScene.cast = breakdownScene.characters.map((charName) => ({
        name: charName,
        role: charName,
        contact: "",
      }));
    }

    await existingScene.save();

    console.log(
      `✅ Re-imported scene ${breakdownScene.sceneNumber} → overwrote Scene ID: ${existingScene._id}`
    );

    res.json({
      success: true,
      message: `Scene ${breakdownScene.sceneNumber} re-imported and updated`,
      data: {
        scene: existingScene,
      },
    });
  } catch (error) {
    console.error("Re-import scene error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to re-import scene: " + error.message,
    });
  }
};

/**
 * Export breakdown as CSV
 * GET /api/projects/:projectId/breakdown/export
 */
export const exportBreakdown = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).select(
      "name script.scenes"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (!project.script?.scenes?.length) {
      return res.status(400).json({
        success: false,
        error: "No scene breakdown available",
      });
    }

    // Generate CSV
    const csvHeader =
      "Scene #,Heading,INT/EXT,Location,Time,Page Count,Characters,Props,Vehicles,Special Effects,Stunts,Animals,Extras,Notes\n";
    const csvRows = project.script.scenes
      .map((scene) => {
        const fields = [
          scene.sceneNumber || "",
          scene.heading || "",
          scene.intExt || "",
          scene.location || "",
          scene.timeOfDay || "",
          scene.pageCount || 0,
          (scene.characters || []).join("; "),
          (scene.props || []).join("; "),
          (scene.vehicles || []).join("; "),
          (scene.specialEffects || []).join("; "),
          (scene.stunts || []).join("; "),
          (scene.animals || []).join("; "),
          scene.extras || 0,
          scene.notes || "",
        ];
        return fields.map((field) => `"${field}"`).join(",");
      })
      .join("\n");

    const csv = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.name}_breakdown.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Export breakdown error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export breakdown",
    });
  }
};
