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
  console.log('PotentialLocationsList props:', { locations, selectedLocation, loading });
  
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
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {locations.map((location) => (
            <div
              key={location.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedLocation?.id === location.id
                  ? "border-indigo-500 bg-indigo-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
              onClick={() => onSelectLocation(location)}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {location.imageUrl ? (
                    <img
                      src={location.imageUrl}
                      alt={location.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-400"
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
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {location.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {location.description}
                  </p>

                  {location.permits && location.permits.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {location.permits.slice(0, 2).map((permit, index) => {
                        // Handle both string and object permits
                        const permitText =
                          typeof permit === "string"
                            ? permit
                            : permit?.name || "Unknown";

                        return (
                          <span
                            key={`permit-${location.id}-${index}`}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                          >
                            {permitText}
                          </span>
                        );
                      })}
                      {location.permits.length > 2 && (
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          +{location.permits.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    Added {new Date(location.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {selectedLocation?.id === location.id && (
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
          ))}
        </div>
      )}
    </div>
  );
};

export default PotentialLocationsList;
