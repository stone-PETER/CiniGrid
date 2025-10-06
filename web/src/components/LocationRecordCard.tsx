import React, { useState } from "react";

interface LocationRecord {
  _id: string;
  name: string;
  description: string;
  userNotes: string;
  tags: string[];
  status: string;
  stats: {
    potentialsCount: number;
    finalizedCount: number;
  };
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
  };
}

interface LocationRecordCardProps {
  record: LocationRecord;
  isSelected: boolean;
  onSelect: () => void;
  onSearch: () => void;
  onCompare: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const LocationRecordCard: React.FC<LocationRecordCardProps> = ({
  record,
  isSelected,
  onSelect,
  onSearch,
  onCompare,
  onEdit,
  onDelete,
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getStatusColor = () => {
    switch (record.status) {
      case "finalized":
        return "bg-green-100 text-green-800";
      case "searching":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = () => {
    switch (record.status) {
      case "finalized":
        return "Finalized";
      case "searching":
        return "Searching";
      default:
        return "Pending";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-blue-500 shadow-lg"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {record.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Created by {record.createdBy.name}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
          >
            {getStatusLabel()}
          </span>
        </div>

        {/* Tags */}
        {record.tags && record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {record.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="p-4 border-b border-gray-200">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {showFullDescription
            ? record.description
            : truncateText(record.description, 150)}
        </p>
        {record.description.length > 150 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullDescription(!showFullDescription);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 mt-2"
          >
            {showFullDescription ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Potential Locations</p>
            <p className="text-2xl font-bold text-gray-900">
              {record.stats.potentialsCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Finalized</p>
            <p className="text-2xl font-bold text-green-600">
              {record.stats.finalizedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Notes (Collapsible) */}
      {record.userNotes && (
        <div className="border-b border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotes(!showNotes);
            }}
            className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              📝 Personal Notes
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${
                showNotes ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showNotes && (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-yellow-50 p-3 rounded border border-yellow-200">
                {record.userNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSearch();
            }}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            🔍 Search Locations
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompare();
            }}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={record.stats.potentialsCount === 0}
            title={
              record.stats.potentialsCount === 0
                ? "Add potential locations first"
                : "Compare all potential locations"
            }
          >
            ⚖️ Compare ({record.stats.potentialsCount})
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
          >
            ✏️ Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-3 py-2 bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationRecordCard;
