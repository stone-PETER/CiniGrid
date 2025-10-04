import mongoose from "mongoose";

const aiRecommendationSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      index: true,
    },
    descriptionHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    results: [
      {
        name: {
          type: String,
          required: true,
        },
        reason: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 0,
          max: 10,
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
        address: String,
        placeId: String,
        photos: [
          {
            photoReference: String,
            width: Number,
            height: Number,
          },
        ],
        types: [String],
        additionalInfo: {
          rating: Number,
          userRatingsTotal: Number,
          priceLevel: Number,
          openingHours: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    metadata: {
      totalPlacesFound: {
        type: Number,
        default: 0,
      },
      totalPlacesAnalyzed: {
        type: Number,
        default: 0,
      },
      processingTime: {
        type: Number,
        default: 0,
      },
      apiCalls: {
        googlePlaces: {
          type: Number,
          default: 0,
        },
        gemini: {
          type: Number,
          default: 0,
        },
      },
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: { expires: 0 },
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for searching
aiRecommendationSchema.index({ description: "text" });

// Method to increment access count
aiRecommendationSchema.methods.recordAccess = async function () {
  this.accessCount += 1;
  this.lastAccessedAt = new Date();
  await this.save();
};

export default mongoose.model("AIRecommendation", aiRecommendationSchema);
