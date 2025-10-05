import Task from "../models/Task.js";
import Scene from "../models/Scene.js";
import User from "../models/User.js";

// Helper function to populate common fields
const populateFields = () => [
  { path: "createdBy", select: "username role" },
  { path: "assignedTo", select: "username role" },
  { path: "locationId", select: "title address coordinates" },
  { path: "sceneId", select: "title description status" },
  { path: "notes.author", select: "username role" },
  { path: "users.userId", select: "username role" },
  { path: "checklist.completedBy", select: "username role" },
  { path: "approvedBy", select: "username role" },
];

// GET /api/tasks - Get all tasks
export const getTasks = async (req, res) => {
  try {
    const { projectId, status, assignedTo, sceneId, type, isUrgent } = req.query;
    
    // Build query filter
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (sceneId) filter.sceneId = sceneId;
    if (type) filter.type = type;
    if (isUrgent !== undefined) filter.isUrgent = isUrgent === 'true';

    const tasks = await Task.find(filter)
      .populate(populateFields())
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// GET /api/tasks/:id - Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate(populateFields())
      .populate({
        path: "locationId",
        populate: { path: "addedBy", select: "username role" },
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch task",
      error: error.message,
    });
  }
};

// POST /api/tasks - Create new task
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      time,
      date,
      priority,
      status,
      type,
      location,
      locationId,
      sceneId,
      dependencies,
      users,
      resources,
      estimatedDuration,
      estimatedCost,
      budget,
      checklist,
      tags,
      assignedTo,
      dueDate,
      isUrgent,
      requiresApproval,
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

    const task = new Task({
      title: title.trim(),
      description: description.trim(),
      time,
      date,
      priority: priority || "Medium",
      status: status || "backlogged",
      type: type || "other",
      location,
      locationId,
      sceneId,
      dependencies: dependencies || [],
      users: users || [],
      resources: resources || [],
      estimatedDuration,
      estimatedCost,
      budget,
      checklist: checklist || [],
      tags: tags || [],
      createdBy: userId,
      assignedTo,
      dueDate,
      isUrgent: isUrgent || false,
      requiresApproval: requiresApproval || false,
      projectId,
    });

    await task.save();

    // Populate the response
    const populatedTask = await Task.findById(task._id).populate(
      populateFields()
    );

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: populatedTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    });
  }
};

// PUT /api/tasks/:id - Update task
export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    // Handle completion
    if (updateData.status === "completed" && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const task = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    }).populate(populateFields());

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// DELETE /api/tasks/:id - Delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

// POST /api/tasks/:id/notes - Add note to task
export const addTaskNote = async (req, res) => {
  try {
    const { text, role } = req.body;
    const userId = req.user?.id;

    if (!text || !role) {
      return res.status(400).json({
        success: false,
        message: "Text and role are required",
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.notes.push({
      author: userId,
      text: text.trim(),
      role,
    });

    await task.save();

    // Return updated task with populated fields
    const updatedTask = await Task.findById(task._id).populate(
      populateFields()
    );

    res.json({
      success: true,
      message: "Note added successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Error adding task note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add note",
      error: error.message,
    });
  }
};

// GET /api/tasks/status/:status - Get tasks by status
export const getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { projectId } = req.query;

    const filter = { status };
    if (projectId) filter.projectId = projectId;

    const tasks = await Task.find(filter)
      .populate(populateFields())
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error("Error fetching tasks by status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// PUT /api/tasks/:id/status - Update task status
export const updateTaskStatus = async (req, res) => {
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

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate(populateFields());

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message,
    });
  }
};

// PUT /api/tasks/:id/checklist/:itemId - Update checklist item
export const updateChecklistItem = async (req, res) => {
  try {
    const { taskId, itemId } = req.params;
    const { completed } = req.body;
    const userId = req.user?.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const checklistItem = task.checklist.id(itemId);
    if (!checklistItem) {
      return res.status(404).json({
        success: false,
        message: "Checklist item not found",
      });
    }

    checklistItem.completed = completed;
    if (completed) {
      checklistItem.completedBy = userId;
      checklistItem.completedAt = new Date();
    } else {
      checklistItem.completedBy = undefined;
      checklistItem.completedAt = undefined;
    }

    await task.save();

    const updatedTask = await Task.findById(taskId).populate(populateFields());

    res.json({
      success: true,
      message: "Checklist item updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Error updating checklist item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update checklist item",
      error: error.message,
    });
  }
};

// POST /api/tasks/:id/approve - Approve task
export const approveTask = async (req, res) => {
  try {
    const { approvalNotes } = req.body;
    const userId = req.user?.id;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        approvedBy: userId,
        approvedAt: new Date(),
        approvalNotes: approvalNotes || "",
      },
      { new: true, runValidators: true }
    ).populate(populateFields());

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task approved successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error approving task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve task",
      error: error.message,
    });
  }
};