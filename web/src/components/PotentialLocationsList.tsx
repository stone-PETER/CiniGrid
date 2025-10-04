import React from "react";
import type { Location } from "../types";

interface PotentialLocationsListProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
  loading?: boolean;
}

const PotentialLocationsList: React.FC<PotentialLocationsListProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  loading = false,
}) => {
  console.log("PotentialLocationsList props:", {
    locations: locations.map(l => ({ _id: l._id, title: l.title, description: l.description, coordinates: l.coordinates })),
    selectedLocation,
    loading,
  });

  // Helper functions similar to SuggestionsList
  const getTitle = (location: Location): string => {
    return location.title || location.name || 'Untitled Location';
  };

  const getDescription = (location: Location): string => {
    return location.description || location.reason || 'No description available';
  };

  const getPrimaryImage = (location: Location): string | null => {
    if (location.images && location.images.length > 0) {
      return location.images[0];
    }
    if (location.photos && location.photos.length > 0) {
      return location.photos[0].url;
    }
    return location.imageUrl || null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Potential Locations
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-3">
                <div className="w-16 h-16 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Potential Locations {locations.length > 0 && `(${locations.length})`}
      </h2>

      {locations.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="mt-2">No potential locations yet.</p>
          <p className="text-sm">Add suggestions to build your list!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {locations.map((location) => {
            const title = getTitle(location);
            const description = getDescription(location);
            const primaryImage = getPrimaryImage(location);

            return (
              <div
                key={location._id || location.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedLocation?._id === location._id
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => onSelectLocation(location)}
              >
                {/* Verified Badge */}
                {location.verified && (
                  <div className="mb-2 flex items-center gap-1 text-sm">
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
                    <span className="text-green-700 font-medium">
                      Verified on Google Maps
                    </span>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {title}
                      </h3>
                      {location.rating !== undefined && (
                        <div className="flex items-center gap-1 ml-2">
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

                    {location.address && (
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {location.address}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {description}
                    </p>

                    {location.coordinates && (
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                      </p>
                    )}

                    {location.tags && location.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {location.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={`tag-${location._id || location.id}-${tagIndex}`}
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
                    )}

                    {location.permits && location.permits.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-700">
                          Permits:{" "}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {location.permits.slice(0, 2).map((permit, permitIndex) => {
                            const permitName = typeof permit === "string" ? permit : permit.name;
                            const isRequired = typeof permit === "object" ? permit.required : true;

                            return (
                              <span
                                key={`permit-${location._id || location.id}-${permitIndex}`}
                                className={`inline-block text-xs px-2 py-1 rounded-full ${
                                  isRequired
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {permitName}
                                {typeof permit === "object" && permit.required && " *"}
                              </span>
                            );
                          })}
                          {location.permits.length > 2 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{location.permits.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Added {location.createdAt ? new Date(location.createdAt).toLocaleDateString() : 'Unknown Date'}
                    </div>
                  </div>

                  {selectedLocation?._id === location._id && (
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PotentialLocationsList;