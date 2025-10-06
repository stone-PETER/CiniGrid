import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../services/api";
import CreateRequirementModal from "./CreateRequirementModal";

interface LocationRequirement {
  _id: string;
  projectId: string;
  prompt: string;
  notes: string;
  priority: "Low" | "Medium" | "High";
  budget?: {
    max?: number;
    currency?: string;
    notes?: string;
  };
  status: "Active" | "Completed" | "Cancelled";
  potentialLocationsCount: number;
  createdAt: string;
}

interface EnrichedLocation {
  _id: string;
  title: string;
  name?: string;
  description: string;
  address?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  budget?: {
    dailyRate?: number;
    estimatedMin?: number;
    estimatedMax?: number;
    confidence?: string;
    reasoning?: string;
    currency?: string;
  };
  amenities?: {
    parking?: boolean;
    wifi?: boolean;
    power?: boolean;
    kitchen?: boolean;
    greenRoom?: boolean;
    bathroom?: boolean;
    loadingDock?: boolean;
    cateringSpace?: boolean;
  };
  cachedData?: {
    nearbyHotels?: Array<{
      name: string;
      distance: number;
      priceRange: string;
      rating: number;
    }>;
    nearbyRestaurants?: Array<{
      name: string;
      distance: number;
      rating: number;
    }>;
    transportation?: {
      nearestMetro?: { name: string; distance: number };
      nearestBusStop?: { name: string; distance: number };
      parkingFacilities?: Array<{ name: string; distance: number }>;
    };
    weather?: {
      current?: {
        temp: number;
        condition: string;
      };
      bestMonths?: string[];
    };
    distanceToFinalizedLocations?: Array<{
      locationName: string;
      distance: number;
    }>;
  };
  comparisonScore: {
    overall: number;
    budget: number;
    similarity: number;
    crewAccess: number;
    transportation: number;
  };
}

interface WeightConfig {
  budget: number;
  similarity: number;
  crewAccess: number;
  transportation: number;
}

interface ComparisonData {
  locations: EnrichedLocation[];
  recommendation: string;
  requirement: LocationRequirement;
  weights: WeightConfig;
}

