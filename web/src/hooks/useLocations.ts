import { useState, useCallback } from 'react';
import type { Location, Suggestion, Note, Approval, SearchRequest, AddLocationRequest, AddNoteRequest, AddApprovalRequest } from '../types';
import { locationScouting } from '../services/locationService';

export const useLocations = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [potentialLocations, setPotentialLocations] = useState<Location[]>([]);
  const [finalizedLocations, setFinalizedLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationNotes, setLocationNotes] = useState<Note[]>([]);
  const [locationApprovals, setLocationApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search AI for suggestions
  const searchAi = useCallback(async (searchRequest: SearchRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.ai.searchLocations(searchRequest);
      if (response.success) {
        setSuggestions(response.data);
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add potential location from suggestion
  const addPotential = useCallback(async (suggestion: Suggestion) => {
    setLoading(true);
    setError(null);
    try {
      // Convert permits to strings for backend compatibility
      const permitStrings = suggestion.permits?.map(permit => 
        typeof permit === 'string' ? permit : permit.name
      ) || [];
      
      // For now, send as manualData since suggestions don't have persistent IDs
      const manualData = {
        title: suggestion.title,
        description: suggestion.description,
        coordinates: suggestion.coordinates,
        region: suggestion.reasoning || '',
        tags: [],
        permits: permitStrings,
        images: suggestion.imageUrl ? [suggestion.imageUrl] : []
      };
      
      const response = await locationScouting.locations.addPotentialLocation({ manualData });
      if (response.success) {
        setPotentialLocations(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to add potential location');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get potential locations list
  const getPotentialList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.locations.getPotentialLocations();
      if (response.success) {
        setPotentialLocations(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch potential locations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get potential location detail
  const getPotentialDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.locations.getPotentialLocationDetail(id);
      if (response.success) {
        setSelectedLocation(response.data);
        // Also fetch notes and approvals
        await Promise.all([
          fetchLocationNotes(id),
          fetchLocationApprovals(id),
        ]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch location details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch location notes
  const fetchLocationNotes = useCallback(async (locationId: string) => {
    try {
      const response = await locationScouting.notes.getNotes(locationId);
      if (response.success) {
        setLocationNotes(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  }, []);

  // Fetch location approvals
  const fetchLocationApprovals = useCallback(async (locationId: string) => {
    try {
      const response = await locationScouting.approvals.getApprovals(locationId);
      if (response.success) {
        setLocationApprovals(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    }
  }, []);

  // Add note to location
  const addNote = useCallback(async (noteData: AddNoteRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.notes.addNote(noteData);
      if (response.success) {
        setLocationNotes(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to add note');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add approval to location
  const addApproval = useCallback(async (approvalData: AddApprovalRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.approvals.addApproval(approvalData);
      if (response.success) {
        setLocationApprovals(prev => {
          // Replace existing approval from same role or add new one
          const filtered = prev.filter(approval => approval.role !== response.data.role);
          return [...filtered, response.data];
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to add approval');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Finalize location
  const finalizeLocation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.locations.finalizeLocation(id);
      if (response.success) {
        // Remove from potential and add to finalized
        setPotentialLocations(prev => prev.filter(loc => loc.id !== id));
        setFinalizedLocations(prev => [...prev, response.data]);
        setSelectedLocation(null); // Clear selection
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to finalize location');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get finalized locations
  const getFinalized = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.locations.getFinalizedLocations();
      if (response.success) {
        setFinalizedLocations(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch finalized locations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Direct add location
  const directAdd = useCallback(async (locationData: AddLocationRequest, status: 'potential' | 'finalized' = 'potential') => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.locations.directAddLocation(locationData, status);
      if (response.success) {
        if (status === 'potential') {
          setPotentialLocations(prev => [...prev, response.data]);
        } else {
          setFinalizedLocations(prev => [...prev, response.data]);
        }
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to add location');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    suggestions,
    potentialLocations,
    finalizedLocations,
    selectedLocation,
    locationNotes,
    locationApprovals,
    loading,
    error,
    
    // Actions
    searchAi,
    addPotential,
    getPotentialList,
    getPotentialDetail,
    addNote,
    addApproval,
    finalizeLocation,
    getFinalized,
    directAdd,
    
    // Setters for direct manipulation if needed
    setSelectedLocation,
    setError,
  };
};