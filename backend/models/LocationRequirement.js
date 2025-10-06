import mongoose from "mongoose";

const locationRequirementSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    budget: {
      max: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "USD",
      },
      notes: {
        type: String,
      },
    },
    constraints: {
      maxDistance: {
        type: Number, // Max miles from finalized locations
        min: 0,
      },
      requiredAmenities: [
        {
          type: String,
        },
      ],
      shootDates: [
        {
          startDate: Date,
          endDate: Date,
        },
      ],
      crewSize: {
        type: Number,
        min: 0,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
    // Stats
    potentialLocationsCount: {
      type: Number,
      default: 0,
    },
    finalizedLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinalizedLocation",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
locationRequirementSchema.index({ projectId: 1, status: 1 });
locationRequirementSchema.index({ createdBy: 1 });

export default mongoose.model("LocationRequirement", locationRequirementSchema);
