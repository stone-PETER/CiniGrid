import React, { useState } from 'react';
import type { Location, Note, Approval, User } from '../types';

interface PotentialDetailPanelProps {
  location: Location;
  notes: Note[];
  approvals: Approval[];
  currentUser: User | null;
  onAddNote: (content: string) => void;
  onAddApproval: (status: 'approved' | 'rejected', notes?: string) => void;
  onFinalize: () => void;
  loading?: boolean;
}

const PotentialDetailPanel: React.FC<PotentialDetailPanelProps> = ({
  location,
  notes,
  approvals,
  currentUser,
  onAddNote,
  onAddApproval,
  onFinalize,
  loading = false
}) => {
  const [newNote, setNewNote] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  const openMapInNewTab = () => {
    const url = `https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}&ll=${location.coordinates.lat},${location.coordinates.lng}&z=16&t=m&markers=size:mid%7Ccolor:red%7C${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  const handleApproval = (status: 'approved' | 'rejected') => {
    onAddApproval(status, approvalNotes.trim() || undefined);
    setApprovalNotes('');
  };

  const handleFinalize = () => {
    onFinalize();
    setShowFinalizeConfirm(false);
  };

  const currentUserApproval = approvals.find(approval => approval.role === currentUser?.role);
  // Only allow users with roles that exist in the User type to manage
  const canManage = currentUser?.role === 'producer' || currentUser?.role === 'director';
  const hasRequiredApprovals = approvals.some(approval => approval.status === 'approved');

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{location.title}</h2>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Potential
            </span>
            {canManage && hasRequiredApprovals && (
              <button
                onClick={() => setShowFinalizeConfirm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
              >
                Finalize Location
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Location Details */}
          <div className="space-y-6">
            {/* Image */}
            {location.imageUrl ? (
              <img 
                src={location.imageUrl} 
                alt={location.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{location.description}</p>
            </div>

            {/* Permits */}
            {location.permits && location.permits.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Permits</h3>
                <div className="flex flex-wrap gap-2">
                  {location.permits.map((permit, index) => (
                    <span 
                      key={index}
                      className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                    >
                      {permit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Map */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Location</h3>
              <p className="text-gray-700 mb-3">
                Coordinates: {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
              </p>
              <button
                onClick={openMapInNewTab}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View on Google Maps
              </button>
            </div>
          </div>

          {/* Right Column - Notes & Approvals */}
          <div className="space-y-6">
            {/* Notes Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this location..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={!newNote.trim() || loading}
                  className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 text-sm"
                >
                  Add Note
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No notes yet.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{note.author}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                      <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full mt-2">
                        {note.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Approvals Section */}
            {canManage && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Approvals</h3>
                
                {/* Current User Approval */}
                <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Your Approval</h4>
                  {currentUserApproval ? (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        currentUserApproval.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {currentUserApproval.status}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(currentUserApproval.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Optional notes for your approval..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproval('approved')}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval('rejected')}
                          disabled={loading}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* All Approvals List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">All Approvals</h4>
                  {approvals.length === 0 ? (
                    <p className="text-gray-500 text-sm">No approvals yet.</p>
                  ) : (
                    approvals.map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{approval.role}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            approval.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {approval.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(approval.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Finalize Confirmation Modal */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Finalize Location</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to finalize "{location.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowFinalizeConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PotentialDetailPanel;