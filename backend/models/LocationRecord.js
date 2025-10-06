import mongoose from "mongoose";

/**
 * LocationRecord Schema
 *
 * Represents a location need from the script (manually created by user).
 * NOT tied to specific scenes - just a master list of needed location types.
 *
 * Example: "Victorian Mansion", "Modern Office", "City Street"
 */
const locationRecordSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    userNotes: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    status: {
      type: String,
      enum: ["pending", "searching", "finalized"],
      default: "pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Optional tags for filtering/organization
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Stats for quick reference
    stats: {
      potentialsCount: {
        type: Number,
        default: 0,
      },
      finalizedCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
locationRecordSchema.index({ projectId: 1, createdAt: -1 });
locationRecordSchema.index({ projectId: 1, status: 1 });

// Virtual for potential locations
locationRecordSchema.virtual("potentialLocations", {
  ref: "PotentialLocation",
  localField: "_id",
  foreignField: "locationRecordId",
});

// Virtual for finalized locations
locationRecordSchema.virtual("finalizedLocations", {
  ref: "FinalizedLocation",
  localField: "_id",
  foreignField: "locationRecordId",
});

const LocationRecord = mongoose.model("LocationRecord", locationRecordSchema);

export default LocationRecord;
