import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProject } from "../context/ProjectContext";

interface ProjectSidebarProps {
  projectId: string;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { projects, currentProject } = useProject();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleBackToProjects = () => {
    navigate("/");
  };

  const handleProjectClick = (id: string) => {
    if (id !== projectId) {
      navigate(`/project/${id}/board`);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        } flex-shrink-0`}
      >
        {/* Hamburger Toggle */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {!isCollapsed && (
            <span className="text-sm font-medium text-gray-700">Projects</span>
          )}
        </div>

        {/* Content */}
        <div className="py-4">
          {/* Back to Projects Button */}
          <button
            onClick={handleBackToProjects}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
            title="Back to Projects"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {!isCollapsed && <span className="ml-3">Back to Projects</span>}
          </button>

          {/* Divider */}
          <div className="my-3 border-t border-gray-200"></div>

          {/* Project List */}
          <div className="space-y-1 px-2">
            {projects.map((project) => {
              const isActive = project._id === projectId;
              return (
                <button
                  key={project._id}
                  onClick={() => handleProjectClick(project._id)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? project.name : undefined}
                >
                  {/* Project Icon/Initial */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Project Name */}
                  {!isCollapsed && (
                    <span className="ml-3 truncate">{project.name}</span>
                  )}

                  {/* Active Indicator */}
                  {!isCollapsed && isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectSidebar;
