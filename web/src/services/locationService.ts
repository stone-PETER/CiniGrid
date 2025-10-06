import api from "./api";
import type {
  User,
  Location,
  Suggestion,
  Note,
  Approval,
  SearchRequest,
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AddLocationRequest,
  AddNoteRequest,
  AddApprovalRequest,
} from "../types";

// Check if we should use mock API (when backend is not available)

// Helper function to handle API calls
const apiCall = async <T>(
  realApiCall: () => Promise<{ data: ApiResponse<T> }>
): Promise<ApiResponse<T>> => {
  const response = await realApiCall();
  return response.data;
};

// Authentication endpoints
export const authService = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<User>> => {
    return apiCall(() => api.post("/auth/login", credentials));
  },

  register: async (userData: RegisterRequest): Promise<ApiResponse<User>> => {
    return apiCall(() => api.post("/auth/register", userData));
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Logout API call failed:", error);
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },
};

// AI search endpoints
export const aiService = {
  searchLocations: async (
    searchRequest: SearchRequest
  ): Promise<ApiResponse<Suggestion[]>> => {
    return apiCall(async () => {
      // AI operations need extra time: Google Places API + Gemini ranking
      const response = await api.post("/ai/search", searchRequest, {
        timeout: 45000, // 45 seconds for AI operations
      });
      // Backend returns { success: true, data: { suggestions: [], count: 3 } }
      // Frontend expects { success: true, data: [] }
      return {
        data: {
          success: response.data.success,
          data: response.data.data.suggestions || [],
          message: response.data.message,
        },
      };
    });
  },
};

// Location management endpoints
export const locationService = {
  // Potential locations
  getPotentialLocations: async (
    projectId?: string
  ): Promise<ApiResponse<Location[]>> => {
    return apiCall(async () => {
      const params = projectId ? { projectId } : {};
      const response = await api.get("/locations/potential", { params });
      // Backend returns { success: true, data: { locations: [], count: 0 } }
      // Frontend expects { success: true, data: [] }
      return {
        data: {
          success: response.data.success,
          data: response.data.data.locations || [],
          message: response.data.message,
        },
      };
    });
  },

  getPotentialLocationDetail: async (
    id: string
  ): Promise<ApiResponse<Location>> => {
    return apiCall(async () => {
      const response = await api.get(`/locations/potential/${id}`);
      // Backend returns { success: true, data: { location: {...} } }
      // Frontend expects { success: true, data: {...} }
      return {
        data: {
          success: response.data.success,
          data: response.data.data?.location || response.data.data,
          message: response.data.message,
        },
      };
    });
  },

  addPotentialLocation: async (
    locationData: AddLocationRequest
  ): Promise<ApiResponse<Location>> => {
    return apiCall(async () => {
      const response = await api.post("/locations/potential", locationData);
      // Backend returns { success: true, data: { location: {...} } }
      // Frontend expects { success: true, data: {...} }
      return {
        data: {
          success: response.data.success,
          data: response.data.data?.location || response.data.data,
          message: response.data.message,
        },
      };
    });
  },

  addPotentialFromSuggestion: async (
    suggestion: Suggestion,
    projectId?: string
  ): Promise<ApiResponse<Location>> => {
    return apiCall(async () => {
      const response = await api.post("/locations/potential", {
        suggestionData: suggestion,
        projectId,
      });
      // Backend returns { success: true, data: { location: {...} } }
      // Frontend expects { success: true, data: {...} }
      return {
        data: {
          success: response.data.success,
          data: response.data.data?.location || response.data.data,
          message: response.data.message,
        },
      };
    });
  },

  // Finalized locations
  getFinalizedLocations: async (
    projectId?: string
  ): Promise<ApiResponse<Location[]>> => {
    console.log(
      "🔍 [LocationService] getFinalizedLocations called with projectId:",
      projectId
    );
    console.log(
      "🔍 [LocationService] About to make API call to /locations/finalized"
    );
    return apiCall(async () => {
      console.log(
        "🔍 [LocationService] Making API GET request to /locations/finalized"
      );
      const params = projectId ? { projectId } : {};
      console.log("🔍 [LocationService] API params:", params);
      const response = await api.get("/locations/finalized", { params });
      console.log("🔍 [LocationService] API response received:", response.data);
      // Backend returns { success: true, data: { locations: [], count: 0 } }
      // Frontend expects { success: true, data: [] }
      return {
        data: {
          success: response.data.success,
          data: response.data.data.locations || [],
          message: response.data.message,
        },
      };
    });
  },

  finalizeLocation: async (id: string): Promise<ApiResponse<Location>> => {
    return apiCall(async () => {
      const response = await api.post(`/locations/potential/${id}/finalize`);
      // Backend returns { success: true, data: { location: {...} } }
      // Frontend expects { success: true, data: {...} }
      return {
        data: {
          success: response.data.success,
          data: response.data.data?.location || response.data.data,
          message: response.data.message,
        },
      };
    });
  },

  // Direct add
  directAddLocation: async (
    location: AddLocationRequest
  ): Promise<ApiResponse<Location>> => {
    return apiCall(() => api.post("/locations/direct-add/finalized", location));
  },
};

// Notes endpoints
export const notesService = {
  getNotes: async (locationId: string): Promise<ApiResponse<Note[]>> => {
    return apiCall(() => api.get(`/locations/potential/${locationId}/notes`));
  },

  addNote: async (noteData: AddNoteRequest): Promise<ApiResponse<Note>> => {
    const response = await apiCall(() =>
      api.post(`/locations/potential/${noteData.locationId}/notes`, {
        text: noteData.text,
      })
    );

    // Backend returns { note: {...}, location: {...} }, extract just the note
    if (
      response.success &&
      response.data &&
      typeof response.data === "object" &&
      "note" in response.data
    ) {
      const noteData = response.data as { note: Note };
      return {
        success: true,
        data: noteData.note,
      };
    }

    return response as ApiResponse<Note>;
  },
};

// Approvals endpoints
export const approvalsService = {
  getApprovals: async (
    locationId: string
  ): Promise<ApiResponse<Approval[]>> => {
    return apiCall(() =>
      api.get(`/locations/potential/${locationId}/approvals`)
    );
  },

  addApproval: async (
    approvalData: AddApprovalRequest
  ): Promise<ApiResponse<Approval>> => {
    return apiCall(() =>
      api.post(`/locations/potential/${approvalData.locationId}/approvals`, {
        approved: approvalData.status === "approved",
        comment: approvalData.notes,
      })
    );
  },
};

// Combined service for easier imports
export const locationScouting = {
  auth: authService,
  ai: aiService,
  locations: locationService,
  notes: notesService,
  approvals: approvalsService,
};

export default locationScouting;
