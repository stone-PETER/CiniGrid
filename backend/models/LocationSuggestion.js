import mongoose from "mongoose";

const permitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const locationSuggestionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false, // Optional - for backward compatibility with orphaned data
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    region: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    permits: [permitSchema],
    images: [
      {
        type: String, // URLs to images
      },
    ],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("LocationSuggestion", locationSuggestionSchema);
