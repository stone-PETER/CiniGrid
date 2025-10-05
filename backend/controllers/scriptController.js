import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";
import Project from "../models/Project.js";
import ProjectMember from "../models/ProjectMember.js";

// Import pdf-parse using require since it doesn't support ES modules
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Initialize Gemini
let geminiClient = null;
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Upload screenplay and analyze with Gemini
 * POST /api/projects/:projectId/script/upload
 */
export const uploadScript = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId; // From auth middleware

    // Verify project exists and user is owner
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Check if user is project owner
    if (project.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only project owner can upload screenplay",
      });
    }

    // Verify file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Please upload a PDF screenplay.",
      });
    }

    console.log(`📄 Processing screenplay: ${req.file.originalname}`);

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const scriptText = pdfData.text;

    if (!scriptText || scriptText.trim().length < 100) {
      return res.status(400).json({
        success: false,
        error: "Could not extract text from PDF or text is too short",
      });
    }

    console.log(`✅ Extracted ${scriptText.length} characters from PDF`);

    // Check if Gemini is configured
    if (!geminiClient) {
      return res.status(500).json({
        success: false,
        error:
          "Gemini API not configured. Please set GEMINI_API_KEY in environment variables.",
      });
    }

    // Analyze with Gemini to extract location requirements
    console.log("🤖 Analyzing screenplay with Gemini...");

    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const prompt = `You are a professional location scout analyzing a film screenplay. Extract all unique filming location requirements from this screenplay.

For each location, provide a clear, one-sentence description that could be used to search for real filming locations. Focus on:
- Physical characteristics (architecture, interior/exterior, size)
- Atmosphere and mood
- Key visual elements
- Time period if relevant

Return ONLY a JSON array of strings. Each string should be a standalone location description.

Example format:
["Modern downtown office building with floor-to-ceiling glass windows and city skyline views", "Cozy suburban family home with large backyard and white picket fence", "Dimly lit jazz club with vintage 1940s decor and intimate stage"]

Screenplay text (first 25,000 characters):
${scriptText.substring(0, 25000)}

Remember: Return ONLY the JSON array, no other text or explanation.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("🤖 Gemini response received");

    // Parse location prompts from response
    let locationPrompts = [];
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      locationPrompts = JSON.parse(cleanedText);

      // Validate it's an array of strings
      if (!Array.isArray(locationPrompts)) {
        throw new Error("Response is not an array");
      }

      // Filter and clean prompts
      locationPrompts = locationPrompts
        .filter(
          (prompt) => typeof prompt === "string" && prompt.trim().length > 10
        )
        .map((prompt) => prompt.trim())
        .slice(0, 50); // Limit to 50 locations max

      console.log(
        `✅ Extracted ${locationPrompts.length} location requirements`
      );
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);

      // Fallback: try to extract lines that look like location descriptions
      const lines = responseText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => {
          // Filter lines that look like location descriptions
          return (
            line.length > 20 &&
            line.length < 200 &&
            !line.startsWith("[") &&
            !line.startsWith("{") &&
            !line.toLowerCase().includes("screenplay") &&
            !line.toLowerCase().includes("example")
          );
        })
        .slice(0, 30);

      if (lines.length > 0) {
        locationPrompts = lines;
        console.log(
          `⚠️ Fallback parsing extracted ${locationPrompts.length} locations`
        );
      } else {
        return res.status(500).json({
          success: false,
          error: "Failed to parse location requirements from AI response",
        });
      }
    }

    // Update project with script data
    project.script = {
      filename: req.file.originalname,
      uploadDate: new Date(),
      textContent: scriptText.substring(0, 100000), // Store first 100k chars
      locationPrompts: locationPrompts,
    };

    await project.save();

    console.log(`✅ Script analysis saved for project: ${project.name}`);

    res.json({
      success: true,
      message: "Screenplay analyzed successfully",
      data: {
        filename: req.file.originalname,
        locationCount: locationPrompts.length,
        locationPrompts: locationPrompts,
        uploadDate: project.script.uploadDate,
      },
    });
  } catch (error) {
    console.error("Script upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process screenplay",
    });
  }
};

/**
 * Get script analysis for a project
 * GET /api/projects/:projectId/script
 */
export const getScriptAnalysis = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId; // From auth middleware

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Verify user has access to project (member or owner)
    const isMember = await ProjectMember.findOne({
      projectId,
      userId,
      status: "active",
    });

    const isOwner = project.ownerId.toString() === userId;

    if (!isMember && !isOwner) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this project",
      });
    }

    // Return script analysis
    if (!project.script || !project.script.filename) {
      return res.json({
        success: true,
        data: {
          hasScript: false,
          message: "No screenplay uploaded yet",
          isOwner, // ✅ Added isOwner field
        },
      });
    }

    res.json({
      success: true,
      data: {
        hasScript: true,
        filename: project.script.filename,
        uploadDate: project.script.uploadDate,
        locationCount: project.script.locationPrompts.length,
        locationPrompts: project.script.locationPrompts,
        isOwner,
      },
    });
  } catch (error) {
    console.error("Get script analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve script analysis",
    });
  }
};

/**
 * Delete script analysis
 * DELETE /api/projects/:projectId/script
 */
export const deleteScript = async (req, res) => {
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

    // Only owner can delete
    if (project.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only project owner can delete screenplay",
      });
    }

    // Clear script data
    project.script = {
      filename: null,
      uploadDate: null,
      textContent: null,
      locationPrompts: [],
    };

    await project.save();

    res.json({
      success: true,
      message: "Screenplay deleted successfully",
    });
  } catch (error) {
    console.error("Delete script error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete screenplay",
    });
  }
};
