import { useState, useCallback } from "react";
import type {
  Location,
  Suggestion,
  Note,
  Approval,
  SearchRequest,
  AddLocationRequest,
  AddNoteRequest,
  AddApprovalRequest,
  DirectAddRequest,
} from "../types";
import { locationScouting } from "../services/locationService";

export const useLocations = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [potentialLocations, setPotentialLocations] = useState<Location[]>([]);
  const [finalizedLocations, setFinalizedLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
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
        throw new Error(response.message || "Search failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add potential location from AI suggestion using full suggestion object
  const addPotentialFromSuggestion = useCallback(
    async (suggestion: any, projectId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response =
          await locationScouting.locations.addPotentialFromSuggestion(
            suggestion,
            projectId
          );
        if (response.success) {
          setPotentialLocations((prev) => [...prev, response.data]);
          return response.data;
        } else {
          throw new Error(
            response.message || "Failed to add potential location"
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Add potential location with manual data
  const addPotentialLocation = useCallback(
    async (locationData: AddLocationRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await locationScouting.locations.addPotentialLocation(
          locationData
        );
        if (response.success) {
          setPotentialLocations((prev) => [...prev, response.data]);
          return response.data;
        } else {
          throw new Error(
            response.message || "Failed to add potential location"
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get potential locations list
  const getPotentialList = useCallback(async (projectId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.locations.getPotentialLocations(
        projectId
      );
      if (response.success) {
        setPotentialLocations(response.data);
      } else {
        throw new Error(
          response.message || "Failed to fetch potential locations"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Get potential location detail
  const getPotentialDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response =
        await locationScouting.locations.getPotentialLocationDetail(id);
      if (response.success) {
        // Extract location from response.data.location if it's wrapped
        const locationData = (response.data as any).location || response.data;
        console.log("📍 Setting selected location:", locationData);
        setSelectedLocation(locationData);

        // Extract and store notes if they exist in the location data
        if (locationData.notes && Array.isArray(locationData.notes)) {
          setLocationNotes(locationData.notes);
        } else {
          setLocationNotes([]);
        }

        // Extract and store approvals if they exist in the location data
        if (locationData.approvals && Array.isArray(locationData.approvals)) {
          setLocationApprovals(locationData.approvals);
        } else {
          setLocationApprovals([]);
        }

        return locationData;
      } else {
        throw new Error(response.message || "Failed to fetch location details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Get finalized locations list
  const getFinalizedList = useCallback(async (projectId?: string) => {
    console.log('🔄 getFinalizedList called with projectId:', projectId);
    setLoading(true);
    setError(null);
    // Clear existing data to avoid showing stale results
    setFinalizedLocations([]);
    
    try {
      const response = await locationScouting.locations.getFinalizedLocations(
        projectId
      );
      console.log('📍 Finalized locations response:', response);
      if (response.success) {
        console.log('✅ Setting finalized locations:', response.data.length, 'items');
        setFinalizedLocations(response.data);
      } else {
        throw new Error(
          response.message || "Failed to fetch finalized locations"
        );
      }
    } catch (err) {
      console.error('❌ Error fetching finalized locations:', err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setFinalizedLocations([]); // Ensure we clear on error too
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
        // Remove from potential, add to finalized
        setPotentialLocations((prev) => prev.filter((loc) => loc._id !== id));
        setFinalizedLocations((prev) => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to finalize location");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Direct add to potential
  const directAddToPotential = useCallback(
    async (locationData: DirectAddRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await locationScouting.locations.directAddToPotential(
          locationData
        );
        if (response.success) {
          setPotentialLocations((prev) => [...prev, response.data]);
          return response.data;
        } else {
          throw new Error(response.message || "Failed to add location");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Direct add to finalized
  const directAddToFinalized = useCallback(
    async (locationData: DirectAddRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await locationScouting.locations.directAddToFinalized(
          locationData
        );
        if (response.success) {
          setFinalizedLocations((prev) => [...prev, response.data]);
          return response.data;
        } else {
          throw new Error(response.message || "Failed to add location");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get notes for location
  const getNotes = useCallback(async (locationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.notes.getNotes(locationId);
      if (response.success) {
        setLocationNotes(response.data);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch notes");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add note to location
  const addNote = useCallback(async (noteData: AddNoteRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.notes.addNote(noteData);
      if (response.success) {
        setLocationNotes((prev) => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to add note");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add note to finalized location
  const addFinalizedNote = useCallback(async (noteData: AddNoteRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.notes.addFinalizedNote(noteData);
      if (response.success) {
        setLocationNotes((prev) => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to add note");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get approvals for location
  const getApprovals = useCallback(async (locationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.approvals.getApprovals(
        locationId
      );
      if (response.success) {
        setLocationApprovals(response.data);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch approvals");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add approval to location
  const addApproval = useCallback(async (approvalData: AddApprovalRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationScouting.approvals.addApproval(
        approvalData
      );
      if (response.success) {
        setLocationApprovals((prev) => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to add approval");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
    addPotentialFromSuggestion,
    addPotentialLocation,
    getPotentialList,
    getPotentialDetail,
    getFinalizedList,
    finalizeLocation,
    directAddToPotential,
    directAddToFinalized,
    getNotes,
    addNote,
    addFinalizedNote,
    getApprovals,
    addApproval,
    setSelectedLocation,
    setError,
  };
};
