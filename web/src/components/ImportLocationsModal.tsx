import React, { useState, useEffect } from "react";
import api from "../services/api";

interface ImportLocationsModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface LocationPrompt {
  id: string;
  description: string;
  selected: boolean;
  name: string;
}

const ImportLocationsModal: React.FC<ImportLocationsModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onSuccess,
}) => {
  const [prompts, setPrompts] = useState<LocationPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && projectId) {
      loadScriptAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

  const loadScriptAnalysis = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/projects/${projectId}/script`);

      if (response.data.success) {
        const data = response.data.data;

        if (!data.hasScript || !data.locationPrompts?.length) {
          setError(
            "No script analysis found. Please upload a screenplay first."
          );
          setPrompts([]);
          return;
        }

        // Convert prompts to editable format
        const locationPrompts: LocationPrompt[] = data.locationPrompts.map(
          (description: string, index: number) => ({
            id: `prompt-${index}`,
            description,
            selected: true,
            name: generateNameFromDescription(description),
          })
        );

        setPrompts(locationPrompts);
      }
    } catch (err) {
      console.error("Error loading script analysis:", err);
      setError("Failed to load script analysis");
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate a short name from description
  const generateNameFromDescription = (description: string): string => {
    // Take first few words and capitalize
    const words = description.split(" ").slice(0, 4);
    let name = words.join(" ");

    // Truncate if too long
    if (name.length > 50) {
      name = name.substring(0, 47) + "...";
    }

    return name;
  };

  const handleToggleSelect = (id: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleToggleAll = () => {
    const allSelected = prompts.every((p) => p.selected);
    setPrompts((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
  };

  const handleNameChange = (id: string, name: string) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const handleImport = async () => {
    const selectedPrompts = prompts.filter((p) => p.selected);

    if (selectedPrompts.length === 0) {
      setError("Please select at least one location to import");
      return;
    }

    setImporting(true);
    setError("");

    try {
      // Create all location records in parallel
      const createPromises = selectedPrompts.map((prompt) =>
        api.post("/location-records", {
          projectId,
          name: prompt.name.trim(),
          description: prompt.description.trim(),
          userNotes: "Imported from script analysis",
          tags: ["script-import"],
        })
      );

      await Promise.all(createPromises);

      // Success!
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error importing locations:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to import locations";
      const apiError =
        err && typeof err === "object" && "response" in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined;
      setError(apiError || errorMessage);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  const selectedCount = prompts.filter((p) => p.selected).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Import Locations from Script
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select which locations to import as location records
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            title="Close modal"
            aria-label="Close modal"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={importing}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading script analysis...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={loadScriptAnalysis}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Locations List */}
          {!loading && !error && prompts.length > 0 && (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prompts.every((p) => p.selected)}
                    onChange={handleToggleAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={importing}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({prompts.length} locations)
                  </span>
                </label>
                <span className="text-sm text-gray-600">
                  {selectedCount} selected
                </span>
              </div>

              {/* Location Prompts */}
              <div className="space-y-3">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      prompt.selected
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={prompt.selected}
                        onChange={() => handleToggleSelect(prompt.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        disabled={importing}
                        aria-label={`Select ${prompt.name}`}
                      />
                      <div className="flex-1 space-y-2">
                        {/* Name Input */}
                        <input
                          type="text"
                          value={prompt.name}
                          onChange={(e) =>
                            handleNameChange(prompt.id, e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-sm font-medium border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Location name"
                          disabled={importing}
                        />
                        {/* Description */}
                        <p className="text-sm text-gray-700">
                          {prompt.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedCount > 0 && (
              <span>
                {selectedCount} location{selectedCount !== 1 ? "s" : ""} will be
                imported
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={importing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={importing || selectedCount === 0}
            >
              {importing
                ? "Importing..."
                : `Import ${selectedCount} Location${
                    selectedCount !== 1 ? "s" : ""
                  }`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportLocationsModal;
