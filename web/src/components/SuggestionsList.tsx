import React from 'react';
import type { Suggestion } from '../types';

interface SuggestionsListProps {
  suggestions: Suggestion[];
  onAddToPotential: (suggestion: Suggestion) => void;
  loading?: boolean;
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({ 
  suggestions, 
  onAddToPotential, 
  loading = false 
}) => {
  const openMapInNewTab = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=16&t=m&markers=size:mid%7Ccolor:red%7C${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Suggestions</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        AI Suggestions {suggestions.length > 0 && `(${suggestions.length})`}
      </h2>
      
      {suggestions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="mt-2">No suggestions yet. Try searching for locations!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {suggestion.imageUrl ? (
                    <img 
                      src={suggestion.imageUrl} 
                      alt={suggestion.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{suggestion.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{suggestion.description}</p>
                  
                  {suggestion.permits && suggestion.permits.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-700">Permits: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {suggestion.permits.map((permit, index) => {
                          const permitName = typeof permit === 'string' ? permit : permit.name;
                          const isRequired = typeof permit === 'object' ? permit.required : true;
                          
                          return (
                            <span 
                              key={index}
                              className={`inline-block text-xs px-2 py-1 rounded-full ${
                                isRequired 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}
                              title={typeof permit === 'object' && permit.notes ? permit.notes : undefined}
                            >
                              {permitName}
                              {typeof permit === 'object' && permit.required && ' *'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => openMapInNewTab(suggestion.coordinates.lat, suggestion.coordinates.lng)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View on Map
                    </button>
                    
                    <button
                      onClick={() => onAddToPotential(suggestion)}
                      className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                    >
                      Add to Potential
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuggestionsList;