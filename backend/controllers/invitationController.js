import Invitation from "../models/Invitation.js";
import ProjectMember from "../models/ProjectMember.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

/**
 * @route   POST /api/projects/:projectId/invitations
 * @desc    Invite user to project
 * @access  Private (admin roles only)
 */
export const inviteUser = async (req, res) => {
  console.log("📧 inviteUser controller called");
  console.log("  Project:", req.project?._id);
  console.log("  Inviter:", req.user?._id);
  console.log("  Body:", req.body);

  try {
    const { username, roles, message } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: "Username is required.",
      });
    }

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Valid roles array is required.",
      });
    }

    // Find user by username
    const invitee = await User.findOne({ username });
    if (!invitee) {
      return res.status(404).json({
        success: false,
        error: `User "${username}" not found.`,
      });
    }

    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
      projectId: req.params.projectId,
      userId: invitee._id,
      status: "active",
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: "User is already a member of this project.",
      });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findOne({
      projectId: req.params.projectId,
      inviteeId: invitee._id,
      status: "pending",
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        error: "User already has a pending invitation for this project.",
      });
    }

    // Create invitation
    const invitation = new Invitation({
      projectId: req.params.projectId,
      inviterId: req.user._id,
      inviteeId: invitee._id,
      roles,
      message: message || "",
    });

    await invitation.save();

    // Populate for response
    await invitation.populate([
      { path: "projectId", select: "name description" },
      { path: "inviterId", select: "username" },
      { path: "inviteeId", select: "username" },
    ]);

    res.status(201).json({
      success: true,
      data: { invitation },
    });
  } catch (error) {
    console.error("Invite user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send invitation.",
    });
  }
};

/**
 * @route   GET /api/invitations
 * @desc    Get all invitations for current user
 * @access  Private
 */
export const getMyInvitations = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {
      inviteeId: req.user._id,
    };

    // Filter by status if provided
    if (
      status &&
      ["pending", "accepted", "declined", "cancelled"].includes(status)
    ) {
      query.status = status;
    } else {
      // Default: only show pending invitations
      query.status = "pending";
    }

    const invitations = await Invitation.find(query)
      .populate("projectId", "name description")
      .populate("inviterId", "username")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        invitations,
        count: invitations.length,
      },
    });
  } catch (error) {
    console.error("Get invitations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch invitations.",
    });
  }
};

/**
 * @route   GET /api/projects/:projectId/invitations
 * @desc    Get all invitations for a project
 * @access  Private (admin roles only)
 */
export const getProjectInvitations = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {
      projectId: req.params.projectId,
    };

    if (status) {
      query.status = status;
    }

    const invitations = await Invitation.find(query)
      .populate("inviteeId", "username")
      .populate("inviterId", "username")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        invitations,
        count: invitations.length,
      },
    });
  } catch (error) {
    console.error("Get project invitations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project invitations.",
    });
  }
};

/**
 * @route   POST /api/invitations/:invitationId/accept
 * @desc    Accept invitation
 * @access  Private
 */
export const acceptInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(
      req.params.invitationId
    ).populate("projectId");

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Invitation not found.",
      });
    }

    // Verify this invitation is for current user
    if (invitation.inviteeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "This invitation is not for you.",
      });
    }

    // Check if invitation can be accepted
    if (!invitation.canBeAccepted()) {
      return res.status(400).json({
        success: false,
        error: invitation.isExpired()
          ? "Invitation has expired."
          : "Invitation is no longer pending.",
      });
    }

    // Check if project still exists
    if (!invitation.projectId) {
      return res.status(404).json({
        success: false,
        error: "Project no longer exists.",
      });
    }

    // Check if already a member (edge case)
    const existingMember = await ProjectMember.findOne({
      projectId: invitation.projectId._id,
      userId: req.user._id,
      status: "active",
    });

    if (existingMember) {
      // Update invitation status anyway
      invitation.status = "accepted";
      invitation.respondedAt = new Date();
      await invitation.save();

      return res.status(400).json({
        success: false,
        error: "You are already a member of this project.",
      });
    }

    // Create project member
    const member = new ProjectMember({
      projectId: invitation.projectId._id,
      userId: req.user._id,
      roles: invitation.roles,
      invitedBy: invitation.inviterId,
      status: "active",
    });

    await member.save();

    // Update invitation status
    invitation.status = "accepted";
    invitation.respondedAt = new Date();
    await invitation.save();

    // Populate member for response
    await member.populate("userId", "username");

    res.json({
      success: true,
      data: {
        invitation,
        member,
      },
      message: `You have joined ${invitation.projectId.name}!`,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to accept invitation.",
    });
  }
};

/**
 * @route   POST /api/invitations/:invitationId/decline
 * @desc    Decline invitation
 * @access  Private
 */
export const declineInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Invitation not found.",
      });
    }

    // Verify this invitation is for current user
    if (invitation.inviteeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "This invitation is not for you.",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Invitation is not pending.",
      });
    }

    // Update invitation status
    invitation.status = "declined";
    invitation.respondedAt = new Date();
    await invitation.save();

    res.json({
      success: true,
      data: { invitation },
      message: "Invitation declined.",
    });
  } catch (error) {
    console.error("Decline invitation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to decline invitation.",
    });
  }
};

/**
 * @route   DELETE /api/invitations/:invitationId
 * @desc    Cancel invitation (inviter or admin only)
 * @access  Private
 */
export const cancelInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Invitation not found.",
      });
    }

    // Check if user is inviter or project admin
    const isInviter =
      invitation.inviterId.toString() === req.user._id.toString();
    const isAdmin = await ProjectMember.findOne({
      projectId: invitation.projectId,
      userId: req.user._id,
      status: "active",
    }).then((member) => member && member.isAdmin());

    if (!isInviter && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Only inviter or project admin can cancel this invitation.",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Only pending invitations can be cancelled.",
      });
    }

    // Update invitation status
    invitation.status = "cancelled";
    await invitation.save();

    res.json({
      success: true,
      message: "Invitation cancelled.",
    });
  } catch (error) {
    console.error("Cancel invitation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel invitation.",
    });
  }
};
