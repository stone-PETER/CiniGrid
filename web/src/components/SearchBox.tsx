import React, { useState } from 'react';

interface SearchBoxProps {
  onSearch: (prompt: string) => void;
  loading?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, loading = false }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      onSearch(prompt.trim());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Locations</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="search-prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your location requirements
          </label>
          <textarea
            id="search-prompt"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={4}
            placeholder="e.g., I need a modern office building with glass facade, parking space, and close to public transport..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={!prompt.trim() || loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Search Locations'}
        </button>
      </form>
    </div>
  );
};

export default SearchBox;