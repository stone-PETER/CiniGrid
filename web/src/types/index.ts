export interface User {
  id: string;
  username: string;
  token?: string;
  // Note: role removed - users now have roles per project
}

export interface Location {
  _id: string;
  id?: string; // Alias for _id for compatibility
  title: string;
  name?: string; // Backend may use 'name' instead of 'title'
  description: string;
  reason?: string; // Backend may use 'reason' for description
  address?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  region?: string;
  tags?: string[];
  rating?: number; // Gemini rating 0-10
  permits: Array<{
    name: string;
    required: boolean;
    notes?: string;
    estimatedCost?: string;
    processingTime?: string;
    authority?: string;
  }>;
  filmingDetails?: {
    accessibility?: string;
    parking?: string;
    powerAccess?: string;
    bestTimeToFilm?: string;
    crowdLevel?: string;
    weatherConsiderations?: string;
  };
  estimatedCost?: string;
  images?: string[];
  imageUrl?: string;
  photos?: Array<{
    url: string;
    width: number;
    height: number;
    photoReference: string;
  }>;
  confidence?: number;
  verified?: boolean; // Whether Google Places verified this location
  placeId?: string; // Google Place ID if verified
  mapsLink?: string; // Google Maps link if verified
  googleTypes?: string[];
  addedBy?: {
    _id: string;
    username: string;
    role: string;
  };
  notes?: Note[];
  approvals?: Approval[];
  status?: "suggestion" | "potential" | "finalized";
  createdAt: string;
  updatedAt: string;
  // For finalized locations
  finalizedBy?: {
    _id: string;
    username: string;
    role: string;
  };
  finalizedAt?: string;
}

export interface Suggestion {
  id?: string;
  title: string;
  name?: string; // Backend may use 'name' instead of 'title'
  description: string;
  reason?: string; // Backend may use 'reason' for description
  address?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  region?: string;
  tags: string[];
  rating?: number; // Gemini rating 0-10
  permits: Array<{
    name: string;
    required: boolean;
    notes?: string;
    estimatedCost?: string;
    processingTime?: string;
    authority?: string;
  }>;
  filmingDetails?: {
    accessibility?: string;
    parking?: string;
    powerAccess?: string;
    bestTimeToFilm?: string;
    crowdLevel?: string;
    weatherConsiderations?: string;
  };
  estimatedCost?: string;
  images?: string[];
  imageUrl?: string;
  photos?: Array<{
    url: string;
    width: number;
    height: number;
    photoReference: string;
  }>;
  confidence?: number;
  verified?: boolean; // NEW: Whether Google Places verified this location
  placeId?: string; // NEW: Google Place ID if verified
  mapsLink?: string; // NEW: Google Maps link if verified
  googleTypes?: string[];
  createdAt?: string;
}

export interface Note {
  _id: string;
  text: string;
  author?: {
    _id: string;
    username: string;
    role: string;
  };
  role: string;
  createdAt: string;
  updatedAt: string;
  locationId?: string;
}

export interface Approval {
  id: string;
  role: string;
  status: "approved" | "rejected";
  notes?: string;
  timestamp: string;
  locationId: string;
}

export interface SearchRequest {
  prompt: string;
  projectId?: string; // Optional for backward compatibility, but recommended
  forceRefresh?: boolean;
  maxResults?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AddLocationRequest {
  suggestionId?: string;
  manualData?: {
    title: string;
    description: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    region: string;
    tags?: string[];
    permits?: string[];
    images?: string[];
  };
}

export interface AddNoteRequest {
  text: string;
  locationId: string;
}

export interface AddApprovalRequest {
  status: "approved" | "rejected";
  notes?: string;
  locationId: string;
}

// ============================================
// PROJECT & INVITATION TYPES
// ============================================

export type ProjectRole =
  | "owner"
  | "producer"
  | "director"
  | "manager"
  | "scout"
  | "crew";

export interface Project {
  _id: string;
  name: string;
  description: string;
  ownerId: string;
  status: "active" | "archived" | "completed";
  userRoles?: ProjectRole[]; // Current user's roles in this project
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  _id: string;
  projectId: string;
  userId: {
    _id: string;
    username: string;
  };
  roles: ProjectRole[];
  joinedAt: string;
  invitedBy?: {
    _id: string;
    username: string;
  };
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  _id: string;
  projectId: {
    _id: string;
    name: string;
    description: string;
  };
  inviterId: {
    _id: string;
    username: string;
  };
  inviteeId: {
    _id: string;
    username: string;
  };
  roles: ProjectRole[];
  status: "pending" | "accepted" | "declined" | "cancelled";
  message: string;
  expiresAt: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  members?: Array<{
    username: string;
    roles: ProjectRole[];
  }>;
}

export interface InviteUserRequest {
  username: string;
  roles: ProjectRole[];
  message?: string;
}
