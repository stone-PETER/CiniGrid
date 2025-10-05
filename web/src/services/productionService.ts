import type { 
  Scene, 
  Task, 
  CreateSceneRequest, 
  CreateTaskRequest, 
  AddNoteRequest,
  BoardData 
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Scene API functions
export const sceneService = {
  // Get all scenes
  async getScenes(params: Record<string, string> = {}): Promise<{ success: boolean; data: Scene[]; count: number }> {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/scenes?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch scenes: ${response.statusText}`);
    }
    return response.json();
  },

  // Get scene by ID
  async getSceneById(id: string): Promise<{ success: boolean; data: Scene }> {
    const response = await fetch(`${API_BASE_URL}/scenes/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch scene: ${response.statusText}`);
    }
    return response.json();
  },

  // Create new scene
  async createScene(sceneData: CreateSceneRequest): Promise<{ success: boolean; message: string; data: Scene }> {
    const response = await fetch(`${API_BASE_URL}/scenes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(sceneData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create scene: ${response.statusText}`);
    }
    return response.json();
  },

  // Update scene
  async updateScene(id: string, sceneData: Partial<CreateSceneRequest>): Promise<{ success: boolean; message: string; data: Scene }> {
    const response = await fetch(`${API_BASE_URL}/scenes/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(sceneData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update scene: ${response.statusText}`);
    }
    return response.json();
  },

  // Delete scene
  async deleteScene(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/scenes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete scene: ${response.statusText}`);
    }
    return response.json();
  },

  // Get scenes by status
  async getScenesByStatus(status: string, params: Record<string, string> = {}): Promise<{ success: boolean; data: Scene[]; count: number }> {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(
      `${API_BASE_URL}/scenes/status/${status}?${searchParams}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch scenes by status: ${response.statusText}`);
    }
    return response.json();
  },

  // Update scene status
  async updateSceneStatus(id: string, status: string): Promise<{ success: boolean; message: string; data: Scene }> {
    const response = await fetch(`${API_BASE_URL}/scenes/${id}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update scene status: ${response.statusText}`);
    }
    return response.json();
  },

  // Add note to scene
  async addSceneNote(id: string, noteData: AddNoteRequest): Promise<{ success: boolean; message: string; data: Scene }> {
    const response = await fetch(`${API_BASE_URL}/scenes/${id}/notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData),
    });
    if (!response.ok) {
      throw new Error(`Failed to add scene note: ${response.statusText}`);
    }
    return response.json();
  },
};

// Task API functions
export const taskService = {
  // Get all tasks
  async getTasks(params: Record<string, string> = {}): Promise<{ success: boolean; data: Task[]; count: number }> {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/tasks?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    return response.json();
  },

  // Get task by ID
  async getTaskById(id: string): Promise<{ success: boolean; data: Task }> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch task: ${response.statusText}`);
    }
    return response.json();
  },

  // Create new task
  async createTask(taskData: CreateTaskRequest): Promise<{ success: boolean; message: string; data: Task }> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }
    return response.json();
  },

  // Update task
  async updateTask(id: string, taskData: Partial<CreateTaskRequest>): Promise<{ success: boolean; message: string; data: Task }> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }
    return response.json();
  },

  // Delete task
  async deleteTask(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }
    return response.json();
  },

  // Get tasks by status
  async getTasksByStatus(status: string, params: Record<string, string> = {}): Promise<{ success: boolean; data: Task[]; count: number }> {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(
      `${API_BASE_URL}/tasks/status/${status}?${searchParams}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks by status: ${response.statusText}`);
    }
    return response.json();
  },

  // Update task status
  async updateTaskStatus(id: string, status: string): Promise<{ success: boolean; message: string; data: Task }> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update task status: ${response.statusText}`);
    }
    return response.json();
  },

  // Add note to task
  async addTaskNote(id: string, noteData: AddNoteRequest): Promise<{ success: boolean; message: string; data: Task }> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData),
    });
    if (!response.ok) {
      throw new Error(`Failed to add task note: ${response.statusText}`);
    }
    return response.json();
  },

  // Update checklist item
  async updateChecklistItem(taskId: string, itemId: string, completed: boolean): Promise<{ success: boolean; message: string; data: Task }> {
    const response = await fetch(
      `${API_BASE_URL}/tasks/${taskId}/checklist/${itemId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ completed }),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to update checklist item: ${response.statusText}`);
    }
    return response.json();
  },

  // Approve task
  async approveTask(id: string, approvalNotes: string = ""): Promise<{ success: boolean; message: string; data: Task }> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ approvalNotes }),
    });
    if (!response.ok) {
      throw new Error(`Failed to approve task: ${response.statusText}`);
    }
    return response.json();
  },
};

// Combined service for getting board data (scenes and tasks by status)
export const boardService = {
  // Get all items (scenes and tasks) organized by status
  async getBoardData(params: Record<string, string> = {}): Promise<{
    success: boolean;
    data: BoardData;
    totalScenes: number;
    totalTasks: number;
  }> {
    try {
      const [scenesResponse, tasksResponse] = await Promise.all([
        sceneService.getScenes(params),
        taskService.getTasks(params),
      ]);

      // Organize by status
      const statuses = ["backlogged", "pre-production", "ready", "ongoing", "in review", "completed"];
      const boardData: BoardData = {};

      statuses.forEach(status => {
        boardData[status] = {
          scenes: scenesResponse.data?.filter((scene: Scene) => scene.status === status) || [],
          tasks: tasksResponse.data?.filter((task: Task) => task.status === status) || [],
        };
      });

      return {
        success: true,
        data: boardData,
        totalScenes: scenesResponse.data?.length || 0,
        totalTasks: tasksResponse.data?.length || 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch board data: ${(error as Error).message}`);
    }
  },

  // Move item between statuses
  async moveItem(itemId: string, itemType: 'scene' | 'task', newStatus: string): Promise<{ success: boolean; message: string; data: Scene | Task }> {
    try {
      if (itemType === "scene") {
        return await sceneService.updateSceneStatus(itemId, newStatus);
      } else if (itemType === "task") {
        return await taskService.updateTaskStatus(itemId, newStatus);
      } else {
        throw new Error("Invalid item type");
      }
    } catch (error) {
      throw new Error(`Failed to move item: ${(error as Error).message}`);
    }
  },
};

export default {
  sceneService,
  taskService,
  boardService,
};