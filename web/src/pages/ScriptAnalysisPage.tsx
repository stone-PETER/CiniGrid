import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

interface ScriptAnalysis {
  hasScript: boolean;
  filename?: string;
  uploadDate?: string;
  locationCount?: number;
  locationPrompts?: string[];
  isOwner?: boolean;
}

const ScriptAnalysisPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Script Analysis
        </h1>
        <p className="text-gray-600">
          Upload your screenplay to automatically extract location requirements
          using AI
        </p>
      </div>

      {/* Upload Section (Owner Only) */}
      {analysis?.isOwner && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {analysis.hasScript ? "Replace Screenplay" : "Upload Screenplay"}
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
                <span className="text-sm font-medium">{uploadStatus}</span>
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
                {analysis.locationCount} locations identified from screenplay
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
                    <p className="text-gray-900 leading-relaxed">{prompt}</p>
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
            No locations found in screenplay
          </p>
          <p className="text-yellow-700 text-sm mt-1">
            Try uploading a different screenplay or check the file content
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No screenplay uploaded yet
          </h3>
          <p className="text-gray-600">
            {analysis?.isOwner
              ? "Upload a screenplay to get AI-powered location recommendations"
              : "The project owner needs to upload a screenplay first"}
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Upload your screenplay in PDF format</li>
              <li>
                AI analyzes the script to extract unique location requirements
              </li>
              <li>
                Each location is described in a way that's easy to search for
              </li>
              <li>
                Click "Search Locations" to find real venues matching each
                requirement
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptAnalysisPage;
