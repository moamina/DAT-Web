import React, { useState } from 'react';
import { toolboxCategories } from '../data/ToolboxData';
import { ToolboxItem } from '../types/ModelTypes';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';

interface ToolboxProps {
  onDragStart: (item: ToolboxItem, e: React.DragEvent) => void;
}

const Toolbox: React.FC<ToolboxProps> = ({ onDragStart }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragStart = (item: ToolboxItem, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    onDragStart(item, e);
  };

  // Filter items based on search term
  const getFilteredCategories = () => {
    if (!searchTerm.trim()) {
      return toolboxCategories;
    }

    const filtered: Record<string, ToolboxItem[]> = {};
    const searchLower = searchTerm.toLowerCase();

    Object.entries(toolboxCategories).forEach(([category, items]) => {
      const matchingItems = items.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.type.toLowerCase().includes(searchLower) ||
        category.toLowerCase().includes(searchLower)
      );

      if (matchingItems.length > 0) {
        filtered[category] = matchingItems;
      }
    });

    return filtered;
  };

  const filteredCategories = getFilteredCategories();
  const totalItems = Object.values(filteredCategories).reduce((sum, items) => sum + items.length, 0);

  // Auto-expand categories when searching
  React.useEffect(() => {
    if (searchTerm.trim()) {
      setExpandedCategories(new Set(Object.keys(filteredCategories)));
    }
  }, [searchTerm, filteredCategories]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto h-full flex-shrink-0">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Toolbox</h2>
        <p className="text-sm text-gray-600 mt-1">Drag elements to canvas</p>
        <p className="text-xs text-blue-600 mt-1">
          {searchTerm ? `Found: ${totalItems} items` : `Categories: ${Object.keys(toolboxCategories).length}`}
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search elements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="p-2">
        {Object.keys(filteredCategories).length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <Search size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No elements found</p>
            <p className="text-xs">Try a different search term</p>
          </div>
        )}
        
        {Object.entries(filteredCategories).map(([category, items]) => (
          <div key={category} className="mb-2">
            <button
              className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => toggleCategory(category)}
            >
              <span className="font-medium text-gray-700 text-sm">
                {category}
                {searchTerm && (
                  <span className="ml-1 text-xs text-blue-600">
                    ({items.length})
                  </span>
                )}
              </span>
              {expandedCategories.has(category) ? 
                <ChevronDown size={16} className="text-gray-500" /> : 
                <ChevronRight size={16} className="text-gray-500" />
              }
              {!searchTerm && (
                <span className="text-xs text-gray-500 ml-1">({items.length})</span>
              )}
            </button>

            {expandedCategories.has(category) && (
              <div className="ml-2 space-y-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center p-2 rounded-lg cursor-move hover:bg-gray-100 transition-colors border border-gray-200 ${
                      searchTerm ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(item, e)}
                  >
                    <span className="text-base mr-2">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium truncate ${
                        searchTerm ? 'text-blue-800' : 'text-gray-800'
                      }`}>
                        {item.name}
                      </div>
                      <div className={`text-xs truncate ${
                        searchTerm ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {item.type}
                      </div>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full ml-2 flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Toolbox;