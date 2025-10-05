import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";

interface ProjectSelectorProps {
  onCreateNew?: () => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onCreateNew }) => {
  const {
    currentProject,
    projects,
    setCurrentProject,
    projectsLoading,
    invitationsCount,
  } = useProject();

  const [isOpen, setIsOpen] = useState(false);

  const handleSelectProject = (projectId: string) => {
    const project = projects.find((p) => p._id === projectId);
    if (project) {
      setCurrentProject(project);
      setIsOpen(false);
    }
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateNew?.();
  };

  if (projectsLoading) {
    return (
      <div className="relative">
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg">
          <span className="text-sm text-gray-500">Loading...</span>
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="relative">
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-sm font-medium">Create Project</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900">
            {currentProject?.name || "Select Project"}
          </div>
          {currentProject?.userRoles && currentProject.userRoles.length > 0 && (
            <div className="text-xs text-gray-500">
              {currentProject.userRoles.join(", ")}
            </div>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-auto">
            {/* Projects List */}
            <div className="py-2">
              {projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => handleSelectProject(project._id)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    currentProject?._id === project._id ? "bg-indigo-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {project.description}
                        </div>
                      )}
                      {project.userRoles && project.userRoles.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {project.userRoles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {currentProject?._id === project._id && (
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Actions */}
            <div className="py-2">
              <button
                onClick={handleCreateNew}
                className="w-full px-4 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Project
              </button>

              {invitationsCount > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 font-semibold">
                    {invitationsCount}
                  </span>
                  Pending invitation{invitationsCount > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectSelector;
