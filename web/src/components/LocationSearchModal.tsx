import React, { useState, useEffect } from "react";
import api from "../services/api";

interface LocationRecord {
  _id: string;
  name: string;
  description: string;
}

interface SearchResult {
  title: string;
  description: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  photos?: Array<{
    url: string;
    width: number;
    height: number;
    photoReference: string;
  }>;
  rating?: number;
  priceLevel?: number;
}

interface LocationSearchModalProps {
  isOpen: boolean;
  locationRecord: LocationRecord | null;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  locationRecord,
  projectId,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());

  // Pre-fill search query when modal opens with location record
  useEffect(() => {
    if (isOpen && locationRecord) {
      // Combine name and description for better search
      const query = `${locationRecord.name}: ${locationRecord.description}`;
      setSearchQuery(query);
    }
  }, [isOpen, locationRecord]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchResults([]);
      setError("");
      setAddingIds(new Set());
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.post("/ai/search", {
        prompt: searchQuery,
        projectId,
      });

      if (response.data.success) {
        // Backend returns { success: true, data: { suggestions: [...], count: X } }
        // or { success: true, data: [...] } depending on the endpoint
        const results = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data?.suggestions || [];

        setSearchResults(results);

        if (results.length === 0) {
          setError("No results found. Try a different search query.");
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = err.response as { data?: { message?: string } };
        setError(errorResponse.data?.message || "Search failed");
      } else {
        setError("Failed to search locations");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPotential = async (result: SearchResult, index: number) => {
    if (!locationRecord) return;

    try {
      setAddingIds((prev) => new Set(prev).add(index));
      setError("");

      // Create potential location linked to location record
      // Backend expects suggestionData with all fields
      const response = await api.post("/locations/potential", {
        projectId,
        suggestionData: {
          title: result.title,
          name: result.title,
          address: result.address,
          description: result.description,
          reason: result.description,
          coordinates: result.coordinates,
          photos: result.photos || [],
          rating: result.rating,
          priceLevel: result.priceLevel,
        },
        locationRecordId: locationRecord._id,
      });

      if (response.data.success) {
        // Call onSuccess immediately to refresh parent components
        onSuccess();

        // Remove from results after successful addition
        setSearchResults((prev) => prev.filter((_, i) => i !== index));

        // If no more results, show success message and close
        if (searchResults.length === 1) {
          setTimeout(() => {
            onClose();
          }, 500);
        }
      }
    } catch (err) {
      console.error("Add to potential error:", err);
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = err.response as { data?: { message?: string } };
        setError(errorResponse.data?.message || "Failed to add location");
      } else {
        setError("Failed to add location to potentials");
      }
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Search Locations
            </h2>
            {locationRecord && (
              <p className="text-sm text-gray-600 mt-1">
                For: <span className="font-medium">{locationRecord.name}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close modal"
            aria-label="Close modal"
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

        {/* Search Box */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter location description or modify pre-filled text..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {searchResults.length === 0 && !loading && !error && (
            <div className="text-center py-12">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Search
              </h3>
              <p className="text-sm text-gray-500">
                Click "Search" to find locations using AI
              </p>
            </div>
          )}

          <div className="space-y-4">
            {searchResults.map((result, index) => {
              const hasPhotos = result.photos && result.photos.length > 0;

              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {result.title}
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
                        {result.address}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddToPotential(result, index)}
                      disabled={addingIds.has(index)}
                      className="ml-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addingIds.has(index) ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Adding...</span>
                        </div>
                      ) : (
                        "+ Add to Potentials"
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {result.description}
                  </p>

                  {/* Images Section - Always visible */}
                  {hasPhotos && (
                    <div className="mb-3">
                      <div className="grid grid-cols-2 gap-2">
                        {result.photos?.slice(0, 4).map((photo, photoIndex) => (
                          <div
                            key={photoIndex}
                            className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(photo.url, "_blank")}
                          >
                            <img
                              src={photo.url}
                              alt={`${result.title} - Photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {result.rating && (
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-yellow-400 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{result.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {result.priceLevel && (
                      <div className="flex items-center">
                        <span className="font-medium">
                          {"$".repeat(result.priceLevel)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {searchResults.length > 0 ? (
              <>
                Showing {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </>
            ) : (
              "No results to display"
            )}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationSearchModal;
