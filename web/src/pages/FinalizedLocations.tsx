import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext";
import { useLocations } from "../hooks/useLocations";
import type { Location } from "../types";

const FinalizedLocations: React.FC = () => {
  const { logout } = useAuth();
  const { currentProject } = useProject();
  const {
    finalizedLocations,
    locationNotes,
    loading,
    error,
    getFinalizedList,
    getPotentialDetail,
  } = useLocations();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh finalized locations whenever the page is visited or project changes
  useEffect(() => {
    if (currentProject?._id) {
      console.log('🔄 Fetching finalized locations for project:', currentProject._id);
      getFinalizedList(currentProject._id);
    }
  }, [getFinalizedList, currentProject?._id, refreshKey]);

  // Auto-refresh when window regains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (currentProject?._id) {
        console.log('🔄 Window focused - refreshing finalized locations');
        getFinalizedList(currentProject._id);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [getFinalizedList, currentProject?._id]);

  // Add a function to manually refresh the list
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectLocation = async (location: Location) => {
    setSelectedLocation(location);
    // Get notes for the selected location
    await getPotentialDetail(location._id);
  };

  const openMapInNewTab = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=16&t=m&markers=size:mid%7Ccolor:red%7C${lat},${lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Finalized Locations
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Approved locations ready for use
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 font-medium transition-opacity"
                style={{ backgroundColor: "#FCCA00", color: "#1F1F1F" }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <a
                href="/scout"
                className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-opacity"
                style={{ backgroundColor: "#FCCA00", color: "#1F1F1F" }}
              >
                Back to Dashboard
              </a>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-opacity"
                style={{ backgroundColor: "#1F1F1F", color: "#FCCA00" }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="w-full h-48 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : finalizedLocations.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
              Get started by finalizing some potential locations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalizedLocations.map((location) => {
              // Helper functions to handle different data structures
              const getTitle = (loc: Location): string => {
                return loc.title || loc.name || "Untitled Location";
              };

              const getDescription = (loc: Location): string => {
                return (
                  loc.description || loc.reason || "No description available"
                );
              };

              const getPrimaryImage = (loc: Location): string | null => {
                if (loc.images && loc.images.length > 0) {
                  return loc.images[0];
                }
                if (loc.photos && loc.photos.length > 0) {
                  return loc.photos[0].url;
                }
                return loc.imageUrl || null;
              };

              const title = getTitle(location);
              const description = getDescription(location);
              const primaryImage = getPrimaryImage(location);

              return (
                <div
                  key={location._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelectLocation(location)}
                >
                  <div className="p-6">
                    {/* Verified Badge */}
                    {location.verified && (
                      <div className="mb-3 flex items-center gap-1 text-sm">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-700 font-medium text-xs">
                          Verified on Google Maps
                        </span>
                      </div>
                    )}

                    {/* Image */}
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
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

                    {/* Status Badge */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Finalized
                      </span>
                      {/* Rating */}
                      {location.rating !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">
                            {location.rating}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {title}
                    </h3>

                    {/* Address (if available) */}
                    {location.address && (
                      <p className="text-xs text-gray-500 mb-2">
                        📍 {location.address}
                      </p>
                    )}

                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {description}
                    </p>

                    {/* Tags */}
                    {location.tags && location.tags.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {location.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={`tag-${location._id}-${tagIndex}`}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {location.tags.length > 3 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{location.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Permits */}
                    {location.permits && location.permits.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {location.permits.slice(0, 3).map((permit, index) => {
                            const permitName =
                              typeof permit === "string" ? permit : permit.name;
                            const isRequired =
                              typeof permit === "object"
                                ? permit.required
                                : true;

                            return (
                              <span
                                key={`permit-${location._id}-${index}`}
                                className={`inline-block text-xs px-2 py-1 rounded-full ${
                                  isRequired
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {permitName}
                                {typeof permit === "object" &&
                                  permit.required &&
                                  " *"}
                              </span>
                            );
                          })}
                          {location.permits.length > 3 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{location.permits.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMapInNewTab(
                            location.coordinates.lat,
                            location.coordinates.lng
                          );
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
                        View Map
                      </button>

                      <span className="text-xs text-gray-500">
                        Finalized{" "}
                        {location.finalizedAt
                          ? new Date(location.finalizedAt).toLocaleDateString()
                          : new Date(location.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Location Detail Modal */}
        {selectedLocation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedLocation.title}
                </h2>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Details */}
                  <div className="space-y-6">
                    {/* Image Gallery */}
                    <div>
                      {selectedLocation.images &&
                      selectedLocation.images.length > 0 ? (
                        <div>
                          <img
                            src={selectedLocation.images[0]}
                            alt={
                              selectedLocation.title || selectedLocation.name
                            }
                            className="w-full h-64 object-cover rounded-lg mb-2"
                          />
                          {selectedLocation.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {selectedLocation.images
                                .slice(1, 5)
                                .map((image, index) => (
                                  <img
                                    key={index}
                                    src={image}
                                    alt={`${
                                      selectedLocation.title ||
                                      selectedLocation.name
                                    } ${index + 2}`}
                                    className="w-full h-16 object-cover rounded"
                                  />
                                ))}
                            </div>
                          )}
                        </div>
                      ) : selectedLocation.photos &&
                        selectedLocation.photos.length > 0 ? (
                        <div>
                          <img
                            src={selectedLocation.photos[0].url}
                            alt={
                              selectedLocation.title || selectedLocation.name
                            }
                            className="w-full h-64 object-cover rounded-lg mb-2"
                          />
                          {selectedLocation.photos.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {selectedLocation.photos
                                .slice(1, 5)
                                .map((photo, index) => (
                                  <img
                                    key={index}
                                    src={photo.url}
                                    alt={`${
                                      selectedLocation.title ||
                                      selectedLocation.name
                                    } ${index + 2}`}
                                    className="w-full h-16 object-cover rounded"
                                  />
                                ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Verification Status */}
                    {selectedLocation.verified && (
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
                    {selectedLocation.rating !== undefined && (
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
                                  i < selectedLocation.rating!
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
                            {selectedLocation.rating}/10
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Description
                      </h3>
                      <p className="text-gray-700">
                        {selectedLocation.description ||
                          selectedLocation.reason ||
                          "No description available"}
                      </p>
                    </div>

                    {/* Address */}
                    {selectedLocation.address && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Address
                        </h3>
                        <p className="text-gray-700">
                          {selectedLocation.address}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedLocation.tags &&
                      selectedLocation.tags.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Tags
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedLocation.tags.map((tag, index) => (
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
                    {selectedLocation.filmingDetails && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Filming Details
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          {selectedLocation.filmingDetails.bestTimeToFilm && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Best Time to Film:
                              </span>
                              <span className="ml-2 text-gray-600">
                                {selectedLocation.filmingDetails.bestTimeToFilm}
                              </span>
                            </div>
                          )}
                          {selectedLocation.filmingDetails.accessibility && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Accessibility:
                              </span>
                              <span className="ml-2 text-gray-600">
                                {selectedLocation.filmingDetails.accessibility}
                              </span>
                            </div>
                          )}
                          {selectedLocation.filmingDetails.parking && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Parking:
                              </span>
                              <span className="ml-2 text-gray-600">
                                {selectedLocation.filmingDetails.parking}
                              </span>
                            </div>
                          )}
                          {selectedLocation.filmingDetails.powerAccess && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Power Access:
                              </span>
                              <span className="ml-2 text-gray-600">
                                {selectedLocation.filmingDetails.powerAccess}
                              </span>
                            </div>
                          )}
                          {selectedLocation.filmingDetails.crowdLevel && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Crowd Level:
                              </span>
                              <span className="ml-2 text-gray-600">
                                {selectedLocation.filmingDetails.crowdLevel}
                              </span>
                            </div>
                          )}
                          {selectedLocation.filmingDetails
                            .weatherConsiderations && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Weather Considerations:
                              </span>
                              <span className="ml-2 text-gray-600">
                                {
                                  selectedLocation.filmingDetails
                                    .weatherConsiderations
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedLocation.permits &&
                      selectedLocation.permits.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Permits
                          </h3>
                          <div className="space-y-3">
                            {selectedLocation.permits.map((permit, index) => {
                              const permitName =
                                typeof permit === "string"
                                  ? permit
                                  : permit.name;
                              const isRequired =
                                typeof permit === "object"
                                  ? permit.required
                                  : true;
                              const permitObj =
                                typeof permit === "object" ? permit : null;

                              return (
                                <div
                                  key={index}
                                  className="border rounded-lg p-4"
                                >
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
                                          <span className="font-medium">
                                            Authority:
                                          </span>{" "}
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
                                          <span className="font-medium">
                                            Notes:
                                          </span>{" "}
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

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Location
                      </h3>
                      <p className="text-gray-700 mb-3">
                        Coordinates:{" "}
                        {selectedLocation.coordinates.lat.toFixed(6)},{" "}
                        {selectedLocation.coordinates.lng.toFixed(6)}
                      </p>
                      {selectedLocation.placeId && (
                        <p className="text-gray-500 text-sm mb-3">
                          Google Place ID: {selectedLocation.placeId}
                        </p>
                      )}
                      <button
                        onClick={() =>
                          openMapInNewTab(
                            selectedLocation.coordinates.lat,
                            selectedLocation.coordinates.lng
                          )
                        }
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
                        View on Google Maps
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Notes */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Notes
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {locationNotes.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No notes available.
                        </p>
                      ) : (
                        locationNotes.map((note) => {
                          // Safety check for populated author
                          const authorName = note.author?.username || "Unknown";
                          const authorRole =
                            note.author?.role || note.role || "user";

                          return (
                            <div
                              key={note._id}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {authorName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(note.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                {note.text}
                              </p>
                              <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full mt-2">
                                {authorRole}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FinalizedLocations;
