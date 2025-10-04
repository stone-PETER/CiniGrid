export interface User {
  id: string;
  username: string;
  role: 'producer' | 'director' | 'manager' | 'scout' | 'crew';
  token?: string;
}

export interface Location {
  _id: string;
  title: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  region: string;
  tags?: string[];
  permits?: Array<{
    name: string;
    required: boolean;
    notes?: string;
  }>;
  images?: string[];
  addedBy: {
    _id: string;
    username: string;
    role: string;
  };
  notes?: Array<{
    author: string;
    text: string;
    role: string;
    createdAt: string;
  }>;
  approvals?: Array<{
    userId: string;
    role: string;
    approved: boolean;
    comment?: string;
    createdAt: string;
  }>;
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
  title: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  region: string;
  tags: string[];
  permits: Array<{
    name: string;
    required: boolean;
    notes?: string;
  }>;
  images: string[];
  confidence: number;
  createdAt?: string;
}

export interface Note {
  id: string;
  content: string;
  author: string;
  role: string;
  timestamp: string;
  locationId: string;
}

export interface Approval {
  id: string;
  role: string;
  status: 'approved' | 'rejected';
  notes?: string;
  timestamp: string;
  locationId: string;
}

export interface SearchRequest {
  prompt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  role?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: 'producer' | 'director' | 'manager' | 'scout' | 'crew';
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
  approved: boolean;
  comment?: string;
  locationId: string;
}

export interface DirectAddRequest {
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
}