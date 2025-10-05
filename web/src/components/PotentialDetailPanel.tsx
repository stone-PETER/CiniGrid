import React, { useState } from "react";
import type { Location, Note, Approval, User } from "../types";

interface PotentialDetailPanelProps {
  location: Location;
  notes: Note[];
  approvals: Approval[];
  currentUser: User | null;
  onAddNote: (content: string) => void;
  onAddApproval: (status: "approved" | "rejected", notes?: string) => void;
  onFinalize: () => void;
  loading?: boolean;
}

const PotentialDetailPanel: React.FC<PotentialDetailPanelProps> = ({
  location,
  notes,
  approvals,
  currentUser,
  onAddNote,
  onAddApproval,
  onFinalize,
  loading = false,
}) => {
  const [newNote, setNewNote] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  // Filter notes and approvals for this specific location
  const locationNotes = notes.filter(
    (note) =>
      note.locationId === location._id ||
      // For notes without locationId, show all (backward compatibility)
      !note.locationId
  );

  const locationApprovals = approvals.filter(
    (approval) =>
      approval.locationId === location._id ||
      // For approvals without locationId, show all (backward compatibility)
      !approval.locationId
  );

  const openMapInNewTab = () => {
    if (!location.coordinates) {
      console.error("Location coordinates are not available");
      return;
    }
    const url = `https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}&ll=${location.coordinates.lat},${location.coordinates.lng}&z=16&t=m&markers=size:mid%7Ccolor:red%7C${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, "_blank");
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote("");
    }
  };

  const handleApproval = (status: "approved" | "rejected") => {
    onAddApproval(status, approvalNotes.trim() || undefined);
    setApprovalNotes("");
  };

  const handleFinalize = () => {
    onFinalize();
    setShowFinalizeConfirm(false);
  };

  const currentUserApproval = locationApprovals.find(
    (approval) => approval.role === currentUser?.role
  );
  // Allow managers, producers, and directors to finalize locations
  const canManage =
    currentUser?.role === "producer" ||
    currentUser?.role === "director" ||
    currentUser?.role === "manager";
  const hasRequiredApprovals = locationApprovals.some(
    (approval) => approval.status === "approved"
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {location.title}
          </h2>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Potential
            </span>
            {canManage ? (
              hasRequiredApprovals ? (
                <button
                  onClick={() => setShowFinalizeConfirm(true)}
                  className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium transition-opacity"
                  style={{ backgroundColor: "#1F1F1F", color: "#FCCA00" }}
                >
                  ✓ Finalize Location
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    disabled
                    className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                    title="At least one approval required to finalize"
                  >
                    Finalize Location
                  </button>
                  <span className="text-xs text-gray-500">
                    (Needs approval)
                  </span>
                </div>
              )
            ) : (
              <span className="text-xs text-gray-500 px-2">
                Only managers+ can finalize
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Location Details */}
          <div className="space-y-6">
            {/* Verification Status */}
            {location.verified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Verified on Google Maps
                  </span>
                </div>
              </div>
            )}

            {/* Rating */}
            {location.rating !== undefined && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Rating
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(10)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < location.rating!
                            ? "text-yellow-500"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {location.rating}/10
                  </span>
                </div>
              </div>
            )}

            {/* Image Gallery */}
            <div>
              {location.images && location.images.length > 0 ? (
                <div>
                  <img
                    src={location.images[0]}
                    alt={location.title || location.name}
                    className="w-full h-64 object-cover rounded-lg mb-2"
                  />
                  {location.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {location.images.slice(1, 5).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${location.title || location.name} ${
                            index + 2
                          }`}
                          className="w-full h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : location.photos && location.photos.length > 0 ? (
                <div>
                  <img
                    src={location.photos[0].url}
                    alt={location.title || location.name}
                    className="w-full h-64 object-cover rounded-lg mb-2"
                  />
                  {location.photos.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {location.photos.slice(1, 5).map((photo, index) => (
                        <img
                          key={index}
                          src={photo.url}
                          alt={`${location.title || location.name} ${
                            index + 2
                          }`}
                          className="w-full h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-700">
                {location.description ||
                  location.reason ||
                  "No description available"}
              </p>
            </div>

            {/* Address */}
            {location.address && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Address
                </h3>
                <p className="text-gray-700">{location.address}</p>
              </div>
            )}

            {/* Tags */}
            {location.tags && location.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {location.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filming Details */}
            {location.filmingDetails &&
              Object.keys(location.filmingDetails).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Filming Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {location.filmingDetails.bestTimeToFilm && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Best Time to Film:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {location.filmingDetails.bestTimeToFilm}
                        </span>
                      </div>
                    )}
                    {location.filmingDetails.accessibility && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Accessibility:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {location.filmingDetails.accessibility}
                        </span>
                      </div>
                    )}
                    {location.filmingDetails.parking && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Parking:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {location.filmingDetails.parking}
                        </span>
                      </div>
                    )}
                    {location.filmingDetails.powerAccess && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Power Access:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {location.filmingDetails.powerAccess}
                        </span>
                      </div>
                    )}
                    {location.filmingDetails.crowdLevel && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Crowd Level:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {location.filmingDetails.crowdLevel}
                        </span>
                      </div>
                    )}
                    {location.filmingDetails.weatherConsiderations && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Weather Considerations:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {location.filmingDetails.weatherConsiderations}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Enhanced Permits */}
            {location.permits && location.permits.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Permits
                </h3>
                <div className="space-y-3">
                  {location.permits.map((permit, index) => {
                    const permitName =
                      typeof permit === "string" ? permit : permit.name;
                    const isRequired =
                      typeof permit === "object" ? permit.required : true;
                    const permitObj =
                      typeof permit === "object" ? permit : null;

                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {permitName}
                          </span>
                          <span
                            className={`inline-block text-xs px-2 py-1 rounded-full ${
                              isRequired
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {isRequired ? "Required" : "Optional"}
                          </span>
                        </div>
                        {permitObj && (
                          <div className="space-y-1 text-sm text-gray-600">
                            {permitObj.authority && (
                              <div>
                                <span className="font-medium">Authority:</span>{" "}
                                {permitObj.authority}
                              </div>
                            )}
                            {permitObj.estimatedCost && (
                              <div>
                                <span className="font-medium">
                                  Estimated Cost:
                                </span>{" "}
                                {permitObj.estimatedCost}
                              </div>
                            )}
                            {permitObj.processingTime && (
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {permitObj.processingTime}
                              </div>
                            )}
                            {permitObj.notes && (
                              <div>
                                <span className="font-medium">Notes:</span>{" "}
                                {permitObj.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location & Map */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Location
              </h3>
              {location.coordinates ? (
                <>
                  <p className="text-gray-700 mb-3">
                    Coordinates: {location.coordinates.lat.toFixed(6)},{" "}
                    {location.coordinates.lng.toFixed(6)}
                  </p>
                  {location.placeId && (
                    <p className="text-gray-500 text-sm mb-3">
                      Google Place ID: {location.placeId}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={openMapInNewTab}
                      className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm flex items-center gap-2 font-medium transition-opacity"
                      style={{ backgroundColor: "#FCCA00", color: "#1F1F1F" }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      View on Map
                    </button>
                    {location.mapsLink && (
                      <a
                        href={location.mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm flex items-center gap-2 font-medium transition-opacity"
                        style={{ backgroundColor: "#1F1F1F", color: "#FCCA00" }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Google Maps
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 mb-3">
                  Location coordinates not available
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Notes & Approvals */}
          <div className="space-y-6">
            {/* Notes Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this location..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={!newNote.trim() || loading}
                  className="mt-2 px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 text-sm font-medium transition-opacity"
                  style={{ backgroundColor: "#1F1F1F", color: "#FCCA00" }}
                >
                  Add Note
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {locationNotes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No notes yet.</p>
                ) : (
                  locationNotes.map((note) => {
                    // Safety check for populated author
                    const authorName = note.author?.username || "Unknown";
                    const authorRole = note.author?.role || note.role || "user";

                    return (
                      <div key={note._id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {authorName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{note.text}</p>
                        <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full mt-2">
                          {authorRole}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Finalize Button */}
            <div className="mt-6">
              <button
                onClick={() => setShowFinalizeConfirm(true)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 font-medium transition-opacity"
                style={{
                  backgroundColor: "#1F1F1F",
                  color: "#FCCA00",
                }}
              >
                Finalize Location
              </button>
            </div>

            {/* Approvals Section */}
            {canManage && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Approvals
                </h3>

                {/* Current User Approval */}
                <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Your Approval
                  </h4>
                  {currentUserApproval ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          currentUserApproval.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {currentUserApproval.status}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(
                          currentUserApproval.timestamp
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Optional notes for your approval..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproval("approved")}
                          disabled={loading}
                          className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 text-sm font-medium transition-opacity"
                          style={{
                            backgroundColor: "#FCCA00",
                            color: "#1F1F1F",
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval("rejected")}
                          disabled={loading}
                          className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 text-sm font-medium transition-opacity"
                          style={{
                            backgroundColor: "#1F1F1F",
                            color: "#FCCA00",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* All Approvals List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    All Approvals
                  </h4>
                  {locationApprovals.length === 0 ? (
                    <p className="text-gray-500 text-sm">No approvals yet.</p>
                  ) : (
                    locationApprovals.map((approval) => (
                      <div
                        key={approval.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {approval.role}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              approval.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {approval.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(approval.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Finalize Confirmation Modal */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Finalize Location
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to finalize "{location.title}"? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowFinalizeConfirm(false)}
                className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-opacity"
                style={{ backgroundColor: "#FCCA00", color: "#1F1F1F" }}
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={loading}
                className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 font-medium transition-opacity"
                style={{ backgroundColor: "#1F1F1F", color: "#FCCA00" }}
              >
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PotentialDetailPanel;
