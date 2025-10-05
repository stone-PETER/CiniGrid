import express from "express";
import {
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
} from "../controllers/invitationController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User invitations
router.get("/", getMyInvitations); // Get my invitations
router.post("/:invitationId/accept", acceptInvitation); // Accept invitation
router.post("/:invitationId/decline", declineInvitation); // Decline invitation
router.delete("/:invitationId", cancelInvitation); // Cancel invitation

export default router;
