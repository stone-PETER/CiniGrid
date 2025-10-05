import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ProjectMember from "../models/ProjectMember.js";
import Project from "../models/Project.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid token. User not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid token.",
    });
  }
};

export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// Aliases for backward compatibility
export const protect = authMiddleware;
export const authorize = (...roles) => roleMiddleware(roles);

// ============================================
// PROJECT-BASED AUTHORIZATION MIDDLEWARE
// ============================================

/**
 * Middleware to check if user is a member of the project
 * Adds req.projectMember to the request if user is a member
 * Usage: requireProjectMember (get projectId from req.params.projectId or req.body.projectId)
 */
export const requireProjectMember = async (req, res, next) => {
  try {
    console.log("🔐 requireProjectMember middleware called");
    console.log("  User:", req.user?._id);
    console.log("  Route params:", req.params);
    console.log("  Body:", req.body);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const projectId =
      req.params.projectId || req.body.projectId || req.query.projectId;

    console.log("  Extracted projectId:", projectId);

    if (!projectId) {
      console.log("  ❌ No projectId found");
      return res.status(400).json({
        success: false,
        error: "Project ID is required.",
      });
    }

    // Check if project exists
    console.log("  📊 Looking for project:", projectId);
    const project = await Project.findById(projectId);
    console.log("  Project found:", project ? "YES" : "NO");

    if (!project) {
      console.log("  ❌ Project not found in database");
      return res.status(404).json({
        success: false,
        error: "Project not found.",
      });
    }

    // Check if user is a member
    console.log("  👥 Looking for membership:", {
      projectId,
      userId: req.user._id,
    });
    const member = await ProjectMember.findOne({
      projectId,
      userId: req.user._id,
      status: "active",
    });
    console.log("  Member found:", member ? "YES" : "NO");
    console.log("  Member roles:", member?.roles);

    if (!member) {
      console.log("  ❌ User is not a member of this project");
      return res.status(403).json({
        success: false,
        error: "You are not a member of this project.",
      });
    }

    // Attach project and member info to request
    req.project = project;
    req.projectMember = member;
    console.log("  ✅ requireProjectMember passed");
    next();
  } catch (error) {
    console.error("Project member check error:", error);
    res.status(500).json({
      success: false,
      error: "Error checking project membership.",
    });
  }
};

/**
 * Middleware to check if user has specific role(s) in the project
 * Must be used after requireProjectMember
 * Usage: requireProjectRole(['owner', 'director', 'producer'])
 * Note: 'owner', 'producer', 'director' have admin-level privileges
 */
export const requireProjectRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.projectMember) {
        return res.status(500).json({
          success: false,
          error:
            "requireProjectMember must be called before requireProjectRole.",
        });
      }

      // Check if user has any of the allowed roles
      const hasRole = req.projectMember.hasAnyRole(allowedRoles);

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("Project role check error:", error);
      res.status(500).json({
        success: false,
        error: "Error checking project role.",
      });
    }
  };
};

/**
 * Middleware to check if user is admin (owner/producer/director) in the project
 * Must be used after requireProjectMember
 * Usage: requireProjectAdmin
 */
export const requireProjectAdmin = async (req, res, next) => {
  try {
    console.log("👔 requireProjectAdmin middleware called");

    if (!req.projectMember) {
      console.log("  ❌ No projectMember found on request");
      return res.status(500).json({
        success: false,
        error:
          "requireProjectMember must be called before requireProjectAdmin.",
      });
    }

    console.log("  Checking if user is admin...");
    console.log("  User roles:", req.projectMember.roles);

    if (!req.projectMember.isAdmin()) {
      console.log("  ❌ User is not an admin");
      return res.status(403).json({
        success: false,
        error:
          "Access denied. Admin privileges required (owner, producer, or director).",
      });
    }

    console.log("  ✅ requireProjectAdmin passed");
    next();
  } catch (error) {
    console.error("Project admin check error:", error);
    res.status(500).json({
      success: false,
      error: "Error checking project admin status.",
    });
  }
};

/**
 * Middleware to check if user is the project owner
 * Must be used after requireProjectMember
 * Usage: requireProjectOwner
 */
export const requireProjectOwner = async (req, res, next) => {
  try {
    if (!req.project) {
      return res.status(500).json({
        success: false,
        error:
          "requireProjectMember must be called before requireProjectOwner.",
      });
    }

    if (req.project.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only project owner can perform this action.",
      });
    }

    next();
  } catch (error) {
    console.error("Project owner check error:", error);
    res.status(500).json({
      success: false,
      error: "Error checking project ownership.",
    });
  }
};
