import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
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
  {
    timestamps: true,
  }
);

const approvalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    approved: {
      type: Boolean,
      required: true,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

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
    estimatedCost: {
      type: String,
      default: "",
    },
    processingTime: {
      type: String,
      default: "",
    },
    authority: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const potentialLocationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false, // Optional - for backward compatibility with orphaned data
      index: true,
    },
    // Link to LocationRecord (new workflow)
    locationRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationRecord",
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
    },
    address: {
      type: String,
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
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
    permits: [permitSchema],
    filmingDetails: {
      accessibility: String,
      parking: String,
      powerAccess: String,
      bestTimeToFilm: String,
      crowdLevel: String,
      weatherConsiderations: String,
    },
    estimatedCost: {
      type: String,
    },
    images: [
      {
        type: String, // URLs to images
      },
    ],
    photos: [
      {
        url: String,
        width: Number,
        height: Number,
        photoReference: String,
      },
    ],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    placeId: {
      type: String,
    },
    mapsLink: {
      type: String,
    },
    googleTypes: [
      {
        type: String,
      },
    ],
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: [noteSchema],
    // Multi-user team notes (new workflow)
    teamNotes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        userRole: {
          type: String,
          default: "",
        },
        note: {
          type: String,
          required: true,
          maxlength: 2000,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        edited: {
          type: Boolean,
          default: false,
        },
        editedAt: {
          type: Date,
        },
      },
    ],
    approvals: [approvalSchema],
    tags: [
      {
        type: String,
      },
    ],
    // Budget information (LLM estimated or manual)
    budget: {
      dailyRate: {
        type: Number,
        min: 0,
      },
      estimatedMin: {
        type: Number,
        min: 0,
      },
      estimatedMax: {
        type: Number,
        min: 0,
      },
      confidence: {
        type: String,
        enum: ["low", "medium", "high"],
      },
      reasoning: {
        type: String,
      },
      currency: {
        type: String,
        default: "USD",
      },
      deposit: {
        type: Number,
        min: 0,
      },
      negotiable: {
        type: Boolean,
        default: false,
      },
      notes: {
        type: String,
      },
      lastUpdated: {
        type: Date,
      },
    },
    // Auto-extracted amenities
    amenities: {
      parking: {
        type: Boolean,
        default: false,
      },
      wifi: {
        type: Boolean,
        default: false,
      },
      power: {
        type: Boolean,
        default: false,
      },
      kitchen: {
        type: Boolean,
        default: false,
      },
      greenRoom: {
        type: Boolean,
        default: false,
      },
      bathroom: {
        type: Boolean,
        default: false,
      },
      loadingDock: {
        type: Boolean,
        default: false,
      },
      cateringSpace: {
        type: Boolean,
        default: false,
      },
      extractedAt: {
        type: Date,
      },
    },
    // Cached API data
    cachedData: {
      nearbyHotels: [
        {
          name: String,
          address: String,
          distance: Number, // in miles
          priceRange: String, // "$", "$$", "$$$", "$$$$"
          rating: Number,
          placeId: String,
        },
      ],
      nearbyRestaurants: [
        {
          name: String,
          address: String,
          distance: Number, // in miles
          rating: Number,
          priceLevel: Number, // 1-4
          placeId: String,
        },
      ],
      transportation: {
        nearestMetro: {
          name: String,
          distance: Number, // in miles
        },
        nearestBusStop: {
          name: String,
          distance: Number, // in miles
        },
        parkingFacilities: [
          {
            name: String,
            distance: Number,
            type: String, // "parking_lot", "street_parking"
          },
        ],
      },
      weather: {
        current: {
          temp: Number,
          condition: String,
          humidity: Number,
          windSpeed: Number,
        },
        forecast: [
          {
            date: Date,
            temp: { min: Number, max: Number },
            condition: String,
            precipitation: Number,
          },
        ],
        bestMonths: [String], // ["April", "May", "September"]
      },
      distanceToFinalizedLocations: [
        {
          locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FinalizedLocation",
          },
          locationName: String,
          distance: Number, // in miles
        },
      ],
      lastFetched: {
        type: Date,
      },
      cacheExpiry: {
        type: Date,
      },
    },
    // Comparison metrics
    comparisonScore: {
      overall: Number,
      budget: Number,
      similarity: Number,
      crewAccess: Number,
      transportation: Number,
      lastCalculated: Date,
    },
    // Link to requirement
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationRequirement",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("PotentialLocation", potentialLocationSchema);
