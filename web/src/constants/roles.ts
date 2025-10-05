import type { ProjectRole } from "../types";

/**
 * Configurable roles list for the project system
 * Easy to extend by adding new entries to this array
 */
export interface RoleConfig {
  value: ProjectRole;
  label: string;
  description: string;
  color: string; // Tailwind color classes for badges
}

export const AVAILABLE_ROLES: RoleConfig[] = [
  {
    value: "scout",
    label: "Scout",
    description: "Find and recommend filming locations",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Coordinate tasks and team members",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "director",
    label: "Director",
    description: "Creative control and final decisions",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "producer",
    label: "Producer",
    description: "Manage budget, schedule, and crew",
    color: "bg-red-100 text-red-800",
  },
  {
    value: "crew",
    label: "Crew",
    description: "Basic access to view and contribute",
    color: "bg-gray-100 text-gray-800",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Full control over all project settings",
    color: "bg-purple-100 text-purple-800",
  },
];

/**
 * Get role configuration by value
 */
export const getRoleConfig = (role: ProjectRole): RoleConfig | undefined => {
  return AVAILABLE_ROLES.find((r) => r.value === role);
};

/**
 * Get role badge color
 */
export const getRoleBadgeColor = (role: ProjectRole): string => {
  return getRoleConfig(role)?.color || "bg-gray-100 text-gray-800";
};

/**
 * Roles available for inviting members (excludes owner)
 */
export const INVITABLE_ROLES = AVAILABLE_ROLES.filter(
  (role) => role.value !== "owner"
);
