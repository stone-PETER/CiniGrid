import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import { projectService } from "../services/projectService";
import { INVITABLE_ROLES } from "../constants/roles";
import { getRoleBadgeColor } from "../constants/roles";
import type { ProjectMember, ProjectRole, Invitation } from "../types";

const MembersSection: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, isAdmin } = useProject();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>(
    []
  );
  const [membersLoading, setMembersLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite Modal State
  const [username, setUsername] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<ProjectRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const loadMembers = React.useCallback(async () => {
    if (!projectId) return;

    setMembersLoading(true);
    try {
      // Fetch both members and pending invitations
      const [membersResponse, invitationsResponse] = await Promise.all([
        projectService.getProjectMembers(projectId),
        isAdmin
          ? projectService.getProjectInvitations(projectId, "pending")
          : Promise.resolve({
              success: true,
              data: { invitations: [], count: 0 },
            }),
      ]);

      if (membersResponse.success && membersResponse.data) {
        setMembers(membersResponse.data.members);
      }

      if (invitationsResponse.success && invitationsResponse.data) {
        setPendingInvitations(invitationsResponse.data.invitations);
      }
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setMembersLoading(false);
    }
  }, [projectId, isAdmin]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRoleToggle = (role: ProjectRole) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleRemoveRole = (role: ProjectRole) => {
    setSelectedRoles((prev) => prev.filter((r) => r !== role));
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setInviteError("Username is required");
      return;
    }

    if (selectedRoles.length === 0) {
      setInviteError("Please select at least one role");
      return;
    }

    if (!projectId) {
      setInviteError("Project ID is missing");
      return;
    }

    setInviteLoading(true);
    setInviteError("");

    try {
      const response = await projectService.inviteUser(projectId, {
        username: username.trim(),
        roles: selectedRoles,
      });

      if (response.success) {
        // Close modal and reset
        setShowInviteModal(false);
        setUsername("");
        setSelectedRoles([]);
        setSearchQuery("");
        // Reload members to show pending invite
        loadMembers();
      } else {
        setInviteError(response.message || "Failed to send invitation");
      }
    } catch (err: unknown) {
      console.error("Invite error:", err);

      // Extract error message from different possible formats
      let errorMessage = "Failed to send invitation";

      if (err && typeof err === "object" && "response" in err) {
        const error = err as {
          response?: { data?: { error?: string; message?: string } };
          message?: string;
        };
        if (error.response?.data?.error) {
          // Backend error message
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setInviteError(errorMessage);
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredRoles = INVITABLE_ROLES.filter((role) =>
    role.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage who has access to {currentProject.name}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Add Member
          </button>
        )}
      </div>

      {/* Members List */}
      {membersLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {members.map((member) => {
              const isOwner = member.userId._id === currentProject.ownerId;
              return (
                <div
                  key={member._id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {member.userId.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.userId.username}
                        {isOwner && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Owner
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined {formatDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="flex items-center space-x-2">
                    {member.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(
                          role
                        )}`}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Invitations Section */}
      {isAdmin && pendingInvitations.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Pending Invitations ({pendingInvitations.length})
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="divide-y divide-gray-200">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {invitation.inviteeId.username
                            ?.charAt(0)
                            .toUpperCase() || "?"}
                        </span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invitation.inviteeId.username}
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Invited
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Invited {formatDate(invitation.createdAt)} by{" "}
                        {invitation.inviterId.username}
                      </p>
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="flex items-center space-x-2">
                    {invitation.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(
                          role
                        )}`}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => !inviteLoading && setShowInviteModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Team Member
              </h2>
              <button
                onClick={() => !inviteLoading && setShowInviteModal(false)}
                disabled={inviteLoading}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-6">
              {/* Error */}
              {inviteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">{inviteError}</p>
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setInviteError("");
                  }}
                  disabled={inviteLoading}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  autoFocus
                />
              </div>

              {/* Roles - Tag Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles <span className="text-red-500">*</span>
                </label>

                {/* Selected Roles Display */}
                {selectedRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {selectedRoles.map((role) => {
                      const roleConfig = INVITABLE_ROLES.find(
                        (r) => r.value === role
                      );
                      return (
                        <span
                          key={role}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {roleConfig?.label}
                          <button
                            type="button"
                            onClick={() => handleRemoveRole(role)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Search Box */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roles..."
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Role Options */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredRoles.map((role) => {
                    const isSelected = selectedRoles.includes(role.value);
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleToggle(role.value)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
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
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {role.label}
                            </p>
                            <p className="text-xs text-gray-500">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  disabled={inviteLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    inviteLoading ||
                    !username.trim() ||
                    selectedRoles.length === 0
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {inviteLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersSection;
