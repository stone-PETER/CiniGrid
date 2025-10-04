import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../hooks/useLocations';
import SearchBox from '../components/SearchBox';
import SuggestionsList from '../components/SuggestionsList';
import PotentialLocationsList from '../components/PotentialLocationsList';
import PotentialDetailPanel from '../components/PotentialDetailPanel';
import DirectAddForm from '../components/DirectAddForm';
import Toast from '../components/Toast';
import type { Location, Suggestion } from '../types';

const LocationsScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    suggestions,
    potentialLocations,
    finalizedLocations,
    locationNotes,
    locationApprovals,
    loading,
    error,
    searchAi,
    addPotentialFromSuggestion,
    getPotentialList,
    getPotentialDetail,
    addNote,
    addApproval,
    finalizeLocation,
    directAddToPotential,
  } = useLocations();

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showDirectAddForm, setShowDirectAddForm] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });

  useEffect(() => {
    getPotentialList();
  }, [getPotentialList]);

  const handleSearch = async (prompt: string) => {
    await searchAi({ prompt });
  };

  const handleAddToPotential = async (suggestion: Suggestion, suggestionIndex: number) => {
    try {
      await addPotentialFromSuggestion(suggestion);
      setToast({ message: 'Location added to potential list!', type: 'success', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } catch (err) {
      console.error('Failed to add to potential:', err);
      setToast({ message: 'Failed to add location', type: 'error', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }
  };

  const handleSelectLocation = async (location: Location) => {
    console.log('Selecting location:', location);
    try {
      setSelectedLocation(location);
      setShowLocationModal(true);
      if (location._id) {
        await getPotentialDetail(location._id);
      }
    } catch (err) {
      console.error('Failed to get location details:', err);
    }
  };

  const handleAddNote = async (content: string) => {
    try {
      if (selectedLocation?._id) {
        await addNote({ text: content, locationId: selectedLocation._id });
        setToast({ message: 'Note added successfully!', type: 'success', visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
      setToast({ message: 'Failed to add note', type: 'error', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }
  };

  const handleAddApproval = async (status: 'approved' | 'rejected', notes?: string) => {
    try {
      if (selectedLocation?._id) {
        await addApproval({ status, notes, locationId: selectedLocation._id });
        setToast({ message: 'Approval submitted successfully!', type: 'success', visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
      }
    } catch (err) {
      console.error('Failed to add approval:', err);
      setToast({ message: 'Failed to submit approval', type: 'error', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }
  };

  const handleFinalizeLocation = async () => {
    try {
      if (selectedLocation?._id) {
        await finalizeLocation(selectedLocation._id);
        setShowLocationModal(false);
        setSelectedLocation(null);
        setToast({ message: 'Location finalized successfully!', type: 'success', visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
      }
    } catch (err) {
      console.error('Failed to finalize location:', err);
      setToast({ message: 'Failed to finalize location', type: 'error', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }
  };

  const handleDirectAdd = async (directAddData: any) => {
    try {
      if (directAddData.status === 'potential') {
        await directAddToPotential(directAddData);
        setToast({ message: 'Location added to potential list!', type: 'success', visible: true });
      }
      setShowDirectAddForm(false);
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } catch (err) {
      console.error('Failed to add location:', err);
      setToast({ message: 'Failed to add location', type: 'error', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }
  };

  return (
    <div className="h-full" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Horizontal Layout */}
      <div className="flex h-[calc(100vh-96px)]">
        {/* Left Panel - Potential Locations (1/4) */}
        <div className="w-1/4 border-r" style={{ borderColor: '#D0D0D0' }}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b" style={{ borderColor: '#D0D0D0', backgroundColor: '#1F1F1F' }}>
              <h2 className="text-lg font-bold" style={{ color: '#FCCA00' }}>
                Potential Locations
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <PotentialLocationsList
                locations={potentialLocations}
                selectedLocation={selectedLocation}
                onSelectLocation={handleSelectLocation}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Center Panel - Search & Suggestions (2/4) */}
        <div className="w-2/4 flex flex-col">
          {/* Search Box Header */}
          <div className="p-4 border-b" style={{ borderColor: '#D0D0D0', backgroundColor: '#1F1F1F' }}>
            <h2 className="text-lg font-bold" style={{ color: '#FCCA00' }}>
              Search Locations
            </h2>
          </div>
          
          {/* Search Box */}
          <div className="p-4 border-b" style={{ borderColor: '#D0D0D0' }}>
            <SearchBox onSearch={handleSearch} loading={loading} />
          </div>
          
          {/* Suggestions */}
          <div className="flex-1 overflow-hidden">
            <SuggestionsList 
              suggestions={suggestions}
              onAddToPotential={handleAddToPotential}
              loading={loading}
            />
          </div>

          {/* Direct Add Button */}
          <div className="p-4 border-t" style={{ borderColor: '#D0D0D0' }}>
            <button
              onClick={() => setShowDirectAddForm(true)}
              className="w-full py-2 px-4 font-bold rounded-md hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#1F1F1F', color: '#FCCA00' }}
            >
              + Add Location Manually
            </button>
          </div>
        </div>

        {/* Right Panel - Finalized Locations (1/4) */}
        <div className="w-1/4 border-l" style={{ borderColor: '#D0D0D0' }}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b" style={{ borderColor: '#D0D0D0', backgroundColor: '#1F1F1F' }}>
              <h2 className="text-lg font-bold" style={{ color: '#FCCA00' }}>
                Finalized Locations
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {finalizedLocations.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12" style={{ color: '#7A7A7A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium" style={{ color: '#1F1F1F' }}>No finalized locations</h3>
                  <p className="mt-1 text-sm" style={{ color: '#7A7A7A' }}>Finalize potential locations to see them here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {finalizedLocations.map((location) => (
                    <div
                      key={location._id}
                      className="p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow"
                      style={{ borderColor: '#D0D0D0', backgroundColor: '#D0D0D0' }}
                      onClick={() => handleSelectLocation(location)}
                    >
                      <h4 className="font-semibold text-sm" style={{ color: '#1F1F1F' }}>
                        {location.title || location.name}
                      </h4>
                      <p className="text-xs mt-1" style={{ color: '#7A7A7A' }}>
                        {location.description || location.reason}
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
                              style={{ backgroundColor: '#4CAF50', color: '#FFFFFF' }}>
                          Finalized
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Detail Modal */}
      {showLocationModal && selectedLocation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: '#1F1F1F' }}>
                {selectedLocation.title || selectedLocation.name}
              </h2>
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setSelectedLocation(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <PotentialDetailPanel
              location={selectedLocation}
              notes={locationNotes}
              approvals={locationApprovals}
              currentUser={user}
              onAddNote={handleAddNote}
              onAddApproval={handleAddApproval}
              onFinalize={handleFinalizeLocation}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Direct Add Form Modal */}
      <DirectAddForm
        isOpen={showDirectAddForm}
        onClose={() => setShowDirectAddForm(false)}
        onSubmit={handleDirectAdd}
        loading={loading}
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default LocationsScreen;