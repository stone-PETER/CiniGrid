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
      // Scene Breakdown fields
      scenes: [
        {
          sceneNumber: String,
          heading: String,
          intExt: {
            type: String,
            enum: ["INT", "EXT", "INT/EXT"],
          },
          location: String,
          timeOfDay: {
            type: String,
            enum: [
              "DAY",
              "NIGHT",
              "DAWN",
              "DUSK",
              "MORNING",
              "AFTERNOON",
              "EVENING",
              "CONTINUOUS",
              "MAGIC HOUR",
              "LATER",
            ],
          },
          description: String,
          pageCount: Number,
          characters: [String],
          props: [String],
          vehicles: [String],
          wardrobe: [String],
          makeupHair: [String],
          specialEffects: [String],
          stunts: [String],
          animals: [String],
          extras: Number,
          notes: String,
          importedToSceneId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scene",
            default: null,
          },
        },
      ],
      breakdownStats: {
        totalScenes: Number,
        totalPages: Number,
        uniqueLocations: [String],
        uniqueCharacters: [String],
        intScenes: Number,
        extScenes: Number,
        dayScenes: Number,
        nightScenes: Number,
        generatedAt: Date,
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
