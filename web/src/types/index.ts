export interface User {
  id: string;
  username: string;
  role: "producer" | "director" | "manager" | "scout" | "crew";
  token?: string;
}

export interface Location {
  _id: string;
  id?: string; // Alias for _id for compatibility
  title: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  permits: (string | { name: string; required?: boolean; notes?: string })[];
  imageUrl?: string;
  images?: string[]; // Array of image URLs
  status: "suggestion" | "potential" | "finalized";
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
  status: "approved" | "rejected";
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
  role: "producer" | "director" | "manager" | "scout" | "crew";
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
