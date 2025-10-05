import React, { useState, useEffect } from 'react';
import { taskService } from '../services/productionService';
import { useProject } from '../context/ProjectContext';
import type { Task, CreateTaskRequest } from '../types';

const TasksScreen: React.FC = () => {
  const { currentProject } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const queueOptions = [
    'backlogged',
    'pre-production', 
    'ready',
    'ongoing',
    'in review',
    'completed'
  ];

  const taskTypes = [
    'equipment',
    'location',
    'talent',
    'crew',
    'post-production',
    'logistics',
    'permits',
    'other'
  ];

  const priorityLevels = ['Low', 'Medium', 'High'];

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, [currentProject?._id]); // Reload when project changes

  const loadTasks = async () => {
    if (!currentProject) {
      setTasks([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const response = await taskService.getTasks(params, currentProject._id);
      if (response.success) {
        setTasks(response.data);
      } else {
        setError('Failed to load tasks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Reload tasks when filters change
  useEffect(() => {
    loadTasks();
  }, [statusFilter, typeFilter, priorityFilter, currentProject?._id]); // Also reload when project changes

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    if (!currentProject) {
      setError('No project selected');
      return;
    }
    
    try {
      setError(null);
      const response = await taskService.createTask(taskData, currentProject._id);
      if (response.success) {
        await loadTasks(); // Reload tasks
        setShowCreateModal(false);
      } else {
        setError(response.message || 'Failed to create task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskData: Partial<CreateTaskRequest>) => {
    if (!selectedTask) return;
    
    try {
      setError(null);
      const response = await taskService.updateTask(selectedTask._id, taskData);
      if (response.success) {
        await loadTasks(); // Reload tasks
        setShowEditModal(false);
        setSelectedTask(null);
      } else {
        setError(response.message || 'Failed to update task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setError(null);
      const response = await taskService.deleteTask(taskId);
      if (response.success) {
        await loadTasks(); // Reload tasks
      } else {
        setError(response.message || 'Failed to delete task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      setError(null);
      const response = await taskService.updateTask(taskId, { status: newStatus as any });
      if (response.success) {
        await loadTasks(); // Reload tasks
      } else {
        setError(response.message || 'Failed to update task status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'backlogged': return 'bg-gray-100 text-gray-800';
      case 'pre-production': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'in review': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'equipment': return 'bg-blue-100 text-blue-800';
      case 'location': return 'bg-green-100 text-green-800';
      case 'talent': return 'bg-purple-100 text-purple-800';
      case 'crew': return 'bg-indigo-100 text-indigo-800';
      case 'post-production': return 'bg-orange-100 text-orange-800';
      case 'logistics': return 'bg-yellow-100 text-yellow-800';
      case 'permits': return 'bg-red-100 text-red-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks Management</h1>
          <p className="text-gray-600">Manage and track production tasks</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Task
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Statuses</option>
              {queueOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Types</option>
              {taskTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Priorities</option>
              {priorityLevels.map(priority => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading tasks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No tasks found</p>
              <p className="text-gray-400">Create your first task to get started</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task._id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowEditModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(task.type)}`}>
                      {task.type.charAt(0).toUpperCase() + task.type.slice(1).replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                  {task.dueDate && (
                    <p className="text-sm text-gray-600">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  {task.assignedTo && (
                    <p className="text-sm text-gray-600">
                      Assigned: {task.assignedTo.username}
                    </p>
                  )}
                </div>

                {/* Resources Section */}
                {task.resources && task.resources.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold text-sm text-gray-900">Resources:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.resources.map((resource, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800"
                        >
                          {resource}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users/Team Section */}
                {task.users && task.users.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold text-sm text-gray-900">Team Members:</span>
                    <div className="mt-1 space-y-1">
                      {task.users.map((user, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <span className="font-medium">{user.name}</span> - {user.role}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    {queueOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <TaskModal
          title="Create New Task"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
          queueOptions={queueOptions}
          taskTypes={taskTypes}
          priorityLevels={priorityLevels}
        />
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <TaskModal
          title="Edit Task"
          task={selectedTask}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTask(null);
          }}
          onSubmit={handleUpdateTask}
          queueOptions={queueOptions}
          taskTypes={taskTypes}
          priorityLevels={priorityLevels}
        />
      )}
    </div>
  );
};

// Task Modal Component
interface TaskModalProps {
  title: string;
  task?: Task;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskRequest) => void;
  queueOptions: string[];
  taskTypes: string[];
  priorityLevels: string[];
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  title, 
  task, 
  onClose, 
  onSubmit, 
  queueOptions, 
  taskTypes, 
  priorityLevels 
}) => {
  // Users state for dynamic form (similar to crew)
  const [users, setUsers] = useState<Array<{name: string; role: string}>>([]);

  // Helper functions for users management
  const addUser = () => {
    setUsers([...users, { name: '', role: '' }]);
  };

  const removeUser = (index: number) => {
    setUsers(users.filter((_, i) => i !== index));
  };

  const updateUser = (index: number, field: keyof typeof users[0], value: string) => {
    const updated = [...users];
    updated[index] = { ...updated[index], [field]: value };
    setUsers(updated);
  };

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'production',
    status: task?.status || 'backlogged',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    assignedTo: task?.assignedTo?.username || '',
    dependencies: task?.dependencies?.join(', ') || '',
    resources: task?.resources?.join(', ') || '',
    estimatedHours: task?.estimatedDuration?.toString() || '',
    notes: Array.isArray(task?.notes) ? '' : (task?.notes || '')
  });

  // Populate users when task changes
  React.useEffect(() => {
    if (task?.users) {
      setUsers(task.users.map(u => ({ name: u.name, role: u.role })));
    } else {
      setUsers([]);
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: CreateTaskRequest = {
      title: formData.title,
      description: formData.description,
      type: formData.type as any,
      status: formData.status as any,
      priority: formData.priority as any,
      ...(formData.dueDate && { dueDate: formData.dueDate }),
      assignedTo: formData.assignedTo || undefined,
      dependencies: formData.dependencies ? formData.dependencies.split(',').map((s: string) => s.trim()) : [],
      resources: formData.resources ? formData.resources.split(',').map((s: string) => s.trim()) : [],
      users: users.filter(u => u.name.trim() && u.role.trim()), // Only include filled entries
      ...(formData.estimatedHours && { estimatedDuration: parseInt(formData.estimatedHours) })
    };
    
    onSubmit(taskData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {taskTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {queueOptions.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {priorityLevels.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To (username)
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="john_doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-7 mb-1">
                Dependencies (comma-separated)
              </label>
              <input
                type="text"
                value={formData.dependencies}
                onChange={(e) => setFormData(prev => ({ ...prev, dependencies: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Equipment setup, Script approval"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resources (comma-separated)
              </label>
              <input
                type="text"
                value={formData.resources}
                onChange={(e) => setFormData(prev => ({ ...prev, resources: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Camera, Lighting kit"
              />
            </div>

            {/* Users Section */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Team Members</label>
                <button
                  type="button"
                  onClick={addUser}
                  className="px-3 py-1 text-xs font-bold rounded hover:opacity-80"
                  style={{ backgroundColor: '#FCCA00', color: '#1F1F1F' }}
                >
                  + Add Team Member
                </button>
              </div>
              <div className="space-y-2">
                {users.map((user, index) => (
                  <div key={index} className="grid grid-cols-11 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Name"
                      value={user.name}
                      onChange={(e) => updateUser(index, 'name', e.target.value)}
                      className="col-span-5 p-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={user.role}
                      onChange={(e) => updateUser(index, 'role', e.target.value)}
                      className="col-span-5 p-2 border border-gray-300 rounded text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeUser(index)}
                      className="col-span-1 p-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TasksScreen;