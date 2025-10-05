import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional metadata
    status: {
      type: String,
      enum: ["active", "archived", "completed"],
      default: "active",
    },
    settings: {
      // Project-specific settings can be added here
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Script Analysis fields
    script: {
      filename: {
        type: String,
        default: null,
      },
      uploadDate: {
        type: Date,
        default: null,
      },
      textContent: {
        type: String,
        default: null,
      },
      locationPrompts: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster queries
projectSchema.index({ ownerId: 1, createdAt: -1 });
projectSchema.index({ name: 1, ownerId: 1 });

export default mongoose.model("Project", projectSchema);
