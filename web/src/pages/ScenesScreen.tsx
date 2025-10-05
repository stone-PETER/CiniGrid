import React, { useState, useEffect } from 'react';
import { sceneService } from '../services/productionService';
import { useProject } from '../context/ProjectContext';
import type { Scene, CreateSceneRequest } from '../types';

const ScenesScreen: React.FC = () => {
  const { currentProject } = useProject();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    status: string;
    priority: string;
    search: string;
  }>({
    status: 'all',
    priority: 'all',
    search: '',
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    time: string;
    date: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'backlogged' | 'pre-production' | 'ready' | 'ongoing' | 'in review' | 'completed';
    location: string;
    dependencies: string;
    equipment: string;
    shotType: string;
    lighting: string;
    weather: string;
  }>({
    title: '',
    description: '',
    time: '',
    date: '',
    priority: 'Medium',
    status: 'backlogged',
    location: '',
    dependencies: '',
    equipment: '',
    shotType: '',
    lighting: '',
    weather: '',
  });

  // Load scenes
  const loadScenes = async () => {
    if (!currentProject) {
      setScenes([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await sceneService.getScenes({}, currentProject._id);
      setScenes(response.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenes();
  }, [currentProject?._id]); // Reload when project changes

  // Filter scenes
  const filteredScenes = scenes.filter(scene => {
    if (filter.status !== 'all' && scene.status !== filter.status) return false;
    if (filter.priority !== 'all' && scene.priority !== filter.priority) return false;
    if (filter.search && !scene.title.toLowerCase().includes(filter.search.toLowerCase()) &&
        !scene.description?.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  // Create or update scene
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProject) {
      setError('No project selected');
      return;
    }
    
    try {
      const sceneData: CreateSceneRequest = {
        title: formData.title,
        description: formData.description,
        time: formData.time || undefined,
        date: formData.date || undefined,
        priority: formData.priority,
        status: formData.status,
        location: formData.location || undefined,
        dependencies: formData.dependencies ? formData.dependencies.split(',').map(d => d.trim()) : [],
        equipment: formData.equipment ? formData.equipment.split(',').map(e => e.trim()) : [],
        shotType: formData.shotType as any || undefined,
        lighting: formData.lighting as any || undefined,
        weather: formData.weather as any || undefined,
      };

      if (editingScene) {
        await sceneService.updateScene(editingScene._id, sceneData);
      } else {
        await sceneService.createScene(sceneData, currentProject._id);
      }

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        time: '',
        date: '',
        priority: 'Medium',
        status: 'backlogged',
        location: '',
        dependencies: '',
        equipment: '',
        shotType: '',
        lighting: '',
        weather: '',
      });
      setShowCreateModal(false);
      setEditingScene(null);
      
      // Reload scenes
      await loadScenes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scene');
    }
  };

  // Update scene status
  const handleStatusChange = async (sceneId: string, newStatus: string) => {
    try {
      await sceneService.updateSceneStatus(sceneId, newStatus);
      await loadScenes(); // Reload to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scene status');
    }
  };

  // Edit scene
  const handleEdit = (scene: Scene) => {
    setEditingScene(scene);
    setFormData({
      title: scene.title,
      description: scene.description || '',
      time: scene.time || '',
      date: scene.date || '',
      priority: scene.priority,
      status: scene.status,
      location: scene.location || '',
      dependencies: scene.dependencies?.join(', ') || '',
      equipment: scene.equipment?.join(', ') || '',
      shotType: scene.shotType || '',
      lighting: scene.lighting || '',
      weather: scene.weather || '',
    });
    setShowCreateModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#FF4444';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return '#7A7A7A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'ongoing': return '#FF9800';
      case 'in review': return '#9C27B0';
      case 'ready': return '#2196F3';
      case 'pre-production': return '#FF5722';
      case 'backlogged': return '#7A7A7A';
      default: return '#7A7A7A';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const sortedScenes = [...filteredScenes].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    const dateA = new Date(a.date + ' ' + (a.time || '00:00')).getTime();
    const dateB = new Date(b.date + ' ' + (b.time || '00:00')).getTime();
    return dateA - dateB;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading scenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#1F1F1F' }}>
          Scenes Schedule
        </h1>
        <button 
          className="px-4 py-2 font-bold rounded-md hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#1F1F1F', color: '#FCCA00' }}
          onClick={() => setShowCreateModal(true)}
        >
          + Add Scene
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter({...filter, search: e.target.value})}
              placeholder="Search scenes..."
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="all">All Statuses</option>
              <option value="backlogged">Backlogged</option>
              <option value="pre-production">Pre-production</option>
              <option value="ready">Ready</option>
              <option value="ongoing">Ongoing</option>
              <option value="in review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({...filter, priority: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: 'all', priority: 'all', search: '' })}
              className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
        {sortedScenes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No scenes found. {filter.search || filter.status !== 'all' || filter.priority !== 'all' ? 'Try adjusting your filters.' : 'Create your first scene!'}</p>
          </div>
        ) : (
          sortedScenes.map((scene) => (
            <div
              key={scene._id}
              className="p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, #D0D0D0 0%, #FFFFFF 100%)',
                border: '1px solid #7A7A7A'
              }}
            >
              <div className="flex items-start justify-between">
                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold" style={{ color: '#1F1F1F' }}>
                      {scene.title}
                    </h3>
                    <span 
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{ backgroundColor: getPriorityColor(scene.priority), color: '#FFFFFF' }}
                    >
                      {scene.priority}
                    </span>
                    <span 
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{ backgroundColor: getStatusColor(scene.status), color: '#FFFFFF' }}
                    >
                      {formatStatus(scene.status)}
                    </span>
                  </div>

                  {scene.description && (
                    <p className="text-sm mb-3" style={{ color: '#7A7A7A' }}>
                      {scene.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-semibold" style={{ color: '#1F1F1F' }}>Date & Time:</span>
                      <div style={{ color: '#7A7A7A' }}>
                        {scene.date ? `${scene.date}${scene.time ? ` at ${scene.time}` : ''}` : 'Not scheduled'}
                      </div>
                    </div>
                    
                    {scene.location && (
                      <div>
                        <span className="font-semibold" style={{ color: '#1F1F1F' }}>Location:</span>
                        <div style={{ color: '#7A7A7A' }}>{scene.location}</div>
                      </div>
                    )}

                    {scene.dependencies && scene.dependencies.length > 0 && (
                      <div>
                        <span className="font-semibold" style={{ color: '#1F1F1F' }}>Dependencies:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {scene.dependencies.map((dep, index) => (
                            <span 
                              key={index}
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: '#FCCA00', color: '#1F1F1F' }}
                            >
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional metadata */}
                  <div className="mt-3 text-xs text-gray-500">
                    {scene.shotType && <span className="mr-4">Shot: {scene.shotType}</span>}
                    {scene.lighting && <span className="mr-4">Lighting: {scene.lighting}</span>}
                    {scene.weather && <span>Weather: {scene.weather}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button 
                    className="px-3 py-1 text-xs font-bold rounded hover:opacity-80"
                    style={{ backgroundColor: '#1F1F1F', color: '#FCCA00' }}
                    onClick={() => handleEdit(scene)}
                  >
                    Edit
                  </button>
                  
                  {/* Quick status change */}
                  <div className="flex flex-col gap-1">
                    {scene.status !== 'ongoing' && (
                      <button
                        onClick={() => handleStatusChange(scene._id, 'ongoing')}
                        className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        Start
                      </button>
                    )}
                    {scene.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(scene._id, 'completed')}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Scene Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingScene ? 'Edit Scene' : 'Create New Scene'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded h-20"
                    required
                  />
                </div>

                {/* Date and Time */}
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                {/* Priority and Status */}
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as 'High' | 'Medium' | 'Low'})}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="backlogged">Backlogged</option>
                    <option value="pre-production">Pre-production</option>
                    <option value="ready">Ready</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="in review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                {/* Dependencies */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Dependencies (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.dependencies}
                    onChange={(e) => setFormData({...formData, dependencies: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Weather conditions, Equipment setup, etc."
                  />
                </div>

                {/* Equipment */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Equipment (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.equipment}
                    onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="4K Camera, Lighting Kit, etc."
                  />
                </div>

                {/* Shot Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Shot Type</label>
                  <select
                    value={formData.shotType}
                    onChange={(e) => setFormData({...formData, shotType: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select shot type</option>
                    <option value="wide">Wide</option>
                    <option value="medium">Medium</option>
                    <option value="close-up">Close-up</option>
                    <option value="extreme close-up">Extreme Close-up</option>
                    <option value="establishing">Establishing</option>
                    <option value="insert">Insert</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Lighting */}
                <div>
                  <label className="block text-sm font-medium mb-2">Lighting</label>
                  <select
                    value={formData.lighting}
                    onChange={(e) => setFormData({...formData, lighting: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select lighting</option>
                    <option value="natural">Natural</option>
                    <option value="artificial">Artificial</option>
                    <option value="mixed">Mixed</option>
                    <option value="golden hour">Golden Hour</option>
                    <option value="blue hour">Blue Hour</option>
                    <option value="night">Night</option>
                  </select>
                </div>

                {/* Weather */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Weather Preference</label>
                  <select
                    value={formData.weather}
                    onChange={(e) => setFormData({...formData, weather: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">Any weather</option>
                    <option value="sunny">Sunny</option>
                    <option value="cloudy">Cloudy</option>
                    <option value="rainy">Rainy</option>
                    <option value="windy">Windy</option>
                    <option value="snow">Snow</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingScene(null);
                    setFormData({
                      title: '',
                      description: '',
                      time: '',
                      date: '',
                      priority: 'Medium',
                      status: 'backlogged',
                      location: '',
                      dependencies: '',
                      equipment: '',
                      shotType: '',
                      lighting: '',
                      weather: '',
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-medium rounded hover:opacity-80"
                  style={{ backgroundColor: '#1F1F1F', color: '#FCCA00' }}
                >
                  {editingScene ? 'Update Scene' : 'Create Scene'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenesScreen;