import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { getRoleBadgeColor } from "../constants/roles";

interface InvitesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const InvitesSidebar: React.FC<InvitesSidebarProps> = ({ isOpen, onClose }) => {
  const {
    invitations,
    invitationsLoading,
    acceptInvitation,
    declineInvitation,
    refreshInvitations,
  } = useProject();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const handleAccept = async (invitationId: string) => {
    setProcessingId(invitationId);
    setError("");

    try {
      await acceptInvitation(invitationId);

      // Show "Accepted!" message briefly
      setAcceptedId(invitationId);
      setTimeout(() => {
        setAcceptedId(null);
        refreshInvitations(); // Refresh to remove from list
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId);
    setError("");

    try {
      await declineInvitation(invitationId);
      await refreshInvitations(); // Refresh to remove from list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to decline invitation"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Sidebar Overlay */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Invitations
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {invitations.length} invitation
              {invitations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
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

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {invitationsLoading && (
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
          )}

          {/* Empty State */}
          {!invitationsLoading && invitations.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No pending invitations
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                You're all caught up!
              </p>
            </div>
          )}

          {/* Invitations List */}
          {!invitationsLoading && invitations.length > 0 && (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  {/* Accepted State */}
                  {acceptedId === invitation._id ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-green-600">
                        Accepted!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Project Name */}
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {invitation.projectId.name}
                      </h3>

                      {/* Description */}
                      {invitation.projectId.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {invitation.projectId.description}
                        </p>
                      )}

                      {/* Roles */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {invitation.roles.map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(
                              role
                            )}`}
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                        ))}
                      </div>

                      {/* Invited By & Date */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>Invited by {invitation.inviterId.username}</span>
                        <span>{formatDate(invitation.createdAt)}</span>
                      </div>

                      {/* Personal Message */}
                      {invitation.message && (
                        <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-4">
                          <p className="text-sm text-gray-700 italic">
                            "{invitation.message}"
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleAccept(invitation._id)}
                          disabled={processingId === invitation._id}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {processingId === invitation._id ? (
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
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDecline(invitation._id)}
                          disabled={processingId === invitation._id}
                          className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {processingId === invitation._id ? (
                            "Processing..."
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Decline
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InvitesSidebar;
