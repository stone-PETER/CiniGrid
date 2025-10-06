import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext";
import { useLocations } from "../hooks/useLocations";
import type { Location as LocationType, Suggestion } from "../types";
import SearchBox from "../components/SearchBox";
import SuggestionsList from "../components/SuggestionsList";
import PotentialLocationsList from "../components/PotentialLocationsList";
import PotentialDetailPanel from "../components/PotentialDetailPanel";
import DirectAddForm from "../components/DirectAddForm";
import Toast from "../components/Toast";

const ScoutDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentProject } = useProject();
  const {
    suggestions,
    potentialLocations,
    selectedLocation,
    locationNotes,
    locationApprovals,
    loading,
    error,
    searchAi,
    addPotentialFromSuggestion,
    getPotentialList,
    getPotentialDetail,
    addNote,
    addApproval,
    finalizeLocation,
    directAddToPotential,
    directAddToFinalized,
    setSelectedLocation,
    setError,
  } = useLocations();

  const [showDirectAddForm, setShowDirectAddForm] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });

  useEffect(() => {
    // Load potential locations on component mount with current project filter
    console.log(
      "Loading potential locations for project:",
      currentProject?._id
    );
    getPotentialList(currentProject?._id)
      .then(() => {
        console.log("Potential locations loaded");
      })
      .catch((err) => {
        console.error("Failed to load potential locations:", err);
      });
  }, [getPotentialList, currentProject?._id]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type, visible: true });
  };

  const handleSearch = async (prompt: string) => {
    // Include projectId for project-scoped AI searches
    await searchAi({
      prompt,
      projectId: currentProject?._id,
    });
  };

  const handleAddToPotential = async (suggestion: Suggestion) => {
    try {
      // Pass projectId when adding location
      await addPotentialFromSuggestion(suggestion, currentProject?._id);
    } catch (err) {
      console.error("Failed to add to potential:", err);
    }
  };

  const handleSelectLocation = async (location: LocationType) => {
    console.log("Selecting location:", location);
    try {
      console.log("Calling getPotentialDetail with ID:", location._id);
      const result = await getPotentialDetail(location._id);
      console.log("Got location details:", result);
    } catch (err) {
      console.error("Failed to get location details:", err);
      showToast("Failed to load location details", "error");
    }
  };

  const handleAddNote = async (content: string) => {
    if (selectedLocation) {
      try {
        await addNote({ text: content, locationId: selectedLocation._id });
      } catch (err) {
        console.error("Failed to add note:", err);
      }
    }
  };

  const handleAddApproval = async (
    status: "approved" | "rejected",
    notes?: string
  ) => {
    if (selectedLocation) {
      try {
        await addApproval({
          status: status,
          notes: notes,
          locationId: selectedLocation._id,
        });
      } catch (err) {
        console.error("Failed to add approval:", err);
      }
    }
  };

  const handleFinalizeLocation = async () => {
    if (selectedLocation) {
      try {
        await finalizeLocation(selectedLocation._id);
        setSelectedLocation(null); // Clear selection since it moved to finalized
        showToast(
          `Location "${selectedLocation.title}" has been finalized successfully!`,
          "success"
        );
        // Refresh the potential locations list to remove the finalized one
        getPotentialList(currentProject?._id);
      } catch (err) {
        console.error("Failed to finalize location:", err);
        showToast("Failed to finalize location. Please try again.", "error");
      }
    }
  };

  const handleDirectAdd = async (data: {
    manualData: {
      title: string;
      description: string;
      coordinates: { lat: number; lng: number };
      region?: string;
      tags?: string[];
      permits?: string[];
      images?: string[];
    };
    status: "potential" | "finalized";
  }) => {
    try {
      const directAddData = {
        manualData: {
          title: data.manualData.title,
          description: data.manualData.description,
          coordinates: data.manualData.coordinates,
          region: data.manualData.region || "",
          tags: data.manualData.tags,
          permits: data.manualData.permits,
          images: data.manualData.images,
        },
      };

      if (data.status === "potential") {
        await directAddToPotential(directAddData);
      } else {
        await directAddToFinalized(directAddData);
      }
      setShowDirectAddForm(false);
    } catch (err) {
      console.error("Failed to add location directly:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Location Scouting Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user?.username} ({user?.role})
              </p>
            </div>
            <div className="flex gap-4">
              <a
                href="/finalized"
                className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-opacity"
                style={{ backgroundColor: "#FCCA00", color: "#1F1F1F" }}
              >
                View Finalized
              </a>
              <button
                onClick={() => setShowDirectAddForm(true)}
                className="px-4 py-2 rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-opacity"
                style={{ backgroundColor: "#1F1F1F", color: "#FCCA00" }}
              >
                Add Location
              </button>
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
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Search */}
          <div className="lg:col-span-3">
            <SearchBox onSearch={handleSearch} loading={loading} />
          </div>

          {/* Middle Column - Suggestions */}
          <div className="lg:col-span-4">
            <SuggestionsList
              suggestions={suggestions}
              onAddToPotential={handleAddToPotential}
              loading={loading}
            />
          </div>

          {/* Right Column - Potential Locations */}
          <div className="lg:col-span-5">
            <PotentialLocationsList
              locations={potentialLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              loading={loading}
            />
          </div>
        </div>

        {/* Detail Panel - Full Width */}
        {selectedLocation && (
          <div className="mt-8">
            <PotentialDetailPanel
              location={selectedLocation}
              notes={locationNotes}
              approvals={locationApprovals}
              currentUser={user}
              onAddNote={handleAddNote}
              onAddApproval={handleAddApproval}
              onFinalize={handleFinalizeLocation}
              loading={loading}
            />
          </div>
        )}
      </main>

      {/* Direct Add Form Modal */}
      <DirectAddForm
        isOpen={showDirectAddForm}
        onClose={() => setShowDirectAddForm(false)}
        onSubmit={handleDirectAdd}
        loading={loading}
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default ScoutDashboard;
