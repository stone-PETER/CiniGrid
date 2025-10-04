import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  location?: string;
  dependencies?: string[];
  users?: string[];
  resources?: string[];
  status: string;
}

const TasksScreen: React.FC = () => {
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Equipment Setup and Sound Check',
      description: 'Set up all camera equipment, lighting rigs, and conduct comprehensive sound checks',
      time: '08:00',
      date: '2025-10-10',
      priority: 'High',
      location: 'Malibu Beach',
      dependencies: ['Equipment delivery', 'Location access'],
      users: ['John (Camera)', 'Sarah (Sound)', 'Mike (Lighting)'],
      resources: ['4K Cameras x3', 'Lighting Kit', 'Sound Equipment', 'Generator'],
      status: 'Scheduled'
    },
    {
      id: '2',
      title: 'Talent Makeup and Wardrobe',
      description: 'Complete makeup application and wardrobe fitting for all main cast',
      time: '09:30',
      date: '2025-10-10',
      priority: 'Medium',
      location: 'Mobile Trailer',
      dependencies: ['Talent arrival', 'Wardrobe confirmation'],
      users: ['Lisa (Makeup)', 'Tom (Wardrobe)', 'Assistant x2'],
      resources: ['Makeup Kit', 'Wardrobe Set A', 'Mirrors', 'Chairs'],
      status: 'In Progress'
    },
    {
      id: '3',
      title: 'Location Security and Crowd Control',
      description: 'Ensure location perimeter security and manage crowd control during filming',
      time: '07:00',
      date: '2025-10-11',
      priority: 'High',
      location: 'Downtown Cafe',
      dependencies: ['Police permits', 'Security briefing'],
      users: ['Security Team x4', 'Production Assistant x2'],
      resources: ['Barriers', 'Walkie-talkies', 'Signage'],
      status: 'Planning'
    },
    {
      id: '4',
      title: 'Post-Production Data Backup',
      description: 'Backup all footage and audio files to multiple storage systems',
      time: '18:00',
      date: '2025-10-11',
      priority: 'High',
      location: 'Production Office',
      dependencies: ['Filming completion', 'Storage systems ready'],
      users: ['Data Manager', 'IT Support'],
      resources: ['External Drives x3', 'Cloud Storage', 'Backup Server'],
      status: 'Scheduled'
    },
    {
      id: '5',
      title: 'Catering and Craft Services',
      description: 'Provide meals and refreshments for cast and crew throughout the day',
      time: '06:30',
      date: '2025-10-12',
      priority: 'Medium',
      location: 'Base Camp',
      dependencies: ['Headcount confirmation', 'Dietary restrictions'],
      users: ['Catering Team x3', 'Service Staff x2'],
      resources: ['Mobile Kitchen', 'Tables', 'Food Supplies', 'Beverages'],
      status: 'Scheduled'
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#FF4444';
      case 'Medium': return '#FCCA00';
      case 'Low': return '#4CAF50';
      default: return '#7A7A7A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#4CAF50';
      case 'In Progress': return '#FCCA00';
      case 'Scheduled': return '#2196F3';
      case 'Planning': return '#7A7A7A';
      default: return '#7A7A7A';
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());

  return (
    <div className="h-full p-6" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#1F1F1F' }}>
          Tasks Schedule
        </h1>
        <button 
          className="px-4 py-2 font-bold rounded-md hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#FCCA00', color: '#1F1F1F' }}
        >
          + Add Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className="p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            style={{ 
              background: 'linear-gradient(135deg, #FCCA00 0%, #FFE066 100%)',
              border: '1px solid #7A7A7A'
            }}
          >
            <div className="flex items-start justify-between">
              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold" style={{ color: '#1F1F1F' }}>
                    {task.title}
                  </h3>
                  <span 
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{ backgroundColor: getPriorityColor(task.priority), color: '#FFFFFF' }}
                  >
                    {task.priority}
                  </span>
                  <span 
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{ backgroundColor: getStatusColor(task.status), color: '#FFFFFF' }}
                  >
                    {task.status}
                  </span>
                </div>

                <p className="text-sm mb-3" style={{ color: '#1F1F1F', opacity: 0.8 }}>
                  {task.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-semibold" style={{ color: '#1F1F1F' }}>Date & Time:</span>
                    <div style={{ color: '#1F1F1F', opacity: 0.7 }}>{task.date} at {task.time}</div>
                  </div>
                  
                  {task.location && (
                    <div>
                      <span className="font-semibold" style={{ color: '#1F1F1F' }}>Location:</span>
                      <div style={{ color: '#1F1F1F', opacity: 0.7 }}>{task.location}</div>
                    </div>
                  )}

                  {task.users && task.users.length > 0 && (
                    <div>
                      <span className="font-semibold" style={{ color: '#1F1F1F' }}>Assigned To:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.users.slice(0, 2).map((user, index) => (
                          <span 
                            key={index}
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: '#1F1F1F', color: '#FCCA00' }}
                          >
                            {user}
                          </span>
                        ))}
                        {task.users.length > 2 && (
                          <span 
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: '#7A7A7A', color: '#FFFFFF' }}
                          >
                            +{task.users.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {task.resources && task.resources.length > 0 && (
                    <div>
                      <span className="font-semibold" style={{ color: '#1F1F1F' }}>Resources:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.resources.slice(0, 2).map((resource, index) => (
                          <span 
                            key={index}
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: '#D0D0D0', color: '#1F1F1F' }}
                          >
                            {resource}
                          </span>
                        ))}
                        {task.resources.length > 2 && (
                          <span 
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: '#7A7A7A', color: '#FFFFFF' }}
                          >
                            +{task.resources.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {task.dependencies && task.dependencies.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold text-sm" style={{ color: '#1F1F1F' }}>Dependencies:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.dependencies.map((dep, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-1 rounded border"
                          style={{ 
                            backgroundColor: '#FFFFFF', 
                            color: '#1F1F1F',
                            borderColor: '#1F1F1F'
                          }}
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                  style={{ backgroundColor: '#FFFFFF', color: '#1F1F1F' }}
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

export default TasksScreen;