import Project from "../models/Project.js";
import ProjectMember from "../models/ProjectMember.js";
import User from "../models/User.js";

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
export const createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Project name is required.",
      });
    }

    // Create project
    const project = new Project({
      name: name.trim(),
      description: description?.trim() || "",
      ownerId: req.user._id,
    });

    await project.save();

    // Add owner as project member with 'owner' role
    const ownerMember = new ProjectMember({
      projectId: project._id,
      userId: req.user._id,
      roles: ["owner"],
      status: "active",
    });

    await ownerMember.save();

    // Add additional members if provided
    if (members && Array.isArray(members) && members.length > 0) {
      for (const member of members) {
        const { username, roles } = member;

        if (
          !username ||
          !roles ||
          !Array.isArray(roles) ||
          roles.length === 0
        ) {
          continue; // Skip invalid members
        }

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
          continue; // Skip if user not found
        }

        // Check if already added (including owner)
        if (user._id.toString() === req.user._id.toString()) {
          continue; // Skip owner
        }

        // Create project member
        const projectMember = new ProjectMember({
          projectId: project._id,
          userId: user._id,
          roles,
          invitedBy: req.user._id,
          status: "active",
        });

        await projectMember.save();
      }
    }

    // Fetch complete project with members
    const projectWithMembers = await Project.findById(project._id);
    const allMembers = await ProjectMember.find({ projectId: project._id })
      .populate("userId", "username")
      .populate("invitedBy", "username");

    res.status(201).json({
      success: true,
      data: {
        project: projectWithMembers,
        members: allMembers,
      },
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create project.",
    });
  }
};

/**
 * @route   GET /api/projects
 * @desc    Get all projects for current user
 * @access  Private
 */
export const getProjects = async (req, res) => {
  try {
    // Find all project memberships for user
    const memberships = await ProjectMember.find({
      userId: req.user._id,
      status: "active",
    }).select("projectId roles");

    const projectIds = memberships.map((m) => m.projectId);

    // Get all projects
    const projects = await Project.find({
      _id: { $in: projectIds },
    }).sort({ updatedAt: -1 });

    // Attach user's roles to each project
    const projectsWithRoles = projects.map((project) => {
      const membership = memberships.find(
        (m) => m.projectId.toString() === project._id.toString()
      );

      return {
        ...project.toObject(),
        userRoles: membership?.roles || [],
      };
    });

    res.json({
      success: true,
      data: {
        projects: projectsWithRoles,
        count: projectsWithRoles.length,
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects.",
    });
  }
};

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get single project with members
 * @access  Private (must be project member)
 */
export const getProject = async (req, res) => {
  try {
    // req.project is already populated by requireProjectMember middleware
    const members = await ProjectMember.find({
      projectId: req.project._id,
      status: "active",
    })
      .populate("userId", "username")
      .populate("invitedBy", "username");

    res.json({
      success: true,
      data: {
        project: req.project,
        members,
        userRoles: req.projectMember.roles,
      },
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project.",
    });
  }
};

/**
 * @route   PUT /api/projects/:projectId
 * @desc    Update project
 * @access  Private (admin roles only)
 */
export const updateProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const updates = {};
    if (name !== undefined && name.trim().length > 0)
      updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (status !== undefined) updates.status = status;

    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update project.",
    });
  }
};

/**
 * @route   DELETE /api/projects/:projectId
 * @desc    Delete project (owner only)
 * @access  Private (owner only)
 */
export const deleteProject = async (req, res) => {
  try {
    // Delete all project members
    await ProjectMember.deleteMany({ projectId: req.params.projectId });

    // Delete the project
    await Project.findByIdAndDelete(req.params.projectId);

    res.json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete project.",
    });
  }
};

/**
 * @route   GET /api/projects/:projectId/members
 * @desc    Get all members of a project
 * @access  Private (must be project member)
 */
export const getProjectMembers = async (req, res) => {
  try {
    const members = await ProjectMember.find({
      projectId: req.params.projectId,
      status: "active",
    })
      .populate("userId", "username")
      .populate("invitedBy", "username")
      .sort({ joinedAt: -1 });

    res.json({
      success: true,
      data: {
        members,
        count: members.length,
      },
    });
  } catch (error) {
    console.error("Get project members error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project members.",
    });
  }
};

/**
 * @route   PUT /api/projects/:projectId/members/:userId
 * @desc    Update member roles
 * @access  Private (admin roles only)
 */
export const updateMemberRoles = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Valid roles array is required.",
      });
    }

    // Cannot change owner's roles
    if (req.project.ownerId.toString() === userId) {
      return res.status(400).json({
        success: false,
        error: "Cannot modify project owner roles.",
      });
    }

    const member = await ProjectMember.findOneAndUpdate(
      {
        projectId: req.params.projectId,
        userId,
        status: "active",
      },
      { roles },
      { new: true, runValidators: true }
    ).populate("userId", "username");

    if (!member) {
      return res.status(404).json({
        success: false,
        error: "Project member not found.",
      });
    }

    res.json({
      success: true,
      data: { member },
    });
  } catch (error) {
    console.error("Update member roles error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update member roles.",
    });
  }
};

/**
 * @route   DELETE /api/projects/:projectId/members/:userId
 * @desc    Remove member from project
 * @access  Private (admin roles only)
 */
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    // Cannot remove owner
    if (req.project.ownerId.toString() === userId) {
      return res.status(400).json({
        success: false,
        error: "Cannot remove project owner.",
      });
    }

    const result = await ProjectMember.findOneAndUpdate(
      {
        projectId: req.params.projectId,
        userId,
        status: "active",
      },
      { status: "inactive" },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Project member not found.",
      });
    }

    res.json({
      success: true,
      message: "Member removed successfully.",
    });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove member.",
    });
  }
};
