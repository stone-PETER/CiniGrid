import express from "express";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  updateMemberRoles,
  removeMember,
} from "../controllers/projectController.js";
import {
  inviteUser,
  getProjectInvitations,
} from "../controllers/invitationController.js";
import {
  authMiddleware,
  requireProjectMember,
  requireProjectAdmin,
  requireProjectOwner,
} from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Project CRUD
router.post("/", createProject); // Create project
router.get("/", getProjects); // Get all user's projects
router.get("/:projectId", requireProjectMember, getProject); // Get single project
router.put(
  "/:projectId",
  requireProjectMember,
  requireProjectAdmin,
  updateProject
); // Update project (admin only)
router.delete(
  "/:projectId",
  requireProjectMember,
  requireProjectOwner,
  deleteProject
); // Delete project (owner only)

// Project members
router.get("/:projectId/members", requireProjectMember, getProjectMembers); // Get all members
router.put(
  "/:projectId/members/:userId",
  requireProjectMember,
  requireProjectAdmin,
  updateMemberRoles
); // Update member roles (admin only)
router.delete(
  "/:projectId/members/:userId",
  requireProjectMember,
  requireProjectAdmin,
  removeMember
); // Remove member (admin only)

// Project invitations
router.post(
  "/:projectId/invitations",
  requireProjectMember,
  requireProjectAdmin,
  inviteUser
); // Invite user (admin only)
router.get(
  "/:projectId/invitations",
  requireProjectMember,
  requireProjectAdmin,
  getProjectInvitations
); // Get project invitations (admin only)

export default router;
