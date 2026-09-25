import React, { useState } from 'react';
import { BehaviouralElement } from '../types/ModelTypes';
import { X, Settings } from 'lucide-react';

interface BehaviouralElementComponentProps {
  element: BehaviouralElement;
  onUpdate: (updates: Partial<BehaviouralElement>) => void;
  onPortClick?: (elementId: string, portType: 'input' | 'output') => void;
  connectingFrom?: { elementId: string; portType: 'input' | 'output' } | null;
  onDelete?: () => void;
}

const BehaviouralElementComponent: React.FC<BehaviouralElementComponentProps> = ({
  element,
  onUpdate,
  onPortClick,
  connectingFrom,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMetrics, setShowMetrics] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(element.name);

  const getElementColor = (type: string) => {
    switch (type) {
      case 'Process': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'Store': return 'bg-green-100 border-green-300 text-green-800';
      case 'Analyze': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'Ingest': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'VerifyData': return 'bg-emerald-100 border-emerald-300 text-emerald-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'Process': return '⚙️';
      case 'Store': return '💾';
      case 'Analyze': return '🔬';
      case 'Ingest': return '📥';
      case 'VerifyData': return '🛡️';
      case 'SendData': return '📤';
      case 'ReceiveData': return '📨';
      case 'Transform': return '🔄';
      case 'Validate': return '✅';
      case 'Filter': return '🔽';
      case 'Merge': return '🔀';
      case 'Classify': return '🏷️';
      case 'Aggregate': return '🧮';
      case 'Cleaning': return '🧹';
      case 'Govern': return '⚖️';
      case 'Retrieve': return '📤';
      case 'Archive': return '🗃️';
      case 'Predict': return '🔮';
      case 'Diagnose': return '🩺';
      case 'Visualize': return '📊';
      case 'Generate': return '✨';
      default: return '🔧';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.position.x,
      y: e.clientY - element.position.y
    });
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: Math.max(5, e.clientX - dragStart.x),
        y: Math.max(5, e.clientY - dragStart.y)
      };
      onUpdate({ position: newPosition });
    }
  }, [isDragging, dragStart, onUpdate]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  const handleNameDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingName(true);
    setNameValue(element.name);
  };

  const handleNameSubmit = () => {
    onUpdate({ name: nameValue.trim() || element.name });
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setNameValue(element.name);
      setIsEditingName(false);
    }
  };

  const toggleMetric = (metric: string) => {
    const currentMetrics = element.properties?.QualityMetrics || [];
    const newMetrics = currentMetrics.includes(metric)
      ? currentMetrics.filter((m: string) => m !== metric)
      : [...currentMetrics, metric];
    
    onUpdate({
      properties: {
        ...element.properties,
        QualityMetrics: newMetrics
      }
    });
  };

  const availableMetrics = [
    'Completeness', 'Consistency', 'Validity', 'Accuracy', 
    'Timeliness', 'Uniqueness', 'Integrity'
  ];

  // Helper function to get metric descriptions
  const getMetricDescription = (metric: string): string => {
    const descriptions: Record<string, string> = {
      'Completeness': 'Ensures all required data fields are present',
      'Consistency': 'Validates data follows the same format and rules',
      'Validity': 'Checks data conforms to defined formats and constraints',
      'Accuracy': 'Verifies data correctly represents real-world values',
      'Timeliness': 'Ensures data is current and up-to-date',
      'Uniqueness': 'Prevents duplicate records and maintains data integrity',
      'Integrity': 'Maintains relationships and constraints between data elements'
    };
    return descriptions[metric] || 'Quality metric for data verification';
  };

  return (
    <>
      <div
        className={`absolute rounded-lg border-2 cursor-move select-none transition-all duration-200 ${getElementColor(element.type)} ${
          isDragging ? 'opacity-80 scale-105' : ''
        } group`}
        style={{
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height,
          zIndex: isDragging ? 20 : 10
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Delete Button */}
        <button
          className="absolute w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600 -top-2 -right-2 z-20"
          onClick={handleDelete}
          title="Delete Element"
        >
          <X size={10} />
        </button>

        {/* Settings Button for VerifyData */}
        {element.type === 'VerifyData' && (
          <button
            className="absolute w-4 h-4 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-blue-600 -top-2 -left-2 z-20"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMetrics(!showMetrics);
            }}
            title="Configure Quality Metrics"
          >
            <Settings size={8} />
          </button>
        )}

        {/* Input Port */}
        <div
          className={`absolute w-2 h-2 rounded-full border cursor-pointer transition-all duration-200 hover:scale-125 bg-green-500 border-green-600 -left-1 ${
            connectingFrom && connectingFrom.portType !== 'input' ? 'scale-125 shadow-lg' : ''
          }`}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
          onClick={(e) => {
            e.stopPropagation();
            onPortClick?.(element.id, 'input');
          }}
          title="Input port"
        />
        
        {/* Output Port */}
        <div
          className={`absolute w-2 h-2 rounded-full border cursor-pointer transition-all duration-200 hover:scale-125 bg-red-500 border-red-600 -right-1 ${
            connectingFrom && connectingFrom.portType !== 'output' ? 'scale-125 shadow-lg' : ''
          }`}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
          onClick={(e) => {
            e.stopPropagation();
            onPortClick?.(element.id, 'output');
          }}
          title="Output port"
        />
        
        {/* Special Blue Port for Send Data (connects to node output ports) */}
        {element.type === 'SendData' && (
          <div
            className={`absolute w-3 h-3 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-125 bg-blue-500 border-blue-600 ${
              connectingFrom && connectingFrom.portType !== 'output' ? 'scale-125 shadow-lg' : ''
            }`}
            style={{ top: '50%', right: '-8px', transform: 'translateY(-50%)' }}
            onClick={(e) => {
              e.stopPropagation();
              onPortClick?.(element.id, 'nodeOutput');
            }}
            title="Connect to node output port"
          />
        )}

        <div className="flex items-center justify-center h-full px-2">
          <span className="mr-1 text-sm">{getElementIcon(element.type)}</span>
          {isEditingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleNameKeyDown}
              className="text-xs font-medium bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0 flex-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span 
              className="text-xs font-medium truncate cursor-text hover:bg-black hover:bg-opacity-10 px-1 py-0.5 rounded transition-colors"
              onDoubleClick={handleNameDoubleClick}
              title="Double-click to edit name"
            >
              {element.name}
            </span>
          )}
          {element.type === 'VerifyData' && element.properties?.QualityMetrics?.length > 0 && (
            <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-1">
              {element.properties.QualityMetrics.length}
            </span>
          )}
        </div>
      </div>

      {/* Quality Metrics Popup */}
      {element.type === 'VerifyData' && showMetrics && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-40 backdrop-blur-sm"
            onClick={() => setShowMetrics(false)}
          />
          
          {/* Modal Dialog */}
          <div
            className="fixed z-50 bg-white rounded-xl shadow-2xl"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '420px',
              maxWidth: '90vw',
              maxHeight: '85vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Quality Metrics</h3>
                  <p className="text-sm text-gray-500">Configure data verification standards</p>
                </div>
              </div>
              <button
                onClick={() => setShowMetrics(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Selected Count Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-gray-700">Available Metrics</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Selected:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {(element.properties?.QualityMetrics || []).length} of {availableMetrics.length}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                {availableMetrics.map((metric) => {
                  const isSelected = (element.properties?.QualityMetrics || []).includes(metric);
                  return (
                    <label 
                      key={metric} 
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-emerald-200 bg-emerald-50 shadow-sm' 
                          : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-25'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMetric(metric)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{metric}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {getMetricDescription(metric)}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <div className="text-xs text-gray-500">
                Select quality metrics to verify data integrity
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    onUpdate({
                      properties: {
                        ...element.properties,
                        QualityMetrics: []
                      }
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowMetrics(false)}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BehaviouralElementComponent;