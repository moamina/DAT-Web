import React, { useState, useRef, useEffect } from 'react';
import { DataNode, Position, BehaviouralElement, InternalConnection } from '../types/ModelTypes';
import { ChevronDown, ChevronRight, Plus, Minus, X } from 'lucide-react';
import BehaviouralElementComponent from './BehaviouralElementComponent';

interface DataNodeComponentProps {
  node: DataNode;
  isSelected: boolean;
  isDragOver?: boolean;
  onSelect: () => void;
  onDrag: (nodeId: string, newPosition: Position) => void;
  onUpdate: (updates: Partial<DataNode>) => void;
  onPortClick: (nodeId: string, portId: string, portType: 'input' | 'output') => void;
  onAddBehaviouralElement: (element: BehaviouralElement) => void;
  onDeleteBehaviouralElement?: (elementId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  connectingFrom: { nodeId: string; portId: string; portType: 'input' | 'output' } | null;
  internalConnectingFrom?: { nodeId: string; elementId: string; portType: 'input' | 'output' } | null;
  onInternalPortClick?: (nodeId: string, elementId: string, portType: 'input' | 'output') => void;
  internalConnections?: InternalConnection[];
  zoom?: number;
  onDelete?: () => void;
  onDeleteInternalConnection?: (connectionId: string) => void;
}

const DataNodeComponent: React.FC<DataNodeComponentProps> = ({
  node,
  isSelected,
  isDragOver = false,
  zoom = 1,
  onSelect,
  onDrag,
  onUpdate,
  onPortClick,
  onAddBehaviouralElement,
  onDeleteBehaviouralElement,
  onDragOver,
  onDragLeave,
  onDrop,
  connectingFrom,
  internalConnectingFrom,
  onInternalPortClick,
  internalConnections = [],
  onDelete,
  onDeleteInternalConnection
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(node.name);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const initialPositionRef = useRef({ x: node.position.x, y: node.position.y });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [draggingPort, setDraggingPort] = useState<string | null>(null);
  const [portDragStart, setPortDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  // Auto-resize based on content
  const calculateAutoSize = () => {
    const minWidth = 180;
    const minHeight = node.isExpanded ? 300 : 80;
    
    if (!node.isExpanded) {
      return { width: Math.max(minWidth, node.size.width), height: 80 };
    }

    // Calculate required size based on behavioral elements
    let maxX = 0;
    let maxY = 0;
    
    node.behaviouralElements.forEach(element => {
      const elementRight = element.position.x + element.size.width;
      const elementBottom = element.position.y + element.size.height;
      maxX = Math.max(maxX, elementRight);
      maxY = Math.max(maxY, elementBottom);
    });

    // Add padding for the behavioral area
    const contentWidth = Math.max(minWidth, maxX + 40); // 20px padding on each side
    const contentHeight = Math.max(minHeight, maxY + 120); // Header + padding

    return { width: contentWidth, height: contentHeight };
  };

  // Auto-resize when behavioral elements change
  useEffect(() => {
    const autoSize = calculateAutoSize();
    if (autoSize.width !== node.size.width || autoSize.height !== node.size.height) {
      // Update output port X positions when width changes
      const updatedPorts = node.messagePorts.map(port => 
        port.type === 'output' 
          ? { ...port, position: { ...port.position, x: autoSize.width } }
          : port
      );
      onUpdate({ size: autoSize, messagePorts: updatedPorts });
    }
  }, [node.behaviouralElements, node.isExpanded]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const resizeHandle = target.closest('.resize-handle');
    const titleBar = target.closest('.title-bar');
    const portElement = target.closest('.message-port');
    
    if (resizeHandle) {
      // Start resizing
      e.preventDefault();
      e.stopPropagation();
      onSelect();
      
      const direction = resizeHandle.getAttribute('data-direction') || '';
      setIsResizing(true);
      setResizeDirection(direction);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: node.size.width,
        height: node.size.height
      });
    } else if (portElement) {
      // Start port dragging
      e.preventDefault();
      e.stopPropagation();
      onSelect();
      
      const portId = portElement.getAttribute('data-port-id');
      if (portId) {
        setDraggingPort(portId);
        setPortDragStart({ x: e.clientX, y: e.clientY });
      }
    } else if (titleBar) {
      // Start dragging
      e.preventDefault();
      onSelect();
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
      initialPositionRef.current = { x: node.position.x, y: node.position.y };
    }
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isResizing) {
      const deltaX = (e.clientX - resizeStart.x) / zoom;
      const deltaY = (e.clientY - resizeStart.y) / zoom;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      
      if (resizeDirection.includes('right')) {
        newWidth = Math.max(180, resizeStart.width + deltaX);
      }
      if (resizeDirection.includes('bottom')) {
        newHeight = Math.max(node.isExpanded ? 300 : 80, resizeStart.height + deltaY);
      }
      
      // Update output port positions when resizing (input ports stay at x=0)
      const updatedPorts = node.messagePorts.map(port => ({
        ...port,
        position: {
          x: port.type === 'input' ? 0 : newWidth,
          y: Math.max(15, Math.min(newHeight - 15, port.position.y))
        }
      }));
      
      onUpdate({ size: { width: newWidth, height: newHeight }, messagePorts: updatedPorts });
    } else if (draggingPort) {
      const deltaY = (e.clientY - portDragStart.y) / zoom;
      const port = node.messagePorts.find(p => p.id === draggingPort);
      
      if (port) {
        // Constrain port movement
        const minY = 20;
        const maxY = node.size.height - 20;
        const newY = Math.max(minY, Math.min(maxY, port.position.y + deltaY));
        
        // Keep input ports at x=0, output ports at x=width
        const newX = port.type === 'input' ? 0 : node.size.width;
        
        const updatedPorts = node.messagePorts.map(p =>
          p.id === draggingPort
            ? { ...p, position: { x: newX, y: newY } }
            : p
        );
        
        onUpdate({ messagePorts: updatedPorts });
        setPortDragStart({ x: e.clientX, y: e.clientY });
      }
    } else if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;
      const newPosition = {
        x: Math.max(0, initialPositionRef.current.x + deltaX),
        y: Math.max(0, initialPositionRef.current.y + deltaY)
      };
      onDrag(node.id, newPosition);
    }
  }, [isDragging, isResizing, draggingPort, dragStart, resizeStart, resizeDirection, portDragStart, zoom, node.id, node.isExpanded, node.size.height, node.messagePorts, onDrag, onUpdate]);


  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
    setDraggingPort(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing || draggingPort) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, draggingPort, handleMouseMove, handleMouseUp]);

  const toggleExpanded = () => {
    onUpdate({ isExpanded: !node.isExpanded });
  };

  const addBehaviouralElement = (type: string) => {
    const newElement: BehaviouralElement = {
      id: `${node.id}_behavior_${Date.now()}`,
      name: type === 'VerifyData' ? 'Verify Data' : `New ${type}`,
      type,
      position: { x: 10, y: node.behaviouralElements.length * 60 + 10 },
      size: { width: 120, height: 40 },
      properties: type === 'VerifyData' ? {
        QualityMetrics: [],
        availableMetrics: ['Completeness', 'Consistency', 'Validity', 'Accuracy', 'Timeliness', 'Uniqueness', 'Integrity'],
        desc: ''
      } : {}
    };
    onAddBehaviouralElement(newElement);
  };

  const addPort = (type: 'input' | 'output') => {
    const existingPorts = node.messagePorts.filter(p => p.type === type);
    const defaultY = 40 + existingPorts.length * 30;
    const constrainedY = Math.max(20, Math.min(node.size.height - 20, defaultY));
    const x = type === 'input' ? 0 : node.size.width;
    
    const newPort = {
      id: `port-${type}-${node.id}-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${existingPorts.length + 1}`,
      type,
      position: { x, y: constrainedY }
    };
    
    onUpdate({
      messagePorts: [...node.messagePorts, newPort]
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const removePort = (portId: string) => {
    // Clean up internal connections first
    if (onDeleteInternalConnection) {
      internalConnections.forEach(conn => {
        if (conn.sourceElementId === portId || conn.targetElementId === portId) {
          onDeleteInternalConnection(conn.id);
        }
      });
    }
    
    // Remove the port
    onUpdate({
      messagePorts: node.messagePorts.filter(p => p.id !== portId)
    });
  };

  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true);
    setTitleValue(node.name);
  };

  const handleTitleSubmit = () => {
    onUpdate({ name: titleValue.trim() || node.name });
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleValue(node.name);
      setIsEditingTitle(false);
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute bg-white border-2 rounded-lg shadow-lg select-none transition-all duration-200 ${
        isSelected ? 'border-blue-500 shadow-blue-200' : isDragOver ? 'border-green-500 shadow-green-200' : 'border-gray-300'
      } ${isDragging ? 'opacity-80 scale-105' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        zIndex: isSelected ? 10 : 5
      }}
      onMouseDown={handleMouseDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Resize Handles */}
      {isSelected && (
        <>
          <div
            className="resize-handle absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize -bottom-1 -right-1"
            data-direction="bottom-right"
          />
        </>
      )}

      {/* Header */}
      <div className="title-bar flex items-center justify-between p-2 bg-gray-50 rounded-t-lg border-b border-gray-200 cursor-move">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleExpanded}
            className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            {node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="font-semibold text-gray-800 text-sm bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span 
              className="font-semibold text-gray-800 text-sm cursor-text hover:bg-gray-100 px-2 py-1 rounded"
              onClick={handleTitleDoubleClick}
              title="Click to edit"
            >
              {node.name}
            </span>
          )}
          <button
            className="w-5 h-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-sm ml-2"
            onClick={handleDelete}
            title="Delete Node"
          >
            <X size={12} />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => addPort('input')}
              className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors cursor-pointer"
              title="Add Input Port"
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                <Plus size={12} />
              </div>
            </button>
            <button
              onClick={() => addPort('output')}
              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
              title="Add Output Port"
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                <Plus size={12} />
              </div>
            </button>
          </div>
          <div className="text-xs text-gray-400">
            {node.size.width}×{node.size.height}
          </div>
        </div>
      </div>

      {/* Message Ports */}
      {node.messagePorts.map(port => (
        <div key={port.id} className="relative group">
          <div
            className={`message-port absolute w-3 h-3 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-125 ${
              port.type === 'input' 
                ? 'bg-green-500 border-green-600' 
                : 'bg-red-500 border-red-600'
            } ${
              connectingFrom && connectingFrom.portType !== port.type 
                ? 'scale-125 shadow-lg' 
                : ''
            } ${
              internalConnectingFrom && internalConnectingFrom.portType !== port.type 
                ? 'scale-125 shadow-lg ring-2 ring-blue-400' 
                : ''
            } ${
              draggingPort === port.id 
                ? 'cursor-grabbing scale-125 shadow-lg' 
                : 'cursor-grab hover:cursor-grab'
            }`}
            style={{
              left: port.type === 'input' ? -6 : port.position.x - 6,
              top: port.position.y - 6
            }}
            data-port-id={port.id}
            onClick={(e) => {
              e.stopPropagation();
              if (!draggingPort) {
                // Check if we're in internal connection mode
                if (internalConnectingFrom) {
                  // Handle internal connections (port to element or element to port)
                  onInternalPortClick?.(node.id, port.id, port.type);
                } else if (connectingFrom) {
                  // Handle external connections (node to node)
                  onPortClick(node.id, port.id, port.type);
                } else {
                  // Start new connection (could be internal or external)
                  // For input ports, prefer internal connections to elements
                  if (port.type === 'input' && node.behaviouralElements.length > 0) {
                    onInternalPortClick?.(node.id, port.id, port.type);
                  } else {
                    onPortClick(node.id, port.id, port.type);
                  }
                }
              }
            }}
            title={`${port.name} (${port.type})`}
          />
          
          <button
            className="absolute w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs hover:bg-red-600"
            style={{
              top: port.position.y - 2,
              left: port.type === 'input' ? port.position.x - 20 : port.position.x + 15
            }}
            onClick={(e) => {
              e.stopPropagation();
              removePort(port.id);
            }}
            title={`Delete ${port.name}`}
          >
            <Minus size={10} />
          </button>
        </div>
      ))}

      {/* Behavioral Elements Area */}
      {node.isExpanded && (
        <div className="behavior-area p-2 bg-gray-25 relative" style={{ height: node.size.height - 60 }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-600">
              Internal Behavior ({node.behaviouralElements.length})
            </h4>
            <div className="flex space-x-1">
              <button
                onClick={() => addBehaviouralElement('SendData')}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Add Send Data"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => addBehaviouralElement('ReceiveData')}
                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                title="Add Receive Data"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          
          <div className={`relative border border-dashed rounded-lg transition-colors overflow-hidden ${
            isDragOver ? 'border-green-400 bg-green-50' : 'border-gray-200'
          }`} style={{ height: node.size.height - 120, minHeight: 150 }}>
            {/* Internal Connections SVG */}
            <svg 
              className="absolute pointer-events-none" 
              style={{ 
                left: 0, 
                top: 0, 
                width: '100%', 
                height: '100%', 
                zIndex: 5 
              }}
            >
              {internalConnections
                .filter(conn => conn.nodeId === node.id)
                .map(connection => {
                  const sourceElement = node.behaviouralElements.find(el => el.id === connection.sourceElementId);
                  const targetElement = node.behaviouralElements.find(el => el.id === connection.targetElementId);
                  const sourcePort = node.messagePorts.find(p => p.id === connection.sourceElementId);
                  const targetPort = node.messagePorts.find(p => p.id === connection.targetElementId);
                  
                  let sourceX = 0, sourceY = 0, targetX = 0, targetY = 0;
                  let connectionColor = "#EF4444"; // Default red for element-to-element
                  
                  // Determine connection type and color
                  if (sourcePort && targetElement && sourcePort.type === 'input') {
                    // Input port to element (special connection)
                    connectionColor = "#10B981"; // Green for input port connections
                  } else if (sourceElement && targetPort && targetPort.type === 'output') {
                    // Element to output port (special connection)
                    connectionColor = "#3B82F6"; // Blue for output port connections
                  }
                  
                  // Calculate coordinates
                  if (sourceElement) {
                    // Source is a behavioral element
                    sourceX = sourceElement.position.x + sourceElement.size.width;
                    sourceY = sourceElement.position.y + sourceElement.size.height / 2;
                  } else if (sourcePort) {
                    // Source is a message port
                    sourceX = sourcePort.position.x + (sourcePort.type === 'input' ? 6 : -6);
                    sourceY = sourcePort.position.y - 60; // Adjust for behavioral area offset
                  }
                  
                  if (targetElement) {
                    // Target is a behavioral element
                    targetX = targetElement.position.x;
                    targetY = targetElement.position.y + targetElement.size.height / 2;
                  } else if (targetPort) {
                    // Target is a message port
                    targetX = targetPort.position.x + (targetPort.type === 'output' ? -6 : 6);
                    targetY = targetPort.position.y - 60; // Adjust for behavioral area offset
                  }
                  
                  // Create curved path
                  const controlOffset = Math.abs(targetX - sourceX) * 0.5;
                  const controlX1 = sourceX + controlOffset;
                  const controlX2 = targetX - controlOffset;
                  const pathD = `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`;
                  
                  return (
                    <g key={connection.id}>
                      <path
                        d={pathD}
                        stroke={connectionColor}
                        strokeWidth="2"
                        fill="none"
                        strokeOpacity="0.8"
                        markerEnd={`url(#internal-arrowhead-${connectionColor.replace('#', '')})`}
                      />
                    </g>
                  );
                })}
              
              {/* Arrow marker definitions for different colors */}
              <defs>
                <marker
                  id="internal-arrowhead-EF4444"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    fill="#EF4444"
                  />
                </marker>
                <marker
                  id="internal-arrowhead-10B981"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    fill="#10B981"
                  />
                </marker>
                <marker
                  id="internal-arrowhead-3B82F6"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    fill="#3B82F6"
                  />
                </marker>
              </defs>
            </svg>
            
            {node.behaviouralElements.map(element => (
              <BehaviouralElementComponent
                key={element.id}
                element={element}
                onUpdate={(updates) => {
                  const updatedElements = node.behaviouralElements.map(el =>
                    el.id === element.id ? { ...el, ...updates } : el
                  );
                  onUpdate({ behaviouralElements: updatedElements });
                }}
                onPortClick={(elementId, portType) => {
                  onInternalPortClick?.(node.id, elementId, portType);
                }}
                connectingFrom={
                  internalConnectingFrom?.nodeId === node.id 
                    ? { elementId: internalConnectingFrom.elementId, portType: internalConnectingFrom.portType }
                    : null
                }
                onDelete={() => {
                  if (onDeleteBehaviouralElement) {
                    // Removes the element AND every internal link (in/out) that touched it
                    onDeleteBehaviouralElement(element.id);
                  } else {
                    const updatedElements = node.behaviouralElements.filter(el => el.id !== element.id);
                    onUpdate({ behaviouralElements: updatedElements });
                  }
                }}
              />
            ))}
            
            {node.behaviouralElements.length === 0 && (
              <div className={`absolute inset-0 flex items-center justify-center transition-colors ${
                isDragOver ? 'text-green-600' : 'text-gray-400'
              }`}>
                {isDragOver ? '📥 Drop element here' : 'Drag data elements from toolbox'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataNodeComponent;