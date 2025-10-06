import React, { useState, useEffect } from "react";
import api from "../services/api";
import TeamNotesSection from "./TeamNotesSection";

interface PotentialLocation {
  _id: string;
  projectId: string;
  locationRecordId: string;
  name: string;
  address: string;
  description: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  images?: string[]; // Array of full image URLs
  photos?: Array<{
    photoReference: string;
    width: number;
    height: number;
  }>;
  mapsLink?: string;
  rating?: number;
  priceLevel?: number;
  teamNotes?: Array<{
    _id: string;
    userId: string;
    userName: string;
    userRole: string;
    note: string;
    timestamp: string;
  }>;
  createdAt: string;
}

interface PotentialLocationsPanelProps {
  projectId: string;
  selectedRecordId: string | null;
  currentUserId: string;
  onFinalize: (potentialId: string) => void;
  onRefresh: () => void;
}

const PotentialLocationsPanel: React.FC<PotentialLocationsPanelProps> = ({
  projectId,
  selectedRecordId,
  currentUserId,
  onFinalize,
  onRefresh,
}) => {
  const [potentials, setPotentials] = useState<PotentialLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Function to generate Google Maps link
  const getGoogleMapsLink = (location: PotentialLocation) => {
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
    if (selectedRecordId) {
      fetchPotentials();
    } else {
      setPotentials([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecordId, projectId]);

  const fetchPotentials = async () => {
    if (!selectedRecordId) return;

    try {
      setLoading(true);
      setError("");
      const response = await api.get(
        `/location-records/${selectedRecordId}/potentials`
      );
      if (response.data.success) {
        setPotentials(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching potentials:", err);
      setError("Failed to load potential locations");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (potentialId: string) => {
    if (!confirm("Are you sure you want to remove this potential location?")) {
      return;
    }

    try {
      setRemovingId(potentialId);
      setError("");
      const response = await api.delete(`/locations/potential/${potentialId}`);
      if (response.data.success) {
        setPotentials((prev) => prev.filter((p) => p._id !== potentialId));
        onRefresh();
      }
    } catch (err) {
      console.error("Error removing potential:", err);
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = err.response as { data?: { message?: string } };
        setError(errorResponse.data?.message || "Failed to remove location");
      } else {
        setError("Failed to remove potential location");
      }
    } finally {
      setRemovingId(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">
            Loading potential locations...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedRecordId) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a Location Record
          </h3>
          <p className="text-sm text-gray-500">
            Choose a location record from the left panel to view its potential
            locations
          </p>
        </div>
      </div>
    );
  }

  if (potentials.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No potential locations yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Use the "Search" button to find locations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Potentials List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {potentials.map((potential) => (
          <div
            key={potential._id}
            className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {potential.name}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1 text-gray-400"
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
                    </svg>
                    {potential.address}
                  </p>
                </div>
                <button
                  onClick={() => toggleExpanded(potential._id)}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={
                    expandedId === potential._id ? "Collapse" : "Expand"
                  }
                >
                  <svg
                    className={`w-6 h-6 transition-transform ${
                      expandedId === potential._id ? "rotate-180" : ""
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

              {/* Description */}
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                {potential.description}
              </p>

              {/* Google Maps Link */}
              {potential.coordinates && (
                <a
                  href={getGoogleMapsLink(potential)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-3"
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
              {potential.images && potential.images.length > 0 && (
                <div className="mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {potential.images.slice(0, 4).map((imageUrl, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(imageUrl, "_blank")}
                      >
                        <img
                          src={imageUrl}
                          alt={`${potential.name} photo ${idx + 1}`}
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
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                {potential.rating && (
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-yellow-400 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{potential.rating.toFixed(1)}</span>
                  </div>
                )}
                {potential.priceLevel && (
                  <div className="flex items-center">
                    <span className="font-medium">
                      {"$".repeat(potential.priceLevel)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onFinalize(potential._id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  ✓ Finalize
                </button>
                <button
                  onClick={() => handleRemove(potential._id)}
                  disabled={removingId === potential._id}
                  className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {removingId === potential._id ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>

            {/* Expandable Team Notes Section */}
            {expandedId === potential._id && (
              <TeamNotesSection
                potentialLocationId={potential._id}
                currentUserId={currentUserId}
                isCollapsible={false}
                defaultExpanded={true}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PotentialLocationsPanel;
