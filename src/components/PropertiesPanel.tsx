import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DataNode, Connection, BehaviouralElement, InternalConnection } from '../types/ModelTypes';

interface PropertiesPanelProps {
  selectedElement: string | null;
  dataNodes: DataNode[];
  connections: Connection[];
  internalConnections: InternalConnection[];
  onUpdateNode: (nodeId: string, updates: Partial<DataNode>) => void;
  onUpdateConnection: (connectionId: string, updates: Partial<Connection>) => void;
  onUpdateInternalConnection: (connectionId: string, updates: Partial<InternalConnection>) => void;
  onAddInternalConnection: (nodeId: string, sourceElementId: string, targetElementId: string) => void;
  onDeleteInternalConnection: (connectionId: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  dataNodes,
  connections,
  internalConnections,
  onUpdateNode,
  onUpdateConnection,
  onUpdateInternalConnection,
  onAddInternalConnection,
  onDeleteInternalConnection
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['basic', 'ports', 'elements'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!selectedElement) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Properties</h3>
        <p className="text-sm text-gray-500">Select an element to view its properties</p>
      </div>
    );
  }

  const selectedNode = dataNodes.find(node => node.id === selectedElement);
  const selectedConnection = connections.find(conn => conn.id === selectedElement);

  if (selectedNode) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Node Properties</h3>
          <p className="text-sm text-gray-600">{selectedNode.name}</p>
        </div>
        
        <div className="p-4 space-y-3">
          {/* Basic Properties Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-700">Basic Properties</span>
              {expandedSections.has('basic') ? 
                <ChevronDown size={16} className="text-gray-500" /> : 
                <ChevronRight size={16} className="text-gray-500" />
              }
            </button>
            
            {expandedSections.has('basic') && (
              <div className="p-3 border-t border-gray-200 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedNode.name}
                    onChange={(e) => onUpdateNode(selectedNode.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={selectedNode.position.x}
                      onChange={(e) => onUpdateNode(selectedNode.id, { 
                        position: { ...selectedNode.position, x: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="X"
                    />
                    <input
                      type="number"
                      value={selectedNode.position.y}
                      onChange={(e) => onUpdateNode(selectedNode.id, { 
                        position: { ...selectedNode.position, y: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Y"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={selectedNode.size.width}
                      onChange={(e) => onUpdateNode(selectedNode.id, { 
                        size: { ...selectedNode.size, width: parseInt(e.target.value) || 200 }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Width"
                    />
                    <input
                      type="number"
                      value={selectedNode.size.height}
                      onChange={(e) => onUpdateNode(selectedNode.id, { 
                        size: { ...selectedNode.size, height: parseInt(e.target.value) || 150 }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Height"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Ports Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('ports')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-700">
                Message Ports ({selectedNode.messagePorts.length})
              </span>
              {expandedSections.has('ports') ? 
                <ChevronDown size={16} className="text-gray-500" /> : 
                <ChevronRight size={16} className="text-gray-500" />
              }
            </button>
            
            {expandedSections.has('ports') && (
              <div className="p-3 border-t border-gray-200">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedNode.messagePorts.map(port => (
                    <div key={port.id} className="text-xs bg-gray-50 p-2 rounded border">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${
                          port.type === 'input' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-gray-800">{port.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          port.type === 'input' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {port.type}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        Position: ({port.position.x}, {port.position.y})
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                  🟢 Input: {selectedNode.messagePorts.filter(p => p.type === 'input').length} | 
                  🔴 Output: {selectedNode.messagePorts.filter(p => p.type === 'output').length}
                </div>
              </div>
            )}
          </div>

          {/* Behavioral Elements Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('elements')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-700">
                Behavioral Elements ({selectedNode.behaviouralElements.length})
              </span>
              {expandedSections.has('elements') ? 
                <ChevronDown size={16} className="text-gray-500" /> : 
                <ChevronRight size={16} className="text-gray-500" />
              }
            </button>
            
            {expandedSections.has('elements') && (
              <div className="p-3 border-t border-gray-200">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedNode.behaviouralElements.map(element => (
                    <div key={element.id} className="text-xs bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {element.type === 'Process' ? '⚙️' :
                             element.type === 'Store' ? '💾' :
                             element.type === 'Analyze' ? '🔬' :
                             element.type === 'Ingest' ? '📥' :
                             element.type === 'VerifyData' ? '🛡️' :
                             element.type === 'SendData' ? '📤' :
                             element.type === 'ReceiveData' ? '📨' :
                             element.type === 'Transform' ? '🔄' :
                             element.type === 'Validate' ? '✅' :
                             element.type === 'Filter' ? '🔽' :
                             element.type === 'Merge' ? '🔀' :
                             element.type === 'Classify' ? '🏷️' :
                             element.type === 'Aggregate' ? '🧮' :
                             element.type === 'Cleaning' ? '🧹' :
                             element.type === 'Govern' ? '⚖️' :
                             element.type === 'Predict' ? '🔮' :
                             element.type === 'Diagnose' ? '🩺' :
                             element.type === 'Visualize' ? '📊' :
                             element.type === 'Generate' ? '✨' :
                             '🔧'}
                          </span>
                          <span className="font-medium text-gray-800">{element.name}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {element.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-500 text-xs mb-2">
                        <div>Pos: ({element.position.x}, {element.position.y})</div>
                        <div>Size: {element.size.width}×{element.size.height}</div>
                      </div>
                      {element.properties && Object.keys(element.properties).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-600 font-medium mb-1">Properties:</div>
                          <div className="space-y-1">
                            {Object.entries(element.properties).map(([key, value]) => (
                              <div key={key} className="text-xs text-gray-500 flex justify-between">
                                <span className="font-medium">{key}:</span>
                                <span className="truncate ml-1 max-w-24">
                                  {Array.isArray(value) ? `[${value.length} items]` : 
                                   typeof value === 'object' ? '[Object]' :
                                   String(value).length > 15 ? `${String(value).substring(0, 15)}...` :
                                   String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedNode.behaviouralElements.length === 0 && (
                    <div className="text-xs text-gray-400 italic text-center py-4">
                      No behavioral elements
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quality Metrics Section */}
          {selectedNode.behaviouralElements.filter(el => el.type === 'VerifyData').length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('metrics')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-700">
                  Quality Metrics ({selectedNode.behaviouralElements.filter(el => el.type === 'VerifyData').length})
                </span>
                {expandedSections.has('metrics') ? 
                  <ChevronDown size={16} className="text-gray-500" /> : 
                  <ChevronRight size={16} className="text-gray-500" />
                }
              </button>
              
              {expandedSections.has('metrics') && (
                <div className="p-3 border-t border-gray-200 space-y-3">
                  {selectedNode.behaviouralElements
                    .filter(el => el.type === 'VerifyData')
                    .map(element => (
                      <div key={element.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <span className="mr-2">✅</span>
                          {element.name}
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-emerald-700 mb-2">
                            Quality Metrics:
                          </label>
                          <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                            {(element.properties?.availableMetrics || []).map((metric: string) => (
                              <label key={metric} className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={(element.properties?.QualityMetrics || []).includes(metric)}
                                  onChange={(e) => {
                                    const currentMetrics = element.properties?.QualityMetrics || [];
                                    const newMetrics = e.target.checked
                                      ? [...currentMetrics, metric]
                                      : currentMetrics.filter((m: string) => m !== metric);
                                    
                                    const updatedElements = selectedNode.behaviouralElements.map(el =>
                                      el.id === element.id 
                                        ? { ...el, properties: { ...el.properties, QualityMetrics: newMetrics } }
                                        : el
                                    );
                                    onUpdateNode(selectedNode.id, { behaviouralElements: updatedElements });
                                  }}
                                  className="mr-2 text-emerald-600"
                                />
                                <span className="text-gray-700">{metric}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-emerald-700 mb-1">
                            Selected ({(element.properties?.QualityMetrics || []).length}):
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {(element.properties?.QualityMetrics || []).map((metric: string) => (
                              <span key={metric} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                                {metric}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-emerald-700 mb-1">Description:</label>
                          <textarea
                            value={element.properties?.desc || ''}
                            onChange={(e) => {
                              const updatedElements = selectedNode.behaviouralElements.map(el =>
                                el.id === element.id 
                                  ? { ...el, properties: { ...el.properties, desc: e.target.value } }
                                  : el
                              );
                              onUpdateNode(selectedNode.id, { behaviouralElements: updatedElements });
                            }}
                            className="w-full px-2 py-1 border border-emerald-300 rounded text-xs resize-none"
                            rows={2}
                            placeholder="Quality verification description..."
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Internal Connections</h4>
            <div className="text-xs text-gray-600 mb-2">
              Click on element ports to create internal connections manually
            </div>
            <div className="space-y-1">
              {internalConnections
                .filter(conn => conn.nodeId === selectedNode.id)
                .map(connection => {
                  const sourceElement = selectedNode.behaviouralElements.find(el => el.id === connection.sourceElementId);
                  const targetElement = selectedNode.behaviouralElements.find(el => el.id === connection.targetElementId);
                  const sourcePort = selectedNode.messagePorts.find(p => p.id === connection.sourceElementId);
                  const targetPort = selectedNode.messagePorts.find(p => p.id === connection.targetElementId);
                  
                  const sourceName = sourceElement?.name || sourcePort?.name || 'Unknown';
                  const targetName = targetElement?.name || targetPort?.name || 'Unknown';
                  
                  // Determine connection type and color
                  let connectionType = 'Internal';
                  let colorClass = 'text-red-600';
                  
                  if (sourcePort && targetElement) {
                    connectionType = 'Input→Element';
                    colorClass = 'text-green-600';
                  } else if (sourceElement && targetPort) {
                    connectionType = 'Element→Output';
                    colorClass = 'text-blue-600';
                  }
                  
                  return (
                    <div key={connection.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                      <div className="flex-1">
                        <div className={`font-medium ${colorClass}`}>
                          {sourceName} → {targetName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {connectionType}
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteInternalConnection(connection.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Delete connection"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              {internalConnections.filter(conn => conn.nodeId === selectedNode.id).length === 0 && (
                <div className="text-xs text-gray-400 italic">No internal connections</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedConnection) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Connection Properties</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={selectedConnection.label || ''}
              onChange={(e) => onUpdateConnection(selectedConnection.id, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Connection label"
            />
          </div>

          <div className="text-sm">
            <div className="mb-2">
              <span className="font-medium text-gray-700">Source:</span>
              <div className="text-gray-600 ml-2">
                <div className="text-xs">Node ID: {selectedConnection.sourceNodeId}</div>
                <div className="text-xs">Port ID: {selectedConnection.sourcePortId}</div>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Target:</span>
              <div className="text-gray-600 ml-2">
                <div className="text-xs">Node ID: {selectedConnection.targetNodeId}</div>
                <div className="text-xs">Port ID: {selectedConnection.targetPortId}</div>
              </div>
            </div>
          </div>

          <div className="text-sm">
            <span className="font-medium text-gray-700">Connection Details:</span>
            <div className="text-gray-600 ml-2 space-y-1">
              <div className="text-xs">ID: {selectedConnection.id}</div>
              <div className="text-xs">Type: External Connection</div>
              <div className="text-xs">
                Status: {selectedConnection.label ? 'Labeled' : 'Unlabeled'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PropertiesPanel;