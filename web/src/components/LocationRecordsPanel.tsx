import React, { useState, useEffect } from "react";
import api from "../services/api";
import LocationRecordCard from "./LocationRecordCard";
import CreateLocationRecordModal from "./CreateLocationRecordModal";
import ImportLocationsModal from "./ImportLocationsModal";

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

interface LocationRecordsPanelProps {
  projectId: string;
  selectedRecordId: string | null;
  onSelectRecord: (recordId: string | null) => void;
  onSearchForRecord: (record: LocationRecord) => void;
  onCompareRecord: (record: LocationRecord) => void;
  refreshTrigger?: number;
}

const LocationRecordsPanel: React.FC<LocationRecordsPanelProps> = ({
  projectId,
  selectedRecordId,
  onSelectRecord,
  onSearchForRecord,
  onCompareRecord,
  refreshTrigger,
}) => {
  const [records, setRecords] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LocationRecord | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch location records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/location-records/${projectId}`);

      if (response.data.success) {
        setRecords(response.data.data);
      } else {
        throw new Error(
          response.data.error || "Failed to fetch location records"
        );
      }
    } catch (err) {
      console.error("Error fetching location records:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load location records";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Refresh when refreshTrigger changes (when locations are added)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const handleCreateSuccess = () => {
    fetchRecords();
  };

  const handleEdit = (record: LocationRecord) => {
    // TODO: Implement edit modal
    console.log("Edit record:", record);
  };

  const handleDeleteClick = (record: LocationRecord) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    try {
      const response = await api.delete(
        `/location-records/${recordToDelete._id}`
      );

      if (response.data.success) {
        // Remove from list
        setRecords((prev) => prev.filter((r) => r._id !== recordToDelete._id));

        // Deselect if it was selected
        if (selectedRecordId === recordToDelete._id) {
          onSelectRecord(null);
        }

        setShowDeleteConfirm(false);
        setRecordToDelete(null);
      } else {
        throw new Error(
          response.data.error || "Failed to delete location record"
        );
      }
    } catch (err) {
      console.error("Error deleting location record:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete location record";
      const apiError =
        err && typeof err === "object" && "response" in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined;
      alert(apiError || errorMessage);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location records...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Location Records
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRecords}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (records.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Location Records Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first location record to start finding and comparing
            potential filming locations.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              + Create Location Record
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium"
            >
              📄 Import from Script Analysis
            </button>
          </div>
        </div>

        <CreateLocationRecordModal
          isOpen={showCreateModal}
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />

        <ImportLocationsModal
          isOpen={showImportModal}
          projectId={projectId}
          onClose={() => setShowImportModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  // Main view
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Location Records
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {records.length} {records.length === 1 ? "record" : "records"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium text-sm"
            title="Import locations from script analysis"
          >
            📄 Import
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            + New Record
          </button>
        </div>
      </div>

      {/* Records List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {records.map((record) => (
          <LocationRecordCard
            key={record._id}
            record={record}
            isSelected={selectedRecordId === record._id}
            onSelect={() => onSelectRecord(record._id)}
            onSearch={() => onSearchForRecord(record)}
            onCompare={() => onCompareRecord(record)}
            onEdit={() => handleEdit(record)}
            onDelete={() => handleDeleteClick(record)}
          />
        ))}
      </div>

      {/* Create Modal */}
      <CreateLocationRecordModal
        isOpen={showCreateModal}
        projectId={projectId}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Import Modal */}
      <ImportLocationsModal
        isOpen={showImportModal}
        projectId={projectId}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && recordToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Location Record?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "
              <strong>{recordToDelete.name}</strong>"?
            </p>
            {recordToDelete.stats.finalizedCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ This record has {recordToDelete.stats.finalizedCount}{" "}
                  finalized location(s). You cannot delete it until you
                  un-finalize those locations.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={recordToDelete.stats.finalizedCount > 0}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationRecordsPanel;
