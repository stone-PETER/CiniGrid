import React, { useState } from 'react';

interface Scene {
  id: string;
  title: string;
  time: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  location?: string;
  description?: string;
  dependencies?: string[];
  status: string;
}

const ScenesScreen: React.FC = () => {
  const [scenes] = useState<Scene[]>([
    {
      id: '1',
      title: 'Opening Sequence - Sunrise at Beach',
      time: '06:00',
      date: '2025-10-10',
      priority: 'High',
      location: 'Malibu Beach',
      description: 'Establishing shot with protagonist walking on beach',
      dependencies: ['Weather conditions', 'Sunrise timing'],
      status: 'Scheduled'
    },
    {
      id: '2', 
      title: 'Interior Dialog - Coffee Shop',
      time: '14:00',
      date: '2025-10-11',
      priority: 'Medium',
      location: 'Downtown Cafe',
      description: 'Character development scene between leads',
      dependencies: ['Location permit', 'Sound equipment'],
      status: 'In Progress'
    },
    {
      id: '3',
      title: 'Car Chase Sequence',
      time: '10:00',
      date: '2025-10-12',
      priority: 'High',
      location: 'Highway 101',
      description: 'Action sequence requiring multiple camera angles',
      dependencies: ['Stunt coordinator', 'Police permits', 'Safety crew'],
      status: 'Planning'
    },
    {
      id: '4',
      title: 'Emotional Finale - Park Bench',
      time: '16:00',
      date: '2025-10-13',
      priority: 'High',
      location: 'Central Park',
      description: 'Climactic emotional scene',
      dependencies: ['Actor availability', 'Weather backup'],
      status: 'Scheduled'
    }
  ]);

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
      case 'Completed': return '#4CAF50';
      case 'In Progress': return '#FF9800';
      case 'Scheduled': return '#2196F3';
      case 'Planning': return '#7A7A7A';
      default: return '#7A7A7A';
    }
  };

  const sortedScenes = [...scenes].sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());

  return (
    <div className="h-full p-6" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#1F1F1F' }}>
          Scenes Schedule
        </h1>
        <button 
          className="px-4 py-2 font-bold rounded-md hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#FCCA00', color: '#1F1F1F' }}
        >
          + Add Scene
        </button>
      </div>

      {/* Scenes List */}
      <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
        {sortedScenes.map((scene) => (
          <div
            key={scene.id}
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
                    {scene.status}
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
                    <div style={{ color: '#7A7A7A' }}>{scene.date} at {scene.time}</div>
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
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                <button 
                  className="px-3 py-1 text-xs font-bold rounded hover:opacity-80"
                  style={{ backgroundColor: '#1F1F1F', color: '#FCCA00' }}
                >
                  Edit
                </button>
                <button 
                  className="px-3 py-1 text-xs font-bold rounded hover:opacity-80"
                  style={{ backgroundColor: '#FCCA00', color: '#1F1F1F' }}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenesScreen;