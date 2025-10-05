import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false, // Optional - for backward compatibility
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    time: {
      type: String, // Format: "HH:MM"
      required: false,
    },
    date: {
      type: String, // Format: "YYYY-MM-DD"
      required: false,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["backlogged", "pre-production", "ready", "ongoing", "in review", "completed"],
      default: "backlogged",
      index: true,
    },
    type: {
      type: String,
      enum: ["equipment", "location", "talent", "crew", "post-production", "logistics", "permits", "other"],
      default: "other",
    },
    location: {
      type: String, // Can reference a finalized location by name/title
      required: false,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinalizedLocation",
      required: false,
    },
    sceneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scene",
      required: false, // Tasks can be independent or linked to scenes
    },
    dependencies: [
      {
        type: String,
        trim: true,
      },
    ],
    users: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        name: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          required: true,
        },
      },
    ],
    resources: [
      {
        type: String,
        trim: true,
      },
    ],
    estimatedDuration: {
      type: Number, // Duration in minutes
      required: false,
    },
    actualDuration: {
      type: Number, // Actual duration in minutes (filled after completion)
      required: false,
    },
    estimatedCost: {
      type: Number, // Cost in base currency
      required: false,
    },
    actualCost: {
      type: Number, // Actual cost (filled after completion)
      required: false,
    },
    budget: {
      type: Number, // Allocated budget
      required: false,
    },
    notes: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          required: true,
        },
      },
    ],
    checklist: [
      {
        item: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        completedAt: {
          type: Date,
          required: false,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
    // Deadline and urgency
    dueDate: {
      type: Date,
      required: false,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    // Approval workflow
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    approvedAt: {
      type: Date,
      required: false,
    },
    approvalNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ createdBy: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ sceneId: 1 });
taskSchema.index({ type: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ isUrgent: 1, status: 1 });

export default mongoose.model("Task", taskSchema);