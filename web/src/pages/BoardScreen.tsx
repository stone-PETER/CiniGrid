import React, { useState } from 'react';

interface KanbanCard {
  id: string;
  title: string;
  time: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'scene' | 'task';
}

const BoardScreen: React.FC = () => {
  const [columns] = useState([
    'Pre-Production',
    'In Progress', 
    'Review',
    'Approved',
    'Shooting',
    'Completed'
  ]);

  // Sample data for demonstration
  const [cards] = useState<{ [key: string]: KanbanCard[] }>({
    'Pre-Production': [
      { id: '1', title: 'Scene 1 - Opening', time: '09:00', date: '2025-10-10', priority: 'High', type: 'scene' },
      { id: '2', title: 'Equipment Setup', time: '08:00', date: '2025-10-10', priority: 'Medium', type: 'task' }
    ],
    'In Progress': [
      { id: '3', title: 'Scene 2 - Dialog', time: '14:00', date: '2025-10-08', priority: 'High', type: 'scene' }
    ],
    'Review': [],
    'Approved': [
      { id: '4', title: 'Location Scouting', time: '10:00', date: '2025-10-05', priority: 'Low', type: 'task' }
    ],
    'Shooting': [],
    'Completed': []
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#FF4444';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return '#7A7A7A';
    }
  };

  const getTypeGradient = (type: string) => {
    return type === 'scene' 
      ? 'linear-gradient(135deg, #D0D0D0 0%, #FFFFFF 100%)'
      : 'linear-gradient(135deg, #F5F5DC 0%, #FDF5E6 100%)';
  };

  return (
    <div className="h-full p-6" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#1F1F1F' }}>
          Production Board
        </h1>
        <button 
          className="px-4 py-2 font-bold rounded-md hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#FCCA00', color: '#1F1F1F' }}
        >
          + Add New Item
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-6 gap-4 h-[calc(100vh-200px)]">
        {columns.map((columnName) => (
          <div
            key={columnName}
            className="rounded-lg p-4 flex flex-col"
            style={{ backgroundColor: '#D0D0D0' }}
          >
            {/* Column Header */}
            <div className="mb-4">
              <h3 className="font-bold text-sm text-center" style={{ color: '#1F1F1F' }}>
                {columnName}
              </h3>
              <div className="text-xs text-center mt-1" style={{ color: '#7A7A7A' }}>
                {cards[columnName]?.length || 0} items
              </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {cards[columnName]?.map((card) => (
                <div
                  key={card.id}
                  className="p-3 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  style={{ 
                    background: getTypeGradient(card.type),
                    border: `2px solid ${getPriorityColor(card.priority)}`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded" 
                          style={{ backgroundColor: getPriorityColor(card.priority), color: '#FFFFFF' }}>
                      {card.priority}
                    </span>
                    <span className="text-xs" style={{ color: '#7A7A7A' }}>
                      {card.type.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#1F1F1F' }}>
                    {card.title}
                  </h4>
                  <div className="text-xs" style={{ color: '#7A7A7A' }}>
                    <div>{card.date}</div>
                    <div>{card.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Button */}
            <button 
              className="mt-3 p-2 rounded-md border-2 border-dashed hover:bg-opacity-20 transition-all"
              style={{ borderColor: '#7A7A7A', color: '#7A7A7A' }}
            >
              + Add Item
            </button>
          </div>
        ))}
      </div>

      {/* AI Suggestions Panel */}
      <div 
        className="fixed bottom-4 right-4 left-4 p-4 rounded-lg shadow-lg border"
        style={{ backgroundColor: '#1F1F1F', borderColor: '#FCCA00' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm" style={{ color: '#FCCA00' }}>
              AI Production Suggestions
            </h4>
            <p className="text-xs mt-1" style={{ color: '#D0D0D0' }}>
              Consider rescheduling Scene 2 to optimize crew availability and location costs.
            </p>
          </div>
          <button 
            className="px-3 py-1 text-xs font-bold rounded hover:opacity-80"
            style={{ backgroundColor: '#FCCA00', color: '#1F1F1F' }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardScreen;