import React from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "../types";
import { getRoleBadgeColor } from "../constants/roles";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Instant navigation to board (home/default tab)
    navigate(`/project/${project._id}/board`);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer overflow-hidden border border-gray-200 hover:border-blue-400"
    >
      {/* Card Header */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
          {project.name}
        </h3>

        {/* Description */}
        {project.description ? (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
            {project.description}
          </p>
        ) : (
          <p className="text-gray-400 text-sm italic mb-4 min-h-[2.5rem]">
            No description
          </p>
        )}

        {/* Roles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.userRoles && project.userRoles.length > 0 ? (
            project.userRoles.map((role) => (
              <span
                key={role}
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(
                  role
                )}`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              Member
            </span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-500">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {formatDate(project.createdAt)}
        </div>

        {/* Status Badge */}
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            project.status === "active"
              ? "bg-green-100 text-green-800"
              : project.status === "completed"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default ProjectCard;
