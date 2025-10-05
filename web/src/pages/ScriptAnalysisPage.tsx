import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import SceneBreakdownTab from "../components/SceneBreakdownTab";

interface ScriptAnalysis {
  hasScript: boolean;
  filename?: string;
  uploadDate?: string;
  locationCount?: number;
  locationPrompts?: string[];
  isOwner?: boolean;
}

type TabType = "locations" | "breakdown";

const ScriptAnalysisPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("locations");
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const loadScriptAnalysis = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/projects/${projectId}/script`);

      if (response.data.success) {
        setAnalysis(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load script analysis:", err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Failed to load script analysis");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadScriptAnalysis();
  }, [loadScriptAnalysis]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus("Uploading screenplay...");
    setError("");

    try {
      const formData = new FormData();
      formData.append("script", selectedFile);

      setUploadStatus("Analyzing with AI...");

      const response = await api.post(
        `/projects/${projectId}/script/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setUploadStatus(
          `Success! Found ${response.data.data.locationCount} locations`
        );
        setSelectedFile(null);

        // Reload analysis after short delay
        setTimeout(() => {
          loadScriptAnalysis();
          setUploadStatus("");
        }, 2000);
      }
    } catch (err) {
      console.error("Upload error:", err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(
        error.response?.data?.error ||
          "Failed to upload screenplay. Please try again."
      );
      setUploadStatus("");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete the screenplay analysis?"
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(`/projects/${projectId}/script`);
      if (response.data.success) {
        loadScriptAnalysis();
      }
    } catch (err) {
      console.error("Delete error:", err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Failed to delete screenplay");
    }
  };

  const handleSearchLocation = (prompt: string) => {
    // Navigate to locations page with search query
    navigate(
      `/project/${projectId}/locations?search=${encodeURIComponent(prompt)}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading script analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Tabs Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Script Analysis
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered screenplay analysis and breakdown
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 border-b border-gray-200 -mb-px">
            <button
              onClick={() => setActiveTab("locations")}
              className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "locations"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📍 Locations
            </button>
            <button
              onClick={() => setActiveTab("breakdown")}
              className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "breakdown"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🎬 Scene Breakdown
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "locations" ? (
          <div className="max-w-6xl mx-auto p-6">
            {/* Upload Section (Owner Only) */}
            {analysis?.isOwner && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {analysis.hasScript
                    ? "Replace Screenplay"
                    : "Upload Screenplay"}
                </h2>

                {!analysis.hasScript ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      {selectedFile ? (
                        <>
                          <svg
                            className="w-16 h-16 text-blue-500 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <div className="text-lg font-medium text-gray-900 mb-1">
                            {selectedFile.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-16 h-16 text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <div className="text-lg font-medium text-gray-900 mb-1">
                            Click to upload screenplay
                          </div>
                          <div className="text-sm text-gray-500">
                            PDF format, max 10MB
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-10 h-10 text-blue-500 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">
                          {analysis.filename}
                        </div>
                        <div className="text-sm text-gray-500">
                          Uploaded{" "}
                          {new Date(analysis.uploadDate!).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {selectedFile && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition"
                  >
                    {uploading ? "Processing..." : "Upload & Analyze"}
                  </button>
                )}

                {uploadStatus && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      {uploading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                      )}
                      <span className="text-sm font-medium">
                        {uploadStatus}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Location Prompts Display */}
            {analysis?.hasScript &&
            analysis.locationPrompts &&
            analysis.locationPrompts.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Location Requirements
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {analysis.locationCount} locations identified from
                      screenplay
                    </p>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg
                      className="w-5 h-5 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    AI-powered analysis
                  </div>
                </div>

                <div className="space-y-4">
                  {analysis.locationPrompts.map((prompt, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-500 mb-2">
                            Location {index + 1}
                          </div>
                          <p className="text-gray-900 leading-relaxed">
                            {prompt}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSearchLocation(prompt)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition opacity-0 group-hover:opacity-100 whitespace-nowrap"
                        >
                          Search Locations →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : analysis?.hasScript ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <svg
                  className="w-12 h-12 text-yellow-500 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-yellow-800 font-medium">
                  No location requirements found
                </p>
                <p className="text-yellow-700 text-sm mt-2">
                  The screenplay was analyzed but no location descriptions could
                  be extracted
                </p>
              </div>
            ) : !analysis?.isOwner ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="text-gray-600 font-medium">
                  No screenplay uploaded yet
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  The project owner needs to upload a screenplay to see location
                  analysis
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <SceneBreakdownTab isOwner={analysis?.isOwner || false} />
        )}
      </div>
    </div>
  );
};

export default ScriptAnalysisPage;
