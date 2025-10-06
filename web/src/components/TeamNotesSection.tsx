import React, { useState, useEffect } from "react";
import api from "../services/api";

interface TeamNote {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  note: string;
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
}

interface TeamNotesSectionProps {
  potentialLocationId: string;
  currentUserId: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

const TeamNotesSection: React.FC<TeamNotesSectionProps> = ({
  potentialLocationId,
  currentUserId,
  isCollapsible = true,
  defaultExpanded = false,
}) => {
  const [notes, setNotes] = useState<TeamNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (isExpanded || !isCollapsible) {
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potentialLocationId, isExpanded, isCollapsible]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(
        `/locations/potential/${potentialLocationId}/team-notes`
      );
      if (response.data.success) {
        setNotes(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching team notes:", err);
      setError("Failed to load team notes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setIsSubmitting(true);
      setError("");
      const response = await api.post(
        `/locations/potential/${potentialLocationId}/team-notes`,
        { note: newNote.trim() }
      );
      if (response.data.success) {
        setNotes([...notes, response.data.data]);
        setNewNote("");
      }
    } catch (err) {
      console.error("Error adding note:", err);
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = err.response as { data?: { message?: string } };
        setError(errorResponse.data?.message || "Failed to add note");
      } else {
        setError("Failed to add note");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editText.trim()) return;

    try {
      setError("");
      const response = await api.patch(
        `/locations/potential/${potentialLocationId}/team-notes/${noteId}`,
        { note: editText.trim() }
      );
      if (response.data.success) {
        setNotes(notes.map((n) => (n._id === noteId ? response.data.data : n)));
        setEditingNoteId(null);
        setEditText("");
      }
    } catch (err) {
      console.error("Error editing note:", err);
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = err.response as { data?: { message?: string } };
        setError(errorResponse.data?.message || "Failed to edit note");
      } else {
        setError("Failed to edit note");
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      setError("");
      const response = await api.delete(
        `/locations/potential/${potentialLocationId}/team-notes/${noteId}`
      );
      if (response.data.success) {
        setNotes(notes.filter((n) => n._id !== noteId));
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = err.response as { data?: { message?: string } };
        setError(errorResponse.data?.message || "Failed to delete note");
      } else {
        setError("Failed to delete note");
      }
    }
  };

  const startEdit = (note: TeamNote) => {
    setEditingNoteId(note._id);
    setEditText(note.note);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditText("");
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "producer":
        return "bg-purple-100 text-purple-800";
      case "director":
        return "bg-blue-100 text-blue-800";
      case "location_scout":
        return "bg-green-100 text-green-800";
      case "crew_member":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isCollapsible) {
    return (
      <div className="border-t border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          aria-expanded={isExpanded ? "true" : "false"}
          aria-controls="team-notes-content"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Team Notes
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {notes.length}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
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

        {isExpanded && (
          <div id="team-notes-content" className="px-4 pb-4">
            {renderContent()}
          </div>
        )}
      </div>
    );
  }

  return <div className="space-y-4">{renderContent()}</div>;

  function renderContent() {
    return (
      <>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Notes Thread */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <p className="text-sm">No team notes yet</p>
                  <p className="text-xs mt-1">Be the first to add a note!</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note._id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    {/* Note Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {note.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">
                              {note.userName}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                                note.userRole
                              )}`}
                            >
                              {note.userRole.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(note.timestamp)}
                              {note.edited && " (edited)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions (only for own notes) */}
                      {note.userId === currentUserId && (
                        <div className="flex items-center gap-1 ml-2">
                          {editingNoteId !== note._id && (
                            <>
                              <button
                                onClick={() => startEdit(note)}
                                className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                                title="Edit note"
                                aria-label="Edit note"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note._id)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                title="Delete note"
                                aria-label="Delete note"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Note Content */}
                    {editingNoteId === note._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          rows={3}
                          placeholder="Edit your note..."
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditNote(note._id)}
                            disabled={!editText.trim()}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {note.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={3}
                placeholder="Add a note for your team..."
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {newNote.length} / 2000 characters
                </span>
                <button
                  onClick={handleAddNote}
                  disabled={
                    !newNote.trim() || isSubmitting || newNote.length > 2000
                  }
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Adding..." : "Add Note"}
                </button>
              </div>
            </div>
          </>
        )}
      </>
    );
  }
};

export default TeamNotesSection;
