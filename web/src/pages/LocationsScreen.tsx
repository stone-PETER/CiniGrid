import React, { useEffect, useState } from "react";
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import { useLocations } from "../hooks/useLocations";
import LocationRecordsPanel from "../components/LocationRecordsPanel";
import LocationSearchModal from "../components/LocationSearchModal";
import LocationComparisonModal from "../components/LocationComparisonModal";
import PotentialLocationsPanel from "../components/PotentialLocationsPanel";
import FinalizedLocationsPanel from "../components/FinalizedLocationsPanel";
import Toast from "../components/Toast";

interface LocationRecord {
  _id: string;
  projectId: string;
  name: string;
  description: string;
  userNotes: string;
  tags: string[];
  status: string;
  stats: {
    potentialsCount: number;
    finalizedCount: number;
  };
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
  };
}

const LocationsScreen: React.FC = () => {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const { error, getPotentialList, getFinalizedList, finalizeLocation } =
    useLocations();

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [recordToSearch, setRecordToSearch] = useState<LocationRecord | null>(
    null
  );
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [recordToCompare, setRecordToCompare] = useState<LocationRecord | null>(
    null
  );
  const [refreshRecordsTrigger, setRefreshRecordsTrigger] = useState(0);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error",
    visible: false,
  });

  useEffect(() => {
    if (currentProject?._id) {
      console.log(
        "🔄 LocationsScreen: Fetching potential and finalized locations for project:",
        currentProject._id
      );
      getPotentialList(currentProject._id);
      getFinalizedList(currentProject._id);
    }
  }, [getPotentialList, getFinalizedList, currentProject?._id]);

  const handleSelectRecord = (recordId: string | null) => {
    setSelectedRecordId(recordId);
  };

  const handleSearchForRecord = (record: LocationRecord) => {
    console.log("Search for record:", record);
    setRecordToSearch(record);
    setSearchModalOpen(true);
  };

  const handleCompareRecord = (record: LocationRecord) => {
    console.log("Compare potentials for record:", record);
    setRecordToCompare(record);
    setComparisonModalOpen(true);
  };

  const handleSearchSuccess = () => {
    setToast({
      message: "Location added to potentials successfully!",
      type: "success",
      visible: true,
    });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
    // Refresh potential locations list
    if (currentProject?._id) {
      getPotentialList(currentProject._id);
    }
    // Trigger refresh of location records to update stats
    setRefreshRecordsTrigger((prev) => prev + 1);
  };

  const handleFinalize = async (potentialId: string) => {
    try {
      await finalizeLocation(potentialId);
      setToast({
        message: "Location finalized successfully!",
        type: "success",
        visible: true,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
      // Refresh both lists
      if (currentProject?._id) {
        getPotentialList(currentProject._id);
        getFinalizedList(currentProject._id);
      }
    } catch (err) {
      console.error("Finalize error:", err);
      setToast({
        message: "Failed to finalize location",
        type: "error",
        visible: true,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
    }
  };

  const handleRefreshPotentials = () => {
    if (currentProject?._id) {
      getPotentialList(currentProject._id);
    }
  };

  return (
    <div className="h-full bg-white">
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

      {/* Three Column Layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* LEFT Column - Location Records */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200 bg-gray-900">
            <h2 className="text-lg font-bold text-yellow-400">
              Location Records
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Create and manage location needs
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <LocationRecordsPanel
              projectId={currentProject?._id || ""}
              selectedRecordId={selectedRecordId}
              onSelectRecord={handleSelectRecord}
              onSearchForRecord={handleSearchForRecord}
              onCompareRecord={handleCompareRecord}
              refreshTrigger={refreshRecordsTrigger}
            />
          </div>
        </div>

        {/* MIDDLE Column - Potential Locations */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200 bg-gray-900">
            <h2 className="text-lg font-bold text-yellow-400">
              Potential Locations
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Search results and candidates
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <PotentialLocationsPanel
              projectId={currentProject?._id || ""}
              selectedRecordId={selectedRecordId}
              currentUserId={user?.id || ""}
              onFinalize={handleFinalize}
              onRefresh={handleRefreshPotentials}
            />
          </div>
        </div>

        {/* RIGHT Column - Finalized Locations */}
        <div className="w-1/3 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200 bg-gray-900">
            <h2 className="text-lg font-bold text-yellow-400">
              Finalized Locations
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Confirmed and booked locations
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FinalizedLocationsPanel
              projectId={currentProject?._id || ""}
              onRefresh={() => {
                if (currentProject?._id) {
                  getPotentialList(currentProject._id);
                  getFinalizedList(currentProject._id);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      {/* Search Modal */}
      <LocationSearchModal
        isOpen={searchModalOpen}
        locationRecord={recordToSearch}
        projectId={currentProject?._id || ""}
        onClose={() => {
          setSearchModalOpen(false);
          setRecordToSearch(null);
        }}
        onSuccess={handleSearchSuccess}
      />

      {/* Comparison Modal */}
      <LocationComparisonModal
        isOpen={comparisonModalOpen}
        locationRecord={recordToCompare}
        projectId={currentProject?._id || ""}
        onClose={() => {
          setComparisonModalOpen(false);
          setRecordToCompare(null);
        }}
      />
    </div>
  );
};

export default LocationsScreen;
