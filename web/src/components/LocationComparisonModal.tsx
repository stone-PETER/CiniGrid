import React, { useState, useEffect } from "react";
import api from "../services/api";

interface LocationRecord {
  _id: string;
  projectId: string;
  name: string;
  description: string;
  userNotes?: string;
}

interface ComparisonScore {
  overall: number;
  matchScore: number;
  reasoning: string;
}

interface PotentialLocation {
  _id: string;
  projectId: string;
  locationRecordId: string;
  name: string;
  address: string;
  description: string;
  coordinates?: { lat: number; lng: number };
  photos?: string[];
  rating?: number;
  priceLevel?: number;
  comparisonScore?: ComparisonScore;
}

interface ComparisonResult {
  locations: PotentialLocation[];
  bestMatch: PotentialLocation | null;
  summary: string;
}

interface LocationComparisonModalProps {
  isOpen: boolean;
  locationRecord: LocationRecord | null;
  projectId: string;
  onClose: () => void;
}

const LocationComparisonModal: React.FC<LocationComparisonModalProps> = ({
  isOpen,
  locationRecord,
  projectId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setError("");
      setExpandedId(null);
    }
  }, [isOpen]);

  // Run comparison when modal opens
  useEffect(() => {
    if (isOpen && locationRecord) {
      runComparison();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, locationRecord]);

  const runComparison = async () => {
    if (!locationRecord) return;

    try {
      setLoading(true);
      setError("");

      // Call backend comparison endpoint
      const response = await api.post(
        `/location-records/${locationRecord._id}/compare`,
        { projectId }
      );

      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.error || "Comparison failed");
      }
    } catch (err: unknown) {
      console.error("Comparison error:", err);
      if (err && typeof err === "object" && "response" in err) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || "Failed to compare locations");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to compare locations");
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getMedal = (index: number): string => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  const getRatingStars = (rating?: number): string => {
    if (!rating) return "No rating";
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      "⭐".repeat(fullStars) +
      (hasHalfStar ? "½" : "") +
      ` ${rating.toFixed(1)}`
    );
  };

  const getPriceLevel = (priceLevel?: number): string => {
    if (!priceLevel) return "Price not available";
    return "$".repeat(priceLevel);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              🏆 Location Comparison Results
            </h2>
            {locationRecord && (
              <p className="text-sm text-gray-600 mt-1">
                Comparing potentials for: <strong>{locationRecord.name}</strong>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Analyzing locations with AI...</p>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few moments
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <span className="text-red-600 text-xl mr-3">⚠️</span>
                <div className="flex-1">
                  <h3 className="text-red-900 font-medium">
                    Comparison Failed
                  </h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-6">
              {/* AI Summary */}
              {result.summary && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                    <span className="mr-2">🤖</span>
                    AI Analysis Summary
                  </h3>
                  <p className="text-purple-800 whitespace-pre-line">
                    {result.summary}
                  </p>
                </div>
              )}

              {/* No Locations */}
              {result.locations.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📍</div>
                  <p className="text-gray-600 font-medium mb-2">
                    No potential locations to compare
                  </p>
                  <p className="text-sm text-gray-500">
                    Search for locations and add them to potentials first.
                  </p>
                </div>
              )}

              {/* Ranked Locations */}
              {result.locations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ranked Results ({result.locations.length} locations)
                    </h3>
                    <div className="text-sm text-gray-600">
                      Sorted by match score
                    </div>
                  </div>

                  {result.locations.map((location, index) => {
                    const isBestMatch = result.bestMatch?._id === location._id;
                    const isExpanded = expandedId === location._id;
                    const score = location.comparisonScore?.overall || 0;

                    return (
                      <div
                        key={location._id}
                        className={`border rounded-lg overflow-hidden transition-all ${
                          isBestMatch
                            ? "border-green-400 bg-green-50 shadow-md"
                            : "border-gray-200 hover:shadow-md"
                        }`}
                      >
                        {/* Card Header */}
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            {/* Left: Rank and Location Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {/* Rank */}
                                <span className="text-2xl">
                                  {getMedal(index)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  #{index + 1}
                                </span>

                                {/* Best Match Badge */}
                                {isBestMatch && (
                                  <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                    ✓ BEST MATCH
                                  </span>
                                )}
                              </div>

                              {/* Location Name */}
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {location.name}
                              </h4>

                              {/* Address */}
                              {location.address && (
                                <p className="text-sm text-gray-600 mb-2 flex items-center">
                                  <span className="mr-1">📍</span>
                                  {location.address}
                                </p>
                              )}

                              {/* Description */}
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {location.description}
                              </p>

                              {/* Metadata */}
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                {location.rating !== undefined && (
                                  <span>{getRatingStars(location.rating)}</span>
                                )}
                                {location.priceLevel !== undefined && (
                                  <span>
                                    {getPriceLevel(location.priceLevel)}
                                  </span>
                                )}
                                {location.photos &&
                                  location.photos.length > 0 && (
                                    <span>
                                      📷 {location.photos.length} photos
                                    </span>
                                  )}
                              </div>
                            </div>

                            {/* Right: Score and Actions */}
                            <div className="flex flex-col items-end gap-2 ml-4">
                              {/* Score */}
                              <div
                                className={`px-4 py-2 rounded-lg font-semibold text-lg ${getScoreColor(
                                  score
                                )}`}
                              >
                                {score.toFixed(1)}
                              </div>

                              {/* Expand Button */}
                              <button
                                onClick={() =>
                                  setExpandedId(
                                    isExpanded ? null : location._id
                                  )
                                }
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                              >
                                {isExpanded ? "Hide" : "Show"} Details
                                <svg
                                  className={`w-4 h-4 ml-1 transform transition-transform ${
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
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && location.comparisonScore && (
                          <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <h5 className="font-semibold text-gray-900 mb-3">
                              Why this match?
                            </h5>

                            {/* Reasoning */}
                            <div className="bg-white rounded border border-gray-200 p-4 mb-4">
                              <p className="text-sm text-gray-700 whitespace-pre-line">
                                {location.comparisonScore.reasoning ||
                                  "No detailed reasoning available."}
                              </p>
                            </div>

                            {/* Detailed Scores */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white rounded border border-gray-200 p-3">
                                <div className="text-xs text-gray-600 uppercase mb-1">
                                  Overall Score
                                </div>
                                <div className="text-2xl font-semibold text-gray-900">
                                  {location.comparisonScore.overall.toFixed(1)}
                                </div>
                              </div>
                              <div className="bg-white rounded border border-gray-200 p-3">
                                <div className="text-xs text-gray-600 uppercase mb-1">
                                  Match Quality
                                </div>
                                <div className="text-2xl font-semibold text-gray-900">
                                  {location.comparisonScore.matchScore.toFixed(
                                    1
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {result && result.locations.length > 0 && (
              <span>
                Analyzed {result.locations.length} location
                {result.locations.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {result && result.locations.length > 0 && (
              <button
                onClick={runComparison}
                disabled={loading}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
              >
                🔄 Re-run Comparison
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationComparisonModal;
