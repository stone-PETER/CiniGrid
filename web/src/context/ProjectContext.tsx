import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { Project, Invitation } from "../types";
import { projectService } from "../services/projectService";
import { useAuth } from "./AuthContext";

interface ProjectContextType {
  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  setCurrentProjectById: (projectId: string) => Promise<boolean>;

  // All user's projects
  projects: Project[];
  projectsLoading: boolean;
  refreshProjects: () => Promise<void>;

  // Invitations
  invitations: Invitation[];
  invitationsCount: number;
  invitationsLoading: boolean;
  refreshInvitations: () => Promise<void>;

  // Actions
  createProject: (data: {
    name: string;
    description?: string;
  }) => Promise<Project>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;

  // Helpers
  isAdmin: boolean;
  isOwner: boolean;
  canAccessProject: (projectId: string) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  // Load projects when user logs in
  const refreshProjects = useCallback(async () => {
    if (!isAuthenticated) {
      setProjects([]);
      setCurrentProject(null);
      return;
    }

    setProjectsLoading(true);
    try {
      const response = await projectService.getMyProjects();
      if (response.success && response.data) {
        // Backend returns: { success: true, data: { projects: [...], count: N } }
        const projectList = response.data.projects || [];
        setProjects((prevProjects) => {
          // Only update if the list actually changed
          const hasChanged =
            JSON.stringify(prevProjects) !== JSON.stringify(projectList);
          return hasChanged ? projectList : prevProjects;
        });

        // Auto-select first project if none selected
        setCurrentProject((prevCurrent) => {
          if (!prevCurrent && projectList.length > 0) {
            localStorage.setItem("currentProjectId", projectList[0]._id);
            return projectList[0];
          }

          // Update current project data if it's in the list
          if (prevCurrent) {
            const updated = projectList.find((p) => p._id === prevCurrent._id);
            if (
              updated &&
              JSON.stringify(updated) !== JSON.stringify(prevCurrent)
            ) {
              return updated;
            }
          }

          return prevCurrent;
        });
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setProjectsLoading(false);
    }
  }, [isAuthenticated]); // Removed currentProject from dependencies!

  // Load invitations
  const refreshInvitations = useCallback(async () => {
    if (!isAuthenticated) {
      setInvitations([]);
      setInvitationsCount(0);
      return;
    }

    setInvitationsLoading(true);
    try {
      const response = await projectService.getMyInvitations("pending");
      if (response.success && response.data) {
        // Backend returns: { success: true, data: { invitations: [...], count: N } }
        setInvitations(response.data.invitations || []);
        setInvitationsCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Failed to load invitations:", error);
    } finally {
      setInvitationsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load - only run once when authentication status changes
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated) {
      console.log("🔄 ProjectContext: Initial load triggered");

      // Load projects and invitations
      refreshProjects();
      refreshInvitations();

      // Restore last selected project (but don't trigger another refresh)
      const savedProjectId = localStorage.getItem("currentProjectId");
      if (savedProjectId && mounted) {
        console.log(
          "🔄 ProjectContext: Restoring saved project",
          savedProjectId
        );
        projectService
          .getProject(savedProjectId)
          .then((response) => {
            if (mounted && response.success && response.data) {
              console.log(
                "✅ ProjectContext: Restored project",
                response.data.project?.name
              );
              // Backend returns: { success: true, data: { project: {...} } }
              setCurrentProject(response.data.project || null);
            }
          })
          .catch(console.error);
      }
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, refreshProjects, refreshInvitations]); // Add them back but they're stable now

  // Save current project to localStorage
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem("currentProjectId", currentProject._id);
    } else {
      localStorage.removeItem("currentProjectId");
    }
  }, [currentProject]);

  // Create new project
  const createProject = async (data: {
    name: string;
    description?: string;
  }): Promise<Project> => {
    try {
      console.log("🆕 Creating project:", data.name);
      const response = await projectService.createProject(data);
      if (response.success && response.data) {
        // Backend returns: { success: true, data: { project: {...}, members: [...] } }
        const newProject = response.data.project;
        console.log("✅ Project created:", newProject._id);

        // Manually add to projects list instead of refreshing
        setProjects((prev) => [...prev, newProject]);

        // Auto-select new project
        setCurrentProject(newProject);
        localStorage.setItem("currentProjectId", newProject._id);

        return newProject;
      }
      throw new Error(response.message || "Failed to create project");
    } catch (error) {
      console.error("Create project error:", error);
      throw error;
    }
  };

  // Accept invitation
  const acceptInvitation = async (invitationId: string): Promise<void> => {
    try {
      const response = await projectService.acceptInvitation(invitationId);
      if (response.success) {
        // Refresh both projects and invitations
        await Promise.all([refreshProjects(), refreshInvitations()]);
      } else {
        throw new Error(response.message || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Accept invitation error:", error);
      throw error;
    }
  };

  // Decline invitation
  const declineInvitation = async (invitationId: string): Promise<void> => {
    try {
      const response = await projectService.declineInvitation(invitationId);
      if (response.success) {
        await refreshInvitations();
      } else {
        throw new Error(response.message || "Failed to decline invitation");
      }
    } catch (error) {
      console.error("Decline invitation error:", error);
      throw error;
    }
  };

  // Helper: Check if user is admin in current project
  const isAdmin =
    currentProject?.userRoles?.some((role) =>
      ["owner", "producer", "director"].includes(role)
    ) || false;

  // Helper: Check if user is owner of current project
  const isOwner = currentProject?.ownerId === user?.id || false;

  // Helper: Check if user can access a specific project
  const canAccessProject = (projectId: string): boolean => {
    return projects.some((p) => p._id === projectId);
  };

  // Set current project by ID (for URL params)
  const setCurrentProjectById = async (projectId: string): Promise<boolean> => {
    // Check if project is in the user's project list
    const project = projects.find((p) => p._id === projectId);
    if (project) {
      setCurrentProject(project);
      localStorage.setItem("currentProjectId", projectId);
      return true;
    }

    // Try to fetch from backend (in case projects list isn't loaded yet)
    try {
      const response = await projectService.getProject(projectId);
      if (response.success && response.data) {
        const fetchedProject = response.data.project;
        setCurrentProject(fetchedProject);
        localStorage.setItem("currentProjectId", projectId);
        return true;
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    }

    return false;
  };

  const value: ProjectContextType = {
    currentProject,
    setCurrentProject,
    setCurrentProjectById,
    projects,
    projectsLoading,
    refreshProjects,
    invitations,
    invitationsCount,
    invitationsLoading,
    refreshInvitations,
    createProject,
    acceptInvitation,
    declineInvitation,
    isAdmin,
    isOwner,
    canAccessProject,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
