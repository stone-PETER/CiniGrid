import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      required: false, // No longer required - roles are now project-based
      enum: ["producer", "director", "manager", "scout", "crew"],
      default: undefined, // No default role
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
