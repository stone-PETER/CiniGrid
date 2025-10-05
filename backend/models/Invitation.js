import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inviteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roles: {
      type: [String],
      required: true,
      enum: ["owner", "producer", "director", "manager", "scout", "crew"],
      validate: {
        validator: function (roles) {
          return roles && roles.length > 0;
        },
        message: "At least one role is required",
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    expiresAt: {
      type: Date,
      default: function () {
        // Default expiration: 7 days from now
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      },
    },
    respondedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
invitationSchema.index({ inviteeId: 1, status: 1 });
invitationSchema.index({ projectId: 1, inviteeId: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Prevent duplicate pending invitations for same user+project
invitationSchema.index(
  { projectId: 1, inviteeId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

// Helper method to check if invitation is expired
invitationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

// Helper method to check if invitation can be accepted
invitationSchema.methods.canBeAccepted = function () {
  return this.status === "pending" && !this.isExpired();
};

export default mongoose.model("Invitation", invitationSchema);
