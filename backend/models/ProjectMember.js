import mongoose from "mongoose";

const projectMemberSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
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
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Owner doesn't have an inviter
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique user per project
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

// Index for faster queries
projectMemberSchema.index({ userId: 1, status: 1 });
projectMemberSchema.index({ projectId: 1, status: 1 });

// Helper method to check if member has specific role
projectMemberSchema.methods.hasRole = function (role) {
  return this.roles.includes(role);
};

// Helper method to check if member has any of the specified roles
projectMemberSchema.methods.hasAnyRole = function (roles) {
  return roles.some((role) => this.roles.includes(role));
};

// Helper method to check if member is owner/producer/director (admin-level)
projectMemberSchema.methods.isAdmin = function () {
  return this.hasAnyRole(["owner", "producer", "director"]);
};

export default mongoose.model("ProjectMember", projectMemberSchema);