const LocationComparisonTab: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();

  const [requirements, setRequirements] = useState<LocationRequirement[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null
  );
  const [weights, setWeights] = useState<WeightConfig>({
    budget: 30,
    similarity: 35,
    crewAccess: 20,
    transportation: 15,
  });
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [sortBy, setSortBy] =
    useState<keyof EnrichedLocation["comparisonScore"]>("overall");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get location description from script analysis (via URL param)
  const locationPromptFromScript = searchParams.get("search") || "";

  // Load location requirements
  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/locations/requirements/${projectId}`);
      if (response.data.success) {
        const activeReqs = response.data.data.filter(
          (req: LocationRequirement) => req.status === "Active"
        );
        setRequirements(activeReqs);
        if (activeReqs.length > 0 && !selectedRequirement) {
          setSelectedRequirement(activeReqs[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to load requirements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchRequirements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Refresh requirements after creating new one
  const handleRequirementCreated = () => {
    fetchRequirements();
  };

  // Run comparison
  const runComparison = async () => {
    if (!selectedRequirement) return;

    try {
      setComparing(true);
      const response = await api.post(
        `/locations/compare/${selectedRequirement}`,
        { weights }
      );

      if (response.data.success) {
        setComparisonData(response.data.data);
      }
    } catch (error) {
      console.error("Comparison failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to compare locations. Please try again.";
      alert(errorMessage);
    } finally {
      setComparing(false);
    }
  };

  // Update weights and re-run comparison
  const updateWeight = (key: keyof WeightConfig, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  // Normalize weights to 100%
  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (total !== 100) {
      const factor = 100 / total;
      setWeights({
        budget: Math.round(weights.budget * factor),
        similarity: Math.round(weights.similarity * factor),
        crewAccess: Math.round(weights.crewAccess * factor),
        transportation: Math.round(weights.transportation * factor),
      });
    }
  };

  // Sort locations
  const sortedLocations = comparisonData?.locations
    ? [...comparisonData.locations].sort((a, b) => {
        const aVal = a.comparisonScore[sortBy];
        const bVal = b.comparisonScore[sortBy];
        return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
      })
    : [];

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Get medal emoji
  const getMedal = (index: number): string => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  // Refresh cache for a location
  const refreshCache = async (locationId: string) => {
    try {
      await api.post(`/locations/${locationId}/refresh-cache`);
      alert("Cache refreshed! Re-running comparison...");
      await runComparison();
    } catch (error) {
      console.error("Failed to refresh cache:", error);
      alert("Failed to refresh cache. Please try again.");
    }
  };

  // Export to CSV (simplified PDF alternative)
  const exportToCSV = () => {
    if (!comparisonData) return;

    const headers = [
      "Rank",
      "Location",
      "Overall Score",
      "Budget Score",
      "Similarity Score",
      "Crew Access Score",
      "Transportation Score",
      "Daily Rate",
      "Nearby Hotels",
      "Nearby Restaurants",
    ];

    const rows = sortedLocations.map((loc, index) => [
      index + 1,
      loc.title,
      loc.comparisonScore.overall,
      loc.comparisonScore.budget,
      loc.comparisonScore.similarity,
      loc.comparisonScore.crewAccess,
      loc.comparisonScore.transportation,
      loc.budget?.dailyRate || "N/A",
      loc.cachedData?.nearbyHotels?.length || 0,
      loc.cachedData?.nearbyRestaurants?.length || 0,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `location-comparison-${selectedRequirement}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading requirements...</div>
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No location requirements found. Create a requirement first to
              compare locations.
            </p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setShowCreateModal(true)}
            >
              Create Location Requirement
            </button>
          </div>
        </div>

        {/* Create Requirement Modal */}
        <CreateRequirementModal
          isOpen={showCreateModal}
          projectId={projectId || ""}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleRequirementCreated}
          initialPrompt={locationPromptFromScript}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: Requirement Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Location Comparison</h2>

        <div className="space-y-4">
          {/* Requirement Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Location Requirement:
            </label>
            <div className="flex gap-2">
              <select
                value={selectedRequirement}
                onChange={(e) => setSelectedRequirement(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                aria-label="Select location requirement"
              >
                {requirements.map((req) => (
                  <option key={req._id} value={req._id}>
                    {req.prompt} ({req.potentialLocationsCount} locations) -{" "}
                    {req.priority} Priority
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                title="Create new requirement"
              >
                + New
              </button>
            </div>
          </div>

          {/* Selected Requirement Details */}
          {selectedRequirement && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              {(() => {
                const req = requirements.find(
                  (r) => r._id === selectedRequirement
                );
                return req ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900">
                        {req.prompt}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          req.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : req.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {req.priority}
                      </span>
                    </div>
                    {req.notes && (
                      <p className="text-sm text-blue-700 mb-2">{req.notes}</p>
                    )}
                    {req.budget?.max && (
                      <p className="text-sm text-blue-700">
                        Budget: Max ${req.budget.max}/day
                      </p>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Weight Sliders */}
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              Adjust Comparison Weights:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget Weight */}
              <div>
                <label className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">💰 Budget</span>
                  <span className="text-gray-600">{weights.budget}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.budget}
                  onChange={(e) =>
                    updateWeight("budget", Number(e.target.value))
                  }
                  onBlur={normalizeWeights}
                  className="w-full"
                  aria-label="Budget weight"
                />
              </div>

              {/* Similarity Weight */}
              <div>
                <label className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">🎯 Similarity</span>
                  <span className="text-gray-600">{weights.similarity}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.similarity}
                  onChange={(e) =>
                    updateWeight("similarity", Number(e.target.value))
                  }
                  onBlur={normalizeWeights}
                  className="w-full"
                  aria-label="Similarity weight"
                />
              </div>

              {/* Crew Access Weight */}
              <div>
                <label className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">👥 Crew Access</span>
                  <span className="text-gray-600">{weights.crewAccess}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.crewAccess}
                  onChange={(e) =>
                    updateWeight("crewAccess", Number(e.target.value))
                  }
                  onBlur={normalizeWeights}
                  className="w-full"
                  aria-label="Crew access weight"
                />
              </div>

              {/* Transportation Weight */}
              <div>
                <label className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">🚗 Transportation</span>
                  <span className="text-gray-600">
                    {weights.transportation}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.transportation}
                  onChange={(e) =>
                    updateWeight("transportation", Number(e.target.value))
                  }
                  onBlur={normalizeWeights}
                  className="w-full"
                  aria-label="Transportation weight"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={runComparison}
              disabled={comparing || !selectedRequirement}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {comparing ? "🔄 Comparing..." : "🚀 Run Comparison"}
            </button>
            {comparisonData && (
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-6 py-3 rounded font-medium hover:bg-green-700"
              >
                📥 Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      {comparisonData && comparisonData.recommendation && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
            <span className="mr-2">🤖</span>
            AI Recommendation
          </h3>
          <p className="text-purple-800 whitespace-pre-line">
            {comparisonData.recommendation}
          </p>
        </div>
      )}

      {/* Comparison Table */}
      {comparisonData && comparisonData.locations.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Comparison Results ({sortedLocations.length} locations)
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as keyof EnrichedLocation["comparisonScore"]
                  )
                }
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                aria-label="Sort by field"
              >
                <option value="overall">Overall Score</option>
                <option value="budget">Budget</option>
                <option value="similarity">Similarity</option>
                <option value="crewAccess">Crew Access</option>
                <option value="transportation">Transportation</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {sortOrder === "desc" ? "↓" : "↑"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Similarity
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crew Access
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transport
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedLocations.map((location, index) => (
                  <React.Fragment key={location._id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        setExpandedLocation(
                          expandedLocation === location._id
                            ? null
                            : location._id
                        )
                      }
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="text-2xl">{getMedal(index)}</span>
                        <span className="ml-2 text-gray-600">#{index + 1}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {location.title}
                        </div>
                        {location.address && (
                          <div className="text-sm text-gray-500">
                            {location.address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-lg font-semibold rounded-full ${getScoreColor(
                            location.comparisonScore.overall
                          )}`}
                        >
                          {location.comparisonScore.overall.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        {location.comparisonScore.budget.toFixed(1)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        {location.comparisonScore.similarity.toFixed(1)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        {location.comparisonScore.crewAccess.toFixed(1)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        {location.comparisonScore.transportation.toFixed(1)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshCache(location._id);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Refresh cached data"
                        >
                          🔄
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedLocation === location._id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Budget Info */}
                            <div className="bg-white p-4 rounded border">
                              <h4 className="font-semibold mb-2 flex items-center">
                                <span className="mr-2">💰</span>
                                Budget Details
                              </h4>
                              {location.budget ? (
                                <div className="text-sm space-y-1">
                                  <p>
                                    <span className="text-gray-600">
                                      Daily Rate:
                                    </span>{" "}
                                    <span className="font-medium">
                                      ${location.budget.dailyRate || "N/A"}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-600">
                                      Range:
                                    </span>{" "}
                                    ${location.budget.estimatedMin} - $
                                    {location.budget.estimatedMax}
                                  </p>
                                  <p>
                                    <span className="text-gray-600">
                                      Confidence:
                                    </span>{" "}
                                    {location.budget.confidence}
                                  </p>
                                  {location.budget.reasoning && (
                                    <p className="text-gray-600 text-xs mt-2">
                                      {location.budget.reasoning}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No budget data
                                </p>
                              )}
                            </div>

                            {/* Amenities */}
                            <div className="bg-white p-4 rounded border">
                              <h4 className="font-semibold mb-2 flex items-center">
                                <span className="mr-2">🏢</span>
                                Amenities
                              </h4>
                              {location.amenities ? (
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {Object.entries(location.amenities)
                                    .filter(([key]) => key !== "extractedAt")
                                    .map(([key, value]) => (
                                      <div
                                        key={key}
                                        className="flex items-center"
                                      >
                                        <span className="mr-1">
                                          {value ? "✅" : "❌"}
                                        </span>
                                        <span className="capitalize text-xs">
                                          {key.replace(/([A-Z])/g, " $1")}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No amenity data
                                </p>
                              )}
                            </div>

                            {/* Crew Access */}
                            <div className="bg-white p-4 rounded border">
                              <h4 className="font-semibold mb-2 flex items-center">
                                <span className="mr-2">👥</span>
                                Crew Access
                              </h4>
                              <div className="text-sm space-y-2">
                                <div>
                                  <p className="text-gray-600 font-medium">
                                    Hotels (
                                    {location.cachedData?.nearbyHotels
                                      ?.length || 0}
                                    )
                                  </p>
                                  {location.cachedData?.nearbyHotels
                                    ?.slice(0, 3)
                                    .map((hotel, i) => (
                                      <p
                                        key={i}
                                        className="text-xs text-gray-500"
                                      >
                                        • {hotel.name} (
                                        {hotel.distance.toFixed(1)} mi){" "}
                                        {hotel.priceRange} ⭐
                                        {hotel.rating.toFixed(1)}
                                      </p>
                                    ))}
                                </div>
                                <div>
                                  <p className="text-gray-600 font-medium">
                                    Restaurants (
                                    {location.cachedData?.nearbyRestaurants
                                      ?.length || 0}
                                    )
                                  </p>
                                  {location.cachedData?.nearbyRestaurants
                                    ?.slice(0, 3)
                                    .map((rest, i) => (
                                      <p
                                        key={i}
                                        className="text-xs text-gray-500"
                                      >
                                        • {rest.name} (
                                        {rest.distance.toFixed(1)} mi) ⭐
                                        {rest.rating.toFixed(1)}
                                      </p>
                                    ))}
                                </div>
                              </div>
                            </div>

                            {/* Transportation */}
                            <div className="bg-white p-4 rounded border">
                              <h4 className="font-semibold mb-2 flex items-center">
                                <span className="mr-2">🚗</span>
                                Transportation
                              </h4>
                              <div className="text-sm space-y-1">
                                {location.cachedData?.transportation
                                  ?.nearestMetro && (
                                  <p>
                                    <span className="text-gray-600">
                                      Metro:
                                    </span>{" "}
                                    {
                                      location.cachedData.transportation
                                        .nearestMetro.name
                                    }{" "}
                                    (
                                    {location.cachedData.transportation.nearestMetro.distance.toFixed(
                                      1
                                    )}{" "}
                                    mi)
                                  </p>
                                )}
                                {location.cachedData?.transportation
                                  ?.nearestBusStop && (
                                  <p>
                                    <span className="text-gray-600">Bus:</span>{" "}
                                    {
                                      location.cachedData.transportation
                                        .nearestBusStop.name
                                    }{" "}
                                    (
                                    {location.cachedData.transportation.nearestBusStop.distance.toFixed(
                                      1
                                    )}{" "}
                                    mi)
                                  </p>
                                )}
                                <p>
                                  <span className="text-gray-600">
                                    Parking:
                                  </span>{" "}
                                  {location.cachedData?.transportation
                                    ?.parkingFacilities?.length || 0}{" "}
                                  nearby
                                </p>
                              </div>
                            </div>

                            {/* Weather */}
                            <div className="bg-white p-4 rounded border">
                              <h4 className="font-semibold mb-2 flex items-center">
                                <span className="mr-2">🌤️</span>
                                Weather
                              </h4>
                              <div className="text-sm space-y-1">
                                {location.cachedData?.weather?.current && (
                                  <p>
                                    <span className="text-gray-600">
                                      Current:
                                    </span>{" "}
                                    {location.cachedData.weather.current.temp}
                                    °F,{" "}
                                    {
                                      location.cachedData.weather.current
                                        .condition
                                    }
                                  </p>
                                )}
                                {location.cachedData?.weather?.bestMonths && (
                                  <p>
                                    <span className="text-gray-600">
                                      Best Months:
                                    </span>{" "}
                                    {location.cachedData.weather.bestMonths.join(
                                      ", "
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Distance to Finalized */}
                            {location.cachedData
                              ?.distanceToFinalizedLocations &&
                              location.cachedData.distanceToFinalizedLocations
                                .length > 0 && (
                                <div className="bg-white p-4 rounded border">
                                  <h4 className="font-semibold mb-2 flex items-center">
                                    <span className="mr-2">📍</span>
                                    Distance to Finalized Locations
                                  </h4>
                                  <div className="text-sm space-y-1">
                                    {location.cachedData.distanceToFinalizedLocations.map(
                                      (dist, i) => (
                                        <p key={i}>
                                          • {dist.locationName}:{" "}
                                          {dist.distance.toFixed(1)} mi
                                        </p>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {comparisonData && comparisonData.locations.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">
            No potential locations found for this requirement.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Add some potential locations to this requirement first.
          </p>
        </div>
      )}

      {/* Create Requirement Modal */}
      <CreateRequirementModal
        isOpen={showCreateModal}
        projectId={projectId || ""}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRequirementCreated}
        initialPrompt={locationPromptFromScript}
      />
    </div>
  );
};

export default LocationComparisonTab;
