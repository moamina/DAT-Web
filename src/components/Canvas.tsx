import React, { useState, useRef, useCallback } from 'react';
import { DataNode, Connection, Position, BehaviouralElement, DataFlow, InternalConnection } from '../types/ModelTypes';
import DataNodeComponent from './DataNodeComponent';
import ConnectionComponent from './ConnectionComponent';

interface CanvasProps {
  dataNodes: DataNode[];
  connections: Connection[];
  selectedElement: string | null;
  onUpdateNode: (nodeId: string, updates: Partial<DataNode>) => void;
  onUpdateConnection: (connectionId: string, updates: Partial<Connection>) => void;
  onSelectElement: (elementId: string | null) => void;
  onDeleteElement: (elementId: string) => void;
  onAddBehaviouralElement: (nodeId: string, element: BehaviouralElement) => void;
  onConnectNodes: (sourceNodeId: string, targetNodeId: string, sourcePortId: string, targetPortId: string) => void;
  internalConnections: InternalConnection[];
  internalConnectingFrom: { nodeId: string; elementId: string; portType: 'input' | 'output' } | null;
  onInternalPortClick: (nodeId: string, elementId: string, portType: 'input' | 'output') => void;
  onDeleteInternalConnection: (connectionId: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  dataNodes,
  connections,
  selectedElement,
  onUpdateNode,
  onUpdateConnection,
  onSelectElement,
  onDeleteElement,
  onAddBehaviouralElement,
  onConnectNodes,
  internalConnections,
  internalConnectingFrom,
  onInternalPortClick,
  onDeleteInternalConnection
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
  } | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null);
      setConnectingFrom(null);
    }
  }, [onSelectElement]);

  const handleNodeDrag = useCallback((nodeId: string, newPosition: Position) => {
    onUpdateNode(nodeId, { position: newPosition });
  }, [onUpdateNode]);

  const handlePortClick = useCallback((nodeId: string, portId: string, portType: 'input' | 'output') => {
    if (connectingFrom) {
      if (connectingFrom.portType !== portType && connectingFrom.nodeId !== nodeId) {
        // Create connection
        const sourceNodeId = connectingFrom.portType === 'output' ? connectingFrom.nodeId : nodeId;
        const targetNodeId = connectingFrom.portType === 'output' ? nodeId : connectingFrom.nodeId;
        const sourcePortId = connectingFrom.portType === 'output' ? connectingFrom.portId : portId;
        const targetPortId = connectingFrom.portType === 'output' ? portId : connectingFrom.portId;
        
        onConnectNodes(sourceNodeId, targetNodeId, sourcePortId, targetPortId);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom({ nodeId, portId, portType });
    }
  }, [connectingFrom, onConnectNodes]);

  const handleNodeDragOver = useCallback((nodeId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverNode(nodeId);
  }, []);

  const handleNodeDragLeave = useCallback((nodeId: string) => {
    setDragOverNode(null);
  }, []);

  const handleNodeDrop = useCallback((nodeId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverNode(null);
    
    try {
      const item = JSON.parse(e.dataTransfer.getData('application/json'));
      const node = dataNodes.find(n => n.id === nodeId);
      if (node && node.isExpanded) {
        // Calculate position relative to the behavioral area
        const rect = e.currentTarget.getBoundingClientRect();
        const behaviorArea = (e.currentTarget as HTMLElement).querySelector('.behavior-area');
        const behaviorRect = behaviorArea?.getBoundingClientRect();
        
        if (behaviorRect) {
          const x = Math.max(5, e.clientX - behaviorRect.left - 60);
          const y = Math.max(5, e.clientY - behaviorRect.top - 20);
          
          const newElement: BehaviouralElement = {
            id: `${nodeId}_behavior_${Date.now()}`,
            name: item.name,
            type: item.type,
            position: { x, y },
            size: { width: 120, height: 40 },
            properties: item.properties || {}
          };
          
          onAddBehaviouralElement(nodeId, newElement);
        }
      }
    } catch (error) {
      console.error('Failed to add behavioral element:', error);
    }
  }, [dataNodes, onAddBehaviouralElement]);
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete' && selectedElement) {
      onDeleteElement(selectedElement);
    }
  }, [selectedElement, onDeleteElement]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div 
      ref={canvasRef}
      className="flex-1 bg-gray-50 relative overflow-auto"
      onClick={handleCanvasClick}
      style={{ minHeight: '100vh' }}
    >
      <div className="relative w-full h-full min-w-[2000px] min-h-[2000px]">
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map(connection => (
            <ConnectionComponent
              key={connection.id}
              connection={connection}
              dataNodes={dataNodes}
              isSelected={selectedElement === connection.id}
              onSelect={() => onSelectElement(connection.id)}
            />
          ))}
        </svg>

        {/* Data Nodes */}
        {dataNodes.map(node => (
          <DataNodeComponent
            key={node.id}
            node={node}
            isSelected={selectedElement === node.id}
            isDragOver={dragOverNode === node.id}
            onSelect={() => onSelectElement(node.id)}
            onDrag={handleNodeDrag}
            onUpdate={(updates) => onUpdateNode(node.id, updates)}
            onPortClick={handlePortClick}
            onAddBehaviouralElement={(element) => onAddBehaviouralElement(node.id, element)}
            onDragOver={(e) => handleNodeDragOver(node.id, e)}
            onDragLeave={() => handleNodeDragLeave(node.id)}
            onDrop={(e) => handleNodeDrop(node.id, e)}
            connectingFrom={connectingFrom}
            internalConnectingFrom={internalConnectingFrom}
            onInternalPortClick={onInternalPortClick}
            internalConnections={internalConnections}
            onDelete={() => onDeleteElement(node.id)}
            onDeleteInternalConnection={onDeleteInternalConnection}
          />
        ))}

        {/* Connection preview */}
        {(connectingFrom || internalConnectingFrom) && (
          <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg shadow-md z-50">
            {connectingFrom && `Connecting from ${connectingFrom.portType} port... Click on a ${connectingFrom.portType === 'input' ? 'output' : 'input'} port to connect`}
            {internalConnectingFrom && `Connecting internal ${internalConnectingFrom.portType} port... Click on a ${internalConnectingFrom.portType === 'input' ? 'output' : 'input'} port to connect`}
          </div>
        )}

        {/* Drop instruction */}
        {dataNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg mb-2">🏗️</div>
              <div className="text-sm">Drag "Data Node" from toolbox to start building</div>
              <div className="text-xs mt-1">Then expand nodes and drag data elements inside</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;