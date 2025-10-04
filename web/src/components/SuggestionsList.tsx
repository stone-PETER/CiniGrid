import React from "react";
import type { Suggestion } from "../types";

interface SuggestionsListProps {
  suggestions: Suggestion[];
  onAddToPotential: (index: number) => void;
  loading?: boolean;
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  onAddToPotential,
  loading = false,
}) => {
  const openMapInNewTab = (suggestion: Suggestion) => {
    // Use Google Maps link if available (verified locations), otherwise construct generic link
    if (suggestion.mapsLink) {
      window.open(suggestion.mapsLink, "_blank");
    } else {
      const url = `https://www.google.com/maps?q=${suggestion.coordinates.lat},${suggestion.coordinates.lng}&ll=${suggestion.coordinates.lat},${suggestion.coordinates.lng}&z=16&t=m&markers=size:mid%7Ccolor:red%7C${suggestion.coordinates.lat},${suggestion.coordinates.lng}`;
      window.open(url, "_blank");
    }
  };

  // Helper to get display title (backend may use 'name' or 'title')
  const getTitle = (suggestion: Suggestion) =>
    suggestion.title || suggestion.name || "Unknown Location";

  // Helper to get display description (backend may use 'description' or 'reason')
  const getDescription = (suggestion: Suggestion) =>
    suggestion.description || suggestion.reason || "No description available";

  // Helper to get primary image
  const getPrimaryImage = (suggestion: Suggestion) => {
    if (suggestion.photos && suggestion.photos.length > 0) {
      return suggestion.photos[0].url;
    }
    if (suggestion.images && suggestion.images.length > 0) {
      return suggestion.images[0];
    }
    return suggestion.imageUrl;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          AI Suggestions
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-5/6"></div>
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
        AI Suggestions {suggestions.length > 0 && `(${suggestions.length})`}
      </h2>

      {suggestions.length === 0 ? (
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="mt-2">
            No suggestions yet. Try searching for locations!
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const title = getTitle(suggestion);
            const description = getDescription(suggestion);
            const primaryImage = getPrimaryImage(suggestion);

            return (
              <div
                key={suggestion.id || `suggestion-${index}`}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Verified Badge */}
                {suggestion.verified && (
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
                  {/* Image Section */}
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
                    {/* Title with Rating */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {title}
                      </h3>
                      {suggestion.rating !== undefined && (
                        <div className="flex items-center gap-1 ml-2">
                          <svg
                            className="w-4 h-4 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">
                            {suggestion.rating}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Address (if available) */}
                    {suggestion.address && (
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {suggestion.address}
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {description}
                    </p>

                    {/* Tags */}
                    {suggestion.tags && suggestion.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {suggestion.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={`tag-${suggestion.id || index}-${tagIndex}`}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {suggestion.tags.length > 3 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            +{suggestion.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Estimated Cost */}
                    {suggestion.estimatedCost && (
                      <div className="mt-2 text-sm text-gray-700">
                        💰{" "}
                        <span className="font-medium">
                          {suggestion.estimatedCost}
                        </span>
                      </div>
                    )}

                    {/* Permits */}
                    {suggestion.permits && suggestion.permits.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-700">
                          Permits:{" "}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.permits
                            .slice(0, 2)
                            .map((permit, permitIndex) => {
                              const permitName =
                                typeof permit === "string"
                                  ? permit
                                  : permit.name;
                              const isRequired =
                                typeof permit === "object"
                                  ? permit.required
                                  : true;

                              return (
                                <span
                                  key={`permit-${
                                    suggestion.id || index
                                  }-${permitIndex}`}
                                  className={`inline-block text-xs px-2 py-1 rounded-full ${
                                    isRequired
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                  title={
                                    typeof permit === "object" && permit.notes
                                      ? permit.notes
                                      : undefined
                                  }
                                >
                                  {permitName}
                                  {typeof permit === "object" &&
                                    permit.required &&
                                    " *"}
                                </span>
                              );
                            })}
                          {suggestion.permits.length > 2 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{suggestion.permits.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => openMapInNewTab(suggestion)}
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
                        View on Map
                      </button>

                      <button
                        onClick={() => onAddToPotential(index)}
                        className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                      >
                        Add to Potential
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Photos Gallery */}
                {suggestion.photos && suggestion.photos.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {suggestion.photos.slice(1).map((photo, photoIndex) => (
                      <img
                        key={`photo-${suggestion.id || index}-${photoIndex}`}
                        src={photo.url}
                        alt={`${title} - photo ${photoIndex + 2}`}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuggestionsList;
