import mongoose from "mongoose";

const sceneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false, // Optional - for backward compatibility
      index: true,
    },
    sceneNumber: {
      type: String,
      required: false,
      trim: true,
      maxlength: 20,
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
      enum: [
        "backlogged",
        "pre-production",
        "ready",
        "ongoing",
        "in review",
        "completed",
      ],
      default: "backlogged",
      index: true,
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
    dependencies: [
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
    equipment: [
      {
        type: String,
        trim: true,
      },
    ],
    cast: [
      {
        name: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          required: true,
        },
        contact: {
          type: String,
          required: false,
        },
      },
    ],
    crew: [
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
    // Production specific fields
    shotType: {
      type: String,
      enum: [
        "wide",
        "medium",
        "close-up",
        "extreme close-up",
        "establishing",
        "insert",
        "other",
      ],
      required: false,
    },
    cameraAngles: [
      {
        type: String,
        enum: [
          "front",
          "back",
          "side",
          "overhead",
          "low",
          "high",
          "dutch",
          "other",
        ],
      },
    ],
    lighting: {
      type: String,
      enum: [
        "natural",
        "artificial",
        "mixed",
        "golden hour",
        "blue hour",
        "night",
      ],
      required: false,
    },
    weather: {
      type: String,
      enum: ["sunny", "cloudy", "rainy", "windy", "snow", "any"],
      required: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
sceneSchema.index({ projectId: 1, status: 1 });
sceneSchema.index({ createdBy: 1, createdAt: -1 });
sceneSchema.index({ assignedTo: 1, status: 1 });
sceneSchema.index({ date: 1, time: 1 });

export default mongoose.model("Scene", sceneSchema);
