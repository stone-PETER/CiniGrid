import api from "./api";
import type {
  Project,
  ProjectMember,
  Invitation,
  CreateProjectRequest,
  InviteUserRequest,
  ApiResponse,
  ProjectRole,
} from "../types";

// ============================================
// PROJECT MANAGEMENT
// ============================================

export const projectService = {
  /**
   * Create a new project
   */
  createProject: async (
    data: CreateProjectRequest
  ): Promise<
    ApiResponse<{
      project: Project;
      members: ProjectMember[];
    }>
  > => {
    const response = await api.post("/projects", data);
    return response.data;
  },

  /**
   * Get all projects for current user
   */
  getMyProjects: async (): Promise<
    ApiResponse<{
      projects: Project[];
      count: number;
    }>
  > => {
    const response = await api.get("/projects");
    return response.data;
  },

  /**
   * Get single project details
   */
  getProject: async (
    projectId: string
  ): Promise<
    ApiResponse<{
      project: Project;
    }>
  > => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  /**
   * Update project details
   */
  updateProject: async (
    projectId: string,
    data: {
      name?: string;
      description?: string;
      status?: "active" | "archived" | "completed";
    }
  ): Promise<
    ApiResponse<{
      project: Project;
    }>
  > => {
    const response = await api.put(`/projects/${projectId}`, data);
    return response.data;
  },

  /**
   * Delete project (owner only)
   */
  deleteProject: async (projectId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  /**
   * Get all members of a project
   */
  getProjectMembers: async (
    projectId: string
  ): Promise<
    ApiResponse<{
      members: ProjectMember[];
      count: number;
    }>
  > => {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data;
  },

  /**
   * Update member roles
   */
  updateMemberRoles: async (
    projectId: string,
    userId: string,
    roles: ProjectRole[]
  ): Promise<
    ApiResponse<{
      member: ProjectMember;
    }>
  > => {
    const response = await api.put(`/projects/${projectId}/members/${userId}`, {
      roles,
    });
    return response.data;
  },

  /**
   * Remove member from project
   */
  removeMember: async (
    projectId: string,
    userId: string
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete(
      `/projects/${projectId}/members/${userId}`
    );
    return response.data;
  },

  // ============================================
  // INVITATIONS
  // ============================================

  /**
   * Invite user to project
   */
  inviteUser: async (
    projectId: string,
    data: InviteUserRequest
  ): Promise<
    ApiResponse<{
      invitation: Invitation;
    }>
  > => {
    const response = await api.post(`/projects/${projectId}/invitations`, data);
    return response.data;
  },

  /**
   * Get all invitations for current user
   */
  getMyInvitations: async (
    status?: "pending" | "accepted" | "declined" | "cancelled"
  ): Promise<
    ApiResponse<{
      invitations: Invitation[];
      count: number;
    }>
  > => {
    const params = status ? { status } : {};
    const response = await api.get("/invitations", { params });
    return response.data;
  },

  /**
   * Get all invitations for a project (admin only)
   */
  getProjectInvitations: async (
    projectId: string,
    status?: string
  ): Promise<
    ApiResponse<{
      invitations: Invitation[];
      count: number;
    }>
  > => {
    const params = status ? { status } : {};
    const response = await api.get(`/projects/${projectId}/invitations`, {
      params,
    });
    return response.data;
  },

  /**
   * Accept invitation
   */
  acceptInvitation: async (
    invitationId: string
  ): Promise<
    ApiResponse<{
      invitation: Invitation;
      member: ProjectMember;
      message: string;
    }>
  > => {
    const response = await api.post(`/invitations/${invitationId}/accept`);
    return response.data;
  },

  /**
   * Decline invitation
   */
  declineInvitation: async (
    invitationId: string
  ): Promise<
    ApiResponse<{
      invitation: Invitation;
      message: string;
    }>
  > => {
    const response = await api.post(`/invitations/${invitationId}/decline`);
    return response.data;
  },

  /**
   * Cancel invitation (inviter or admin only)
   */
  cancelInvitation: async (
    invitationId: string
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/invitations/${invitationId}`);
    return response.data;
  },
};

// Helper function to check if user has admin role in project
export const isProjectAdmin = (project: Project): boolean => {
  if (!project.userRoles || project.userRoles.length === 0) return false;
  return project.userRoles.some((role) =>
    ["owner", "producer", "director"].includes(role)
  );
};

// Helper function to check if user is project owner
export const isProjectOwner = (project: Project, userId: string): boolean => {
  return project.ownerId === userId;
};

// Helper function to check if user has specific role
export const hasProjectRole = (
  project: Project,
  role: ProjectRole
): boolean => {
  return project.userRoles?.includes(role) || false;
};

// Helper function to check if user has any of the specified roles
export const hasAnyProjectRole = (
  project: Project,
  roles: ProjectRole[]
): boolean => {
  return project.userRoles?.some((role) => roles.includes(role)) || false;
};
