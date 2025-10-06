import React, { useState, useEffect } from "react";
import api from "../services/api";

interface TeamNote {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  note: string;
  timestamp: string;
  edited: boolean;
}

interface LocationRecord {
  _id: string;
  name: string;
  description: string;
}

interface FinalizedLocation {
  _id: string;
  projectId: string;
  locationRecordId?: LocationRecord;
  name: string;
  title?: string;
  address: string;
  description: string;
  coordinates?: { lat: number; lng: number };
  images?: string[]; // Array of full image URLs
  photos?: Array<{
    photoReference: string;
    width: number;
    height: number;
  }>;
  mapsLink?: string;
  rating?: number;
  priceLevel?: number;
  teamNotes?: TeamNote[];
  finalizedAt: string;
  finalizedBy: {
    _id: string;
    username?: string;
    name?: string;
  };
}

interface FinalizedLocationsPanelProps {
  projectId: string;
  onRefresh: () => void;
}

const FinalizedLocationsPanel: React.FC<FinalizedLocationsPanelProps> = ({
  projectId,
  onRefresh,
}) => {
  const [locations, setLocations] = useState<FinalizedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unfinalizingId, setUnfinalizingId] = useState<string | null>(null);

  // Function to generate Google Maps link
  const getGoogleMapsLink = (location: FinalizedLocation) => {
    if (location.mapsLink) {
      return location.mapsLink;
    }
    if (location.coordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`;
    }
    // Fallback to search by name and address
    const query = encodeURIComponent(`${location.name}, ${location.address}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  useEffect(() => {
    if (projectId) {
      fetchFinalizedLocations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchFinalizedLocations = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/locations/finalized", {
        params: { projectId },
      });

      if (response.data.success) {
        setLocations(response.data.data.locations || []);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch finalized locations:", err);
      if (err && typeof err === "object" && "response" in err) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || "Failed to load locations");
      } else {
        setError("Failed to load locations");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnfinalize = async (locationId: string) => {
    if (
      !confirm(
        "Move this location back to potentials? Team notes will be preserved."
      )
    ) {
      return;
    }

    try {
      setUnfinalizingId(locationId);
      const response = await api.post(
        `/locations/finalized/${locationId}/unfinalize`
      );

      if (response.data.success) {
        // Remove from local state
        setLocations((prev) => prev.filter((loc) => loc._id !== locationId));
        // Trigger parent refresh
        onRefresh();
        // Show success message
        alert("Location moved back to potentials successfully!");
      }
    } catch (err: unknown) {
      console.error("Failed to un-finalize:", err);
      if (err && typeof err === "object" && "response" in err) {
        const error = err as { response?: { data?: { error?: string } } };
        alert(error.response?.data?.error || "Failed to un-finalize location");
      } else {
        alert("Failed to un-finalize location");
      }
    } finally {
      setUnfinalizingId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
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

  const getRatingStars = (rating?: number): string => {
    if (!rating) return "";
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      "⭐".repeat(fullStars) +
      (hasHalfStar ? "½" : "") +
      ` ${rating.toFixed(1)}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading finalized locations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-start">
          <span className="text-red-600 text-xl mr-3">⚠️</span>
          <div className="flex-1">
            <h3 className="text-red-900 font-medium">
              Error Loading Locations
            </h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No finalized locations
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Finalize potential locations to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {locations.map((location) => {
        const isExpanded = expandedId === location._id;
        const locationName = location.title || location.name;

        return (
          <div
            key={location._id}
            className="border border-green-300 rounded-lg bg-green-50 overflow-hidden"
          >
            {/* Card Header */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {locationName}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                      ✓ Finalized
                    </span>
                  </div>

                  {/* Location Record Link */}
                  {location.locationRecordId && (
                    <div className="text-xs text-gray-600 mb-2 flex items-center">
                      <span className="mr-1">📋</span>
                      Fulfills:{" "}
                      <span className="font-medium ml-1">
                        {typeof location.locationRecordId === "object"
                          ? location.locationRecordId.name
                          : "Location Record"}
                      </span>
                    </div>
                  )}

                  {/* Address */}
                  {location.address && (
                    <p className="text-xs text-gray-600 flex items-center">
                      <span className="mr-1">📍</span>
                      {location.address}
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                    {location.description}
                  </p>

                  {/* Google Maps Link */}
                  {location.coordinates && (
                    <a
                      href={getGoogleMapsLink(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                      Open in Google Maps
                    </a>
                  )}

                  {/* Photos Section - Always visible */}
                  {location.images && location.images.length > 0 && (
                    <div className="mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        {location.images.slice(0, 4).map((imageUrl, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(imageUrl, "_blank")}
                          >
                            <img
                              src={imageUrl}
                              alt={`${location.name} photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    {location.rating !== undefined && (
                      <span>{getRatingStars(location.rating)}</span>
                    )}
                    {location.teamNotes && location.teamNotes.length > 0 && (
                      <span>💬 {location.teamNotes.length} team notes</span>
                    )}
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : location._id)
                  }
                  className="ml-4 text-gray-400 hover:text-gray-600"
                  aria-label={
                    isExpanded ? "Collapse details" : "Expand details"
                  }
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${
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
              </div>

              {/* Finalized Info */}
              <div className="text-xs text-gray-500 mt-2">
                Finalized {formatDate(location.finalizedAt)} by{" "}
                {location.finalizedBy?.username ||
                  location.finalizedBy?.name ||
                  "Unknown"}
              </div>

              {/* Un-finalize Button */}
              <div className="mt-3">
                <button
                  onClick={() => handleUnfinalize(location._id)}
                  disabled={unfinalizingId === location._id}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {unfinalizingId === location._id
                    ? "Moving..."
                    : "↩️ Move back to Potentials"}
                </button>
              </div>
            </div>

            {/* Expanded Section - Team Notes */}
            {isExpanded && (
              <div className="border-t border-green-200 bg-white p-4">
                <h5 className="font-semibold text-gray-900 mb-3">
                  Team Notes (Read-Only)
                </h5>

                {location.teamNotes && location.teamNotes.length > 0 ? (
                  <div className="space-y-3">
                    {location.teamNotes.map((note) => (
                      <div
                        key={note._id}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                              {note.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {note.userName}
                              </div>
                              {note.userRole && (
                                <div className="text-xs text-gray-500">
                                  {note.userRole}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(note.timestamp)}
                            {note.edited && " (edited)"}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {note.note}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No team notes were added before finalization.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FinalizedLocationsPanel;
