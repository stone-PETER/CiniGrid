import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../hooks/useLocations';
import SearchBox from '../components/SearchBox';
import SuggestionsList from '../components/SuggestionsList';
import PotentialLocationsList from '../components/PotentialLocationsList';
import PotentialDetailPanel from '../components/PotentialDetailPanel';
import DirectAddForm from '../components/DirectAddForm';

const ScoutDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    suggestions,
    potentialLocations,
    selectedLocation,
    locationNotes,
    locationApprovals,
    loading,
    error,
    searchAi,
    addPotential,
    getPotentialList,
    getPotentialDetail,
    addNote,
    addApproval,
    finalizeLocation,
    directAdd,
    setError,
  } = useLocations();

  const [showDirectAddForm, setShowDirectAddForm] = useState(false);

  useEffect(() => {
    // Load potential locations on component mount
    getPotentialList();
  }, [getPotentialList]);

  const handleSearch = async (prompt: string) => {
    await searchAi({ prompt });
  };

  const handleAddToPotential = async (suggestion: any) => {
    try {
      await addPotential(suggestion);
    } catch (err) {
      console.error('Failed to add to potential:', err);
    }
  };

  const handleSelectLocation = async (location: any) => {
    await getPotentialDetail(location.id);
  };

  const handleAddNote = async (content: string) => {
    if (selectedLocation) {
      try {
        await addNote({ content, locationId: selectedLocation.id });
      } catch (err) {
        console.error('Failed to add note:', err);
      }
    }
  };

  const handleAddApproval = async (status: 'approved' | 'rejected', notes?: string) => {
    if (selectedLocation) {
      try {
        await addApproval({ status, notes, locationId: selectedLocation.id });
      } catch (err) {
        console.error('Failed to add approval:', err);
      }
    }
  };

  const handleFinalizeLocation = async () => {
    if (selectedLocation) {
      try {
        await finalizeLocation(selectedLocation.id);
      } catch (err) {
        console.error('Failed to finalize location:', err);
      }
    }
  };

  const handleDirectAdd = async (data: {
    manualData: {
      title: string;
      description: string;
      coordinates: { lat: number; lng: number };
      region?: string;
      tags?: string[];
      permits?: string[];
      images?: string[];
    };
    status: 'potential' | 'finalized';
  }) => {
    try {
      await directAdd(data, data.status);
      setShowDirectAddForm(false);
    } catch (err) {
      console.error('Failed to add location directly:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Location Scouting Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user?.username} ({user?.role})
              </p>
            </div>
            <div className="flex gap-4">
              <a
                href="/finalized"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                View Finalized
              </a>
              <button
                onClick={() => setShowDirectAddForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Add Location
              </button>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

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
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Search */}
          <div className="lg:col-span-3">
            <SearchBox onSearch={handleSearch} loading={loading} />
          </div>

          {/* Middle Column - Suggestions */}
          <div className="lg:col-span-4">
            <SuggestionsList 
              suggestions={suggestions}
              onAddToPotential={handleAddToPotential}
              loading={loading}
            />
          </div>

          {/* Right Column - Potential Locations */}
          <div className="lg:col-span-5">
            <PotentialLocationsList 
              locations={potentialLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              loading={loading}
            />
          </div>
        </div>

        {/* Detail Panel - Full Width */}
        {selectedLocation && (
          <div className="mt-8">
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
        )}
      </main>

      {/* Direct Add Form Modal */}
      <DirectAddForm
        isOpen={showDirectAddForm}
        onClose={() => setShowDirectAddForm(false)}
        onSubmit={handleDirectAdd}
        loading={loading}
      />
    </div>
  );
};

export default ScoutDashboard;