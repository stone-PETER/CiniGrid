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
  AddApprovalRequest 
} from '../types';

// Mock data
const mockUsers: User[] = [
  { id: '1', username: 'scout1', role: 'scout', token: 'mock-token-scout' },
  { id: '2', username: 'manager1', role: 'manager', token: 'mock-token-manager' },
  { id: '3', username: 'admin1', role: 'producer', token: 'mock-token-admin' },
];

const mockSuggestions: Suggestion[] = [
  {
    id: 'sugg-1',
    title: 'Modern Downtown Office Complex',
    description: 'A sleek 20-story glass building in the heart of downtown with panoramic city views, modern amenities, and excellent public transport access.',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    permits: ['Filming Permit', 'Parking Permit', 'Sound Permit'],
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500',
    reasoning: 'Matches requirements for modern glass facade and urban setting'
  },
  {
    id: 'sugg-2',
    title: 'Historic Warehouse District',
    description: 'Industrial converted warehouse space with exposed brick walls, high ceilings, and large windows. Perfect for creative projects.',
    coordinates: { lat: 40.7505, lng: -73.9934 },
    permits: ['Filming Permit', 'Equipment Permit'],
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500',
    reasoning: 'Provides industrial aesthetic with character and flexibility'
  },
  {
    id: 'sugg-3',
    title: 'Luxury Hotel Rooftop',
    description: 'Stunning rooftop location with city skyline views, upscale furnishings, and professional lighting setup available.',
    coordinates: { lat: 40.7614, lng: -73.9776 },
    permits: ['Filming Permit', 'Rooftop Access Permit', 'Sound Permit'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
    reasoning: 'Offers premium location with excellent views and lighting'
  }
];

let mockPotentialLocations: Location[] = [
  {
    id: 'pot-1',
    title: 'Central Park West Apartment',
    description: 'Elegant pre-war apartment with park views and classic NYC charm.',
    coordinates: { lat: 40.7829, lng: -73.9654 },
    permits: ['Filming Permit'],
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
    status: 'potential',
    createdAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-10-01T10:00:00Z'
  },
  {
    id: 'pot-2',
    title: 'Brooklyn Bridge View Cafe',
    description: 'Charming waterfront cafe with iconic bridge views and cozy interior.',
    coordinates: { lat: 40.7041, lng: -73.9969 },
    permits: ['Filming Permit', 'Food Service Permit'],
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500',
    status: 'potential',
    createdAt: '2024-10-02T14:30:00Z',
    updatedAt: '2024-10-02T14:30:00Z'
  }
];

let mockFinalizedLocations: Location[] = [
  {
    id: 'fin-1',
    title: 'Times Square Studio',
    description: 'Professional studio space in the heart of Times Square with controlled lighting.',
    coordinates: { lat: 40.7580, lng: -73.9855 },
    permits: ['Filming Permit', 'Sound Permit', 'Equipment Permit'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
    status: 'finalized',
    createdAt: '2024-09-28T09:00:00Z',
    updatedAt: '2024-10-03T16:20:00Z'
  }
];

let mockNotes: Note[] = [
  {
    id: 'note-1',
    content: 'Great natural lighting in the afternoon. Would work well for dialogue scenes.',
    author: 'scout1',
    role: 'scout',
    timestamp: '2024-10-01T11:30:00Z',
    locationId: 'pot-1'
  },
  {
    id: 'note-2',
    content: 'Parking might be an issue during rush hours. Consider weekend shoots.',
    author: 'manager1',
    role: 'manager',
    timestamp: '2024-10-01T15:45:00Z',
    locationId: 'pot-1'
  },
  {
    id: 'note-3',
    content: 'Owner is very cooperative and familiar with film productions.',
    author: 'scout1',
    role: 'scout',
    timestamp: '2024-10-02T16:00:00Z',
    locationId: 'pot-2'
  }
];

let mockApprovals: Approval[] = [
  {
    id: 'app-1',
    role: 'manager',
    status: 'approved',
    notes: 'Good location, reasonable cost',
    timestamp: '2024-10-01T17:00:00Z',
    locationId: 'pot-1'
  },
  {
    id: 'app-2',
    role: 'admin',
    status: 'approved',
    timestamp: '2024-10-01T18:30:00Z',
    locationId: 'pot-1'
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const mockApiService = {
  // Authentication
  auth: {
    login: async (credentials: LoginRequest): Promise<ApiResponse<User>> => {
      await delay(500);
      
      const user = mockUsers.find(u => 
        u.username === credentials.username && 
        u.role === credentials.role
      );
      
      if (user) {
        return {
          success: true,
          data: { ...user }
        };
      } else {
        throw new Error('Invalid credentials');
      }
    },

    register: async (userData: RegisterRequest): Promise<ApiResponse<User>> => {
      await delay(500);
      
      const existingUser = mockUsers.find(u => u.username === userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const newUser: User = {
        id: generateId(),
        username: userData.username,
        role: userData.role,
        token: `mock-token-${userData.username}`
      };

      mockUsers.push(newUser);
      
      return {
        success: true,
        data: newUser
      };
    },

    logout: async (): Promise<void> => {
      await delay(200);
      // Mock logout - no action needed
    }
  },

  // AI Search
  ai: {
    searchLocations: async (_searchRequest: SearchRequest): Promise<ApiResponse<Suggestion[]>> => {
      await delay(1000); // Simulate AI processing time
      
      // Return mock suggestions - in real app, this would process the prompt
      return {
        success: true,
        data: mockSuggestions
      };
    }
  },

  // Locations
  locations: {
    getPotentialLocations: async (): Promise<ApiResponse<Location[]>> => {
      await delay(300);
      return {
        success: true,
        data: [...mockPotentialLocations]
      };
    },

    getPotentialLocationDetail: async (id: string): Promise<ApiResponse<Location>> => {
      await delay(200);
      const location = mockPotentialLocations.find(l => l.id === id);
      
      if (!location) {
        throw new Error('Location not found');
      }

      return {
        success: true,
        data: location
      };
    },

    addPotentialLocation: async (location: AddLocationRequest): Promise<ApiResponse<Location>> => {
      await delay(400);
      
      const newLocation: Location = {
        id: generateId(),
        title: location.title,
        description: location.description,
        coordinates: location.coordinates,
        permits: location.permits,
        imageUrl: location.imageUrl,
        status: 'potential',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(location.suggestionId && { suggestionId: location.suggestionId }),
        ...(location.manualData && { manualData: location.manualData })
      };

      mockPotentialLocations.push(newLocation);

      return {
        success: true,
        data: newLocation
      };
    },

    getFinalizedLocations: async (): Promise<ApiResponse<Location[]>> => {
      await delay(300);
      return {
        success: true,
        data: [...mockFinalizedLocations]
      };
    },

    finalizeLocation: async (id: string): Promise<ApiResponse<Location>> => {
      await delay(500);
      
      const locationIndex = mockPotentialLocations.findIndex(l => l.id === id);
      if (locationIndex === -1) {
        throw new Error('Location not found');
      }

      const location = mockPotentialLocations[locationIndex];
      const finalizedLocation: Location = {
        ...location,
        status: 'finalized',
        updatedAt: new Date().toISOString()
      };

      // Move from potential to finalized
      mockPotentialLocations.splice(locationIndex, 1);
      mockFinalizedLocations.push(finalizedLocation);

      return {
        success: true,
        data: finalizedLocation
      };
    },

    directAddLocation: async (
      location: AddLocationRequest, 
      status: 'potential' | 'finalized' = 'potential'
    ): Promise<ApiResponse<Location>> => {
      await delay(400);
      
      const newLocation: Location = {
        id: generateId(),
        title: location.title,
        description: location.description,
        coordinates: location.coordinates,
        permits: location.permits,
        imageUrl: location.imageUrl,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(location.suggestionId && { suggestionId: location.suggestionId }),
        ...(location.manualData && { manualData: location.manualData })
      };

      if (status === 'potential') {
        mockPotentialLocations.push(newLocation);
      } else {
        mockFinalizedLocations.push(newLocation);
      }

      return {
        success: true,
        data: newLocation
      };
    }
  },

  // Notes
  notes: {
    getNotes: async (locationId: string): Promise<ApiResponse<Note[]>> => {
      await delay(200);
      const notes = mockNotes.filter(n => n.locationId === locationId);
      return {
        success: true,
        data: notes
      };
    },

    addNote: async (noteData: AddNoteRequest): Promise<ApiResponse<Note>> => {
      await delay(300);
      
      const newNote: Note = {
        id: generateId(),
        ...noteData,
        author: 'current-user', // In real app, this would come from auth
        role: 'scout', // In real app, this would come from auth
        timestamp: new Date().toISOString()
      };

      mockNotes.push(newNote);

      return {
        success: true,
        data: newNote
      };
    }
  },

  // Approvals
  approvals: {
    getApprovals: async (locationId: string): Promise<ApiResponse<Approval[]>> => {
      await delay(200);
      const approvals = mockApprovals.filter(a => a.locationId === locationId);
      return {
        success: true,
        data: approvals
      };
    },

    addApproval: async (approvalData: AddApprovalRequest): Promise<ApiResponse<Approval>> => {
      await delay(300);
      
      const newApproval: Approval = {
        id: generateId(),
        ...approvalData,
        role: 'manager', // In real app, this would come from auth
        timestamp: new Date().toISOString()
      };

      // Remove existing approval from same role for this location
      const existingIndex = mockApprovals.findIndex(
        a => a.locationId === approvalData.locationId && a.role === newApproval.role
      );
      
      if (existingIndex !== -1) {
        mockApprovals.splice(existingIndex, 1);
      }

      mockApprovals.push(newApproval);

      return {
        success: true,
        data: newApproval
      };
    }
  }
};