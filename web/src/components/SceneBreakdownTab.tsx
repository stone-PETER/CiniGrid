import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

interface BreakdownScene {
  _id: string;
  sceneNumber: string;
  heading: string;
  intExt: "INT" | "EXT" | "INT/EXT";
  location: string;
  timeOfDay: string;
  description: string;
  pageCount: number;
  characters: string[];
  props: string[];
  vehicles: string[];
  wardrobe: string[];
  makeupHair: string[];
  specialEffects: string[];
  stunts: string[];
  animals: string[];
  extras: number;
  notes: string;
  importedToSceneId?: string;
}

interface BreakdownStats {
  totalScenes: number;
  totalPages: number;
  uniqueLocations: string[];
  uniqueCharacters: string[];
  intScenes: number;
  extScenes: number;
  dayScenes: number;
  nightScenes: number;
  generatedAt: string;
}

interface SceneBreakdownTabProps {
  isOwner: boolean;
}

const SceneBreakdownTab: React.FC<SceneBreakdownTabProps> = ({ isOwner }) => {
  const { projectId } = useParams<{ projectId: string }>();

  const [scenes, setScenes] = useState<BreakdownScene[]>([]);
  const [stats, setStats] = useState<BreakdownStats | null>(null);
  const [hasBreakdown, setHasBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedScene, setExpandedScene] = useState<string | null>(null);
  const [filterIntExt, setFilterIntExt] = useState<string>("ALL");
  const [filterTime, setFilterTime] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [importingAll, setImportingAll] = useState(false);
  const [importingScenes, setImportingScenes] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/projects/${projectId}/breakdown`);

        if (response.data.success) {
          setHasBreakdown(response.data.data.hasBreakdown);
          setScenes(response.data.data.scenes || []);
          setStats(response.data.data.stats);
        }
      } catch (error) {
        console.error("Failed to load breakdown:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [projectId]);

  const loadBreakdown = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}/breakdown`);

      if (response.data.success) {
        setHasBreakdown(response.data.data.hasBreakdown);
        setScenes(response.data.data.scenes || []);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error("Failed to load breakdown:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await api.post(
        `/projects/${projectId}/breakdown/generate`
      );

      if (response.data.success) {
        setScenes(response.data.data.scenes);
        setStats(response.data.data.stats);
        setHasBreakdown(true);
        alert(
          `✅ Generated breakdown for ${response.data.data.scenes.length} scenes!`
        );
      } else {
        alert(response.data.error || "Failed to generate breakdown");
      }
    } catch (error) {
      console.error("Generate error:", error);
      const err = error as { response?: { data?: { error?: string } } };
      alert(
        err.response?.data?.error ||
          "Failed to generate breakdown. Please ensure you have uploaded a script first."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleImportScene = async (sceneId: string) => {
    setImportingScenes((prev) => new Set(prev).add(sceneId));
    try {
      const response = await api.post(
        `/projects/${projectId}/breakdown/import/${sceneId}`
      );

      if (response.data.success) {
        // Update the scene to mark it as imported
        setScenes((prev) =>
          prev.map((s) =>
            s._id === sceneId
              ? { ...s, importedToSceneId: response.data.data.scene._id }
              : s
          )
        );
        alert(`✅ ${response.data.message}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      const err = error as {
        response?: { status?: number; data?: { error?: string } };
      };
      if (err.response?.status === 409) {
        alert(
          err.response.data?.error || "This scene has already been imported"
        );
      } else {
        alert(err.response?.data?.error || "Failed to import scene");
      }
    } finally {
      setImportingScenes((prev) => {
        const updated = new Set(prev);
        updated.delete(sceneId);
        return updated;
      });
    }
  };

  const handleReimportScene = async (sceneId: string) => {
    if (
      !confirm(
        "This will overwrite the existing scene with fresh data from the breakdown. Continue?"
      )
    ) {
      return;
    }

    setImportingScenes((prev) => new Set(prev).add(sceneId));
    try {
      const response = await api.post(
        `/projects/${projectId}/breakdown/reimport/${sceneId}`
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
      }
    } catch (error) {
      console.error("Re-import error:", error);
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || "Failed to re-import scene");
    } finally {
      setImportingScenes((prev) => {
        const updated = new Set(prev);
        updated.delete(sceneId);
        return updated;
      });
    }
  };

  const handleImportAll = async () => {
    if (
      !confirm(
        `Import all ${scenes.length} scenes to the Scenes tab? Existing scenes will be skipped.`
      )
    ) {
      return;
    }

    setImportingAll(true);
    try {
      const response = await api.post(
        `/projects/${projectId}/breakdown/import-all`
      );

      if (response.data.success) {
        const { imported, skipped, errors } = response.data.data.summary;
        alert(
          `✅ Import complete!\n\n` +
            `Imported: ${imported} scenes\n` +
            `Skipped: ${skipped} existing scenes\n` +
            `Errors: ${errors} scenes`
        );

        // Reload to get updated importedToSceneId fields
        loadBreakdown();
      }
    } catch (error) {
      console.error("Import all error:", error);
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || "Failed to import scenes");
    } finally {
      setImportingAll(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(
        `/projects/${projectId}/breakdown/export`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "scene_breakdown.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export breakdown");
    }
  };

  // Filter scenes
  const filteredScenes = scenes.filter((scene) => {
    if (filterIntExt !== "ALL" && scene.intExt !== filterIntExt) return false;
    if (filterTime !== "ALL" && scene.timeOfDay !== filterTime) return false;
    if (
      searchQuery &&
      !scene.heading.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !scene.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading breakdown...</p>
        </div>
      </div>
    );
  }

  if (!hasBreakdown) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="text-6xl mb-6">🎬</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Generate Scene Breakdown
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          AI will analyze your uploaded screenplay and extract detailed
          information about every scene, including locations, characters, props,
          and technical requirements.
        </p>
        {isOwner ? (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 text-lg font-medium"
          >
            {generating ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Analyzing Script... (30-60 seconds)
              </>
            ) : (
              "✨ Generate Breakdown with AI"
            )}
          </button>
        ) : (
          <p className="text-gray-500">
            Only the project owner can generate the breakdown.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Stats Overview */}
      {stats && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalScenes}
              </div>
              <div className="text-xs text-gray-600">Total Scenes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalPages.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.uniqueLocations.length}
              </div>
              <div className="text-xs text-gray-600">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.uniqueCharacters.length}
              </div>
              <div className="text-xs text-gray-600">Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {stats.intScenes}
              </div>
              <div className="text-xs text-gray-600">INT</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.extScenes}
              </div>
              <div className="text-xs text-gray-600">EXT</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.dayScenes}
              </div>
              <div className="text-xs text-gray-600">DAY</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {stats.nightScenes}
              </div>
              <div className="text-xs text-gray-600">NIGHT</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {isOwner && (
              <button
                onClick={handleImportAll}
                disabled={importingAll}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 font-medium"
              >
                {importingAll ? "Importing..." : "📥 Import All Scenes"}
              </button>
            )}
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              📄 Export CSV
            </button>
            {isOwner && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
              >
                {generating ? "Regenerating..." : "🔄 Regenerate"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search scenes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={filterIntExt}
            onChange={(e) => setFilterIntExt(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
            aria-label="Filter by INT/EXT"
          >
            <option value="ALL">All (INT/EXT)</option>
            <option value="INT">INT Only</option>
            <option value="EXT">EXT Only</option>
            <option value="INT/EXT">INT/EXT</option>
          </select>
          <select
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
            aria-label="Filter by time of day"
          >
            <option value="ALL">All Times</option>
            <option value="DAY">Day</option>
            <option value="NIGHT">Night</option>
            <option value="DAWN">Dawn</option>
            <option value="DUSK">Dusk</option>
            <option value="MORNING">Morning</option>
            <option value="AFTERNOON">Afternoon</option>
            <option value="EVENING">Evening</option>
            <option value="CONTINUOUS">Continuous</option>
          </select>
          <div className="text-sm text-gray-600">
            Showing {filteredScenes.length} of {scenes.length} scenes
          </div>
        </div>
      </div>

      {/* Scenes List */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Scene #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Heading
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Characters
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredScenes.map((scene) => (
                  <React.Fragment key={scene._id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {scene.sceneNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{scene.heading}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          {scene.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scene.pageCount || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {scene.characters.slice(0, 3).join(", ")}
                        {scene.characters.length > 3 &&
                          ` +${scene.characters.length - 3}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {scene.importedToSceneId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Imported
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Imported
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setExpandedScene(
                                expandedScene === scene._id ? null : scene._id
                              )
                            }
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {expandedScene === scene._id
                              ? "▼ Hide"
                              : "▶ Details"}
                          </button>
                          {isOwner && (
                            <>
                              {!scene.importedToSceneId ? (
                                <button
                                  onClick={() => handleImportScene(scene._id)}
                                  disabled={importingScenes.has(scene._id)}
                                  className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                                >
                                  {importingScenes.has(scene._id)
                                    ? "..."
                                    : "Import"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReimportScene(scene._id)}
                                  disabled={importingScenes.has(scene._id)}
                                  className="text-orange-600 hover:text-orange-900 disabled:text-gray-400"
                                >
                                  {importingScenes.has(scene._id)
                                    ? "..."
                                    : "Re-import"}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedScene === scene._id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                Cast
                              </h4>
                              <div className="text-sm text-gray-600">
                                {scene.characters.join(", ") || "None"}
                              </div>
                              {scene.extras > 0 && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Background: {scene.extras} extras
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                Props
                              </h4>
                              <div className="text-sm text-gray-600">
                                {scene.props.join(", ") || "None"}
                              </div>
                            </div>
                            {scene.vehicles.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                  Vehicles
                                </h4>
                                <div className="text-sm text-gray-600">
                                  {scene.vehicles.join(", ")}
                                </div>
                              </div>
                            )}
                            {scene.specialEffects.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                  Special Effects
                                </h4>
                                <div className="text-sm text-gray-600">
                                  {scene.specialEffects.join(", ")}
                                </div>
                              </div>
                            )}
                            {scene.stunts.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                  Stunts
                                </h4>
                                <div className="text-sm text-gray-600">
                                  {scene.stunts.join(", ")}
                                </div>
                              </div>
                            )}
                            {scene.animals.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                  Animals
                                </h4>
                                <div className="text-sm text-gray-600">
                                  {scene.animals.join(", ")}
                                </div>
                              </div>
                            )}
                            {scene.notes && (
                              <div className="col-span-2">
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                  Notes
                                </h4>
                                <div className="text-sm text-gray-600">
                                  {scene.notes}
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
      </div>
    </div>
  );
};

export default SceneBreakdownTab;
