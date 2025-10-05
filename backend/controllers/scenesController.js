import Scene from "../models/Scene.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

// Helper function to populate common fields
const populateFields = () => [
  { path: "createdBy", select: "username role" },
  { path: "assignedTo", select: "username role" },
  { path: "locationId", select: "title address coordinates" },
  { path: "notes.author", select: "username role" },
  { path: "crew.userId", select: "username role" },
];

// GET /api/scenes - Get all scenes
export const getScenes = async (req, res) => {
  try {
    const { projectId, status, assignedTo, date } = req.query;
    
    // Build query filter
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (date) filter.date = date;

    const scenes = await Scene.find(filter)
      .populate(populateFields())
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: scenes,
      count: scenes.length,
    });
  } catch (error) {
    console.error("Error fetching scenes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scenes",
      error: error.message,
    });
  }
};

// GET /api/scenes/:id - Get scene by ID
export const getSceneById = async (req, res) => {
  try {
    const scene = await Scene.findById(req.params.id)
      .populate(populateFields())
      .populate({
        path: "locationId",
        populate: { path: "addedBy", select: "username role" },
      });

    if (!scene) {
      return res.status(404).json({
        success: false,
        message: "Scene not found",
      });
    }

    res.json({
      success: true,
      data: scene,
    });
  } catch (error) {
    console.error("Error fetching scene:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scene",
      error: error.message,
    });
  }
};

// POST /api/scenes - Create new scene
export const createScene = async (req, res) => {
  try {
    const {
      title,
      description,
      time,
      date,
      priority,
      status,
      location,
      locationId,
      dependencies,
      estimatedDuration,
      equipment,
      cast,
      crew,
      tags,
      assignedTo,
      shotType,
      cameraAngles,
      lighting,
      weather,
      projectId,
    } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Get user from auth middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const scene = new Scene({
      title: title.trim(),
      description: description.trim(),
      time,
      date,
      priority: priority || "Medium",
      status: status || "backlogged",
      location,
      locationId,
      dependencies: dependencies || [],
      estimatedDuration,
      equipment: equipment || [],
      cast: cast || [],
      crew: crew || [],
      tags: tags || [],
      createdBy: userId,
      assignedTo,
      shotType,
      cameraAngles: cameraAngles || [],
      lighting,
      weather,
      projectId,
    });

    await scene.save();

    // Populate the response
    const populatedScene = await Scene.findById(scene._id).populate(
      populateFields()
    );

    res.status(201).json({
      success: true,
      message: "Scene created successfully",
      data: populatedScene,
    });
  } catch (error) {
    console.error("Error creating scene:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create scene",
      error: error.message,
    });
  }
};

// PUT /api/scenes/:id - Update scene
export const updateScene = async (req, res) => {
  try {
    const sceneId = req.params.id;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    // Handle completion
    if (updateData.status === "completed" && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const scene = await Scene.findByIdAndUpdate(sceneId, updateData, {
      new: true,
      runValidators: true,
    }).populate(populateFields());

    if (!scene) {
      return res.status(404).json({
        success: false,
        message: "Scene not found",
      });
    }

    res.json({
      success: true,
      message: "Scene updated successfully",
      data: scene,
    });
  } catch (error) {
    console.error("Error updating scene:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update scene",
      error: error.message,
    });
  }
};

// DELETE /api/scenes/:id - Delete scene
export const deleteScene = async (req, res) => {
  try {
    const scene = await Scene.findByIdAndDelete(req.params.id);

    if (!scene) {
      return res.status(404).json({
        success: false,
        message: "Scene not found",
      });
    }

    res.json({
      success: true,
      message: "Scene deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scene:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete scene",
      error: error.message,
    });
  }
};

// POST /api/scenes/:id/notes - Add note to scene
export const addSceneNote = async (req, res) => {
  try {
    const { text, role } = req.body;
    const userId = req.user?.id;

    if (!text || !role) {
      return res.status(400).json({
        success: false,
        message: "Text and role are required",
      });
    }

    const scene = await Scene.findById(req.params.id);
    if (!scene) {
      return res.status(404).json({
        success: false,
        message: "Scene not found",
      });
    }

    scene.notes.push({
      author: userId,
      text: text.trim(),
      role,
    });

    await scene.save();

    // Return updated scene with populated fields
    const updatedScene = await Scene.findById(scene._id).populate(
      populateFields()
    );

    res.json({
      success: true,
      message: "Note added successfully",
      data: updatedScene,
    });
  } catch (error) {
    console.error("Error adding scene note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add note",
      error: error.message,
    });
  }
};

// GET /api/scenes/status/:status - Get scenes by status
export const getScenesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { projectId } = req.query;

    const filter = { status };
    if (projectId) filter.projectId = projectId;

    const scenes = await Scene.find(filter)
      .populate(populateFields())
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: scenes,
      count: scenes.length,
    });
  } catch (error) {
    console.error("Error fetching scenes by status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scenes",
      error: error.message,
    });
  }
};

// PUT /api/scenes/:id/status - Update scene status
export const updateSceneStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const updateData = { status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    const scene = await Scene.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate(populateFields());

    if (!scene) {
      return res.status(404).json({
        success: false,
        message: "Scene not found",
      });
    }

    res.json({
      success: true,
      message: "Scene status updated successfully",
      data: scene,
    });
  } catch (error) {
    console.error("Error updating scene status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update scene status",
      error: error.message,
    });
  }
};