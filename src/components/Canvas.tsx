import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DataNode, Connection, Position, BehaviouralElement, InternalConnection, Viewport } from '../types/ModelTypes';
import DataNodeComponent from './DataNodeComponent';
import ConnectionComponent from './ConnectionComponent';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Hand, MousePointer, Sparkles } from 'lucide-react';

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
  onAddDataNode?: (item: any, position: Position) => void;
  onAutoLayout?: () => void;
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
  onDeleteInternalConnection,
  onAddDataNode,
  onAutoLayout
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; viewportX: number; viewportY: number }>({
    x: 0,
    y: 0,
    viewportX: 0,
    viewportY: 0
  });

  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
  } | null>(null);

  const [mouseWorldPos, setMouseWorldPos] = useState<Position>({ x: 0, y: 0 });
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);

  // Convert screen coordinates to virtual world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number): Position => {
    if (!canvasRef.current) return { x: screenX, y: screenY };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom
    };
  }, [viewport]);

  // Handle Mouse Move for canvas & connection rubber-band
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setMouseWorldPos(worldPos);

    if (isPanning) {
      const deltaX = e.clientX - panStartRef.current.x;
      const deltaY = e.clientY - panStartRef.current.y;
      setViewport(prev => ({
        ...prev,
        x: panStartRef.current.viewportX + deltaX,
        y: panStartRef.current.viewportY + deltaY
      }));
    }
  }, [isPanning, screenToWorld]);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Zoom delta factor
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.5, Math.max(0.2, viewport.zoom * zoomFactor));

    if (newZoom === viewport.zoom) return;

    // Keep point under cursor invariant
    const newX = cursorX - (cursorX - viewport.x) * (newZoom / viewport.zoom);
    const newY = cursorY - (cursorY - viewport.y) * (newZoom / viewport.zoom);

    setViewport({
      x: newX,
      y: newY,
      zoom: newZoom
    });
  }, [viewport]);

  // Mouse Down for Panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle click, or left-click when space is held or panMode is enabled
    if (e.button === 1 || ((isSpacePressed || panMode) && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        viewportX: viewport.x,
        viewportY: viewport.y
      };
    }
  }, [isSpacePressed, panMode, viewport]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
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
        const behaviorArea = (e.currentTarget as HTMLElement).querySelector('.behavior-area');
        const behaviorRect = behaviorArea?.getBoundingClientRect();
        
        if (behaviorRect) {
          // Adjust position inside behavioral area scaling with zoom
          const x = Math.max(5, (e.clientX - behaviorRect.left) / viewport.zoom - 60);
          const y = Math.max(5, (e.clientY - behaviorRect.top) / viewport.zoom - 20);
          
          const newElement: BehaviouralElement = {
            id: `${nodeId}_behavior_${Date.now()}`,
            name: item.name,
            type: item.type,
            position: { x, y },
            size: { width: 120, height: 40 },
            properties: item.properties || {},
            icon: item.icon,
            color: item.color
          };
          
          onAddBehaviouralElement(nodeId, newElement);
        }
      }
    } catch (error) {
      console.error('Failed to add behavioral element:', error);
    }
  }, [dataNodes, onAddBehaviouralElement, viewport.zoom]);

  // Handle drop from toolbox directly on canvas
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dragData = e.dataTransfer.getData('application/json');
      if (!dragData) return;
      const item = JSON.parse(dragData);
      if (item.type === 'DataNode') {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        if (onAddDataNode) {
          onAddDataNode(item, {
            x: Math.max(0, worldPos.x - 90),
            y: Math.max(0, worldPos.y - 40)
          });
        }
      }
    } catch (err) {
      console.error('Canvas drop error:', err);
    }
  }, [screenToWorld, onAddDataNode]);

  // Keyboard Shortcuts: Spacebar for pan, Escape to cancel connection, Delete to remove
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        setIsSpacePressed(true);
      }
      if (e.key === 'Escape') {
        setConnectingFrom(null);
      }
      if (e.key === 'Delete' && selectedElement && (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        onDeleteElement(selectedElement);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElement, onDeleteElement]);

  // Zoom Controls Handlers
  const handleZoomIn = () => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newZoom = Math.min(2.5, viewport.zoom * 1.2);
    setViewport({
      x: cx - (cx - viewport.x) * (newZoom / viewport.zoom),
      y: cy - (cy - viewport.y) * (newZoom / viewport.zoom),
      zoom: newZoom
    });
  };

  const handleZoomOut = () => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newZoom = Math.max(0.2, viewport.zoom * 0.8);
    setViewport({
      x: cx - (cx - viewport.x) * (newZoom / viewport.zoom),
      y: cy - (cy - viewport.y) * (newZoom / viewport.zoom),
      zoom: newZoom
    });
  };

  const handleResetZoom = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const handleZoomToFit = () => {
    if (!canvasRef.current || dataNodes.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    dataNodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.size.width);
      maxY = Math.max(maxY, node.position.y + node.size.height);
    });

    const padding = 80;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const scaleX = rect.width / contentWidth;
    const scaleY = rect.height / contentHeight;
    const fitZoom = Math.min(1.5, Math.max(0.3, Math.min(scaleX, scaleY)));

    const newX = (rect.width - (maxX - minX) * fitZoom) / 2 - minX * fitZoom;
    const newY = (rect.height - (maxY - minY) * fitZoom) / 2 - minY * fitZoom;

    setViewport({
      x: newX,
      y: newY,
      zoom: fitZoom
    });
  };

  // Compute live rubber-band wire path when connecting
  let rubberBandPath: string | null = null;
  if (connectingFrom) {
    const sourceNode = dataNodes.find(n => n.id === connectingFrom.nodeId);
    const sourcePort = sourceNode?.messagePorts.find(p => p.id === connectingFrom.portId);
    if (sourceNode && sourcePort) {
      const startX = sourceNode.position.x + sourcePort.position.x;
      const startY = sourceNode.position.y + sourcePort.position.y;
      const endX = mouseWorldPos.x;
      const endY = mouseWorldPos.y;

      const deltaX = (endX - startX) * 0.5;
      rubberBandPath = `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;
    }
  }

  const cursorClass = isPanning
    ? 'cursor-grabbing'
    : isSpacePressed || panMode
    ? 'cursor-grab'
    : 'cursor-default';

  return (
    <div
      ref={canvasRef}
      className={`flex-1 bg-slate-50 relative overflow-hidden select-none ${cursorClass}`}
      style={{ minHeight: '100%' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      onDrop={handleCanvasDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Dynamic Scaled Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(#94a3b8 1.2px, transparent 1.2px)`,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`
        }}
      />

      {/* Transformed World Layer */}
      <div
        className="absolute inset-0 pointer-events-auto origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          width: '10000px',
          height: '10000px'
        }}
      >
        {/* SVG Layer for Connections */}
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

          {/* Live Rubber-band Connection Curve */}
          {rubberBandPath && (
            <path
              d={rubberBandPath}
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Data Nodes */}
        {dataNodes.map(node => (
          <DataNodeComponent
            key={node.id}
            node={node}
            zoom={viewport.zoom}
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
      </div>

      {/* Floating Canvas Navigation Toolbar */}
      <div className="absolute bottom-5 left-5 z-30 flex items-center bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-2 py-1.5 space-x-1.5">
        <button
          onClick={() => setPanMode(!panMode)}
          className={`p-1.5 rounded-lg text-sm transition-colors ${
            panMode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={panMode ? "Disable Pan Mode" : "Enable Pan Mode (or hold Spacebar)"}
        >
          {panMode ? <Hand size={16} /> : <MousePointer size={16} />}
        </button>

        <div className="h-4 w-px bg-gray-200" />

        <button
          onClick={handleZoomOut}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom Out (Wheel Down)"
        >
          <ZoomOut size={16} />
        </button>

        <button
          onClick={handleResetZoom}
          className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg min-w-12 text-center"
          title="Reset Zoom to 100%"
        >
          {Math.round(viewport.zoom * 100)}%
        </button>

        <button
          onClick={handleZoomIn}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom In (Wheel Up)"
        >
          <ZoomIn size={16} />
        </button>

        <div className="h-4 w-px bg-gray-200" />

        {onAutoLayout && (
          <button
            onClick={() => {
              onAutoLayout();
              setTimeout(handleZoomToFit, 100);
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors flex items-center space-x-1"
            title="Auto-Layout DAG (Organize nodes into clean hierarchical layers)"
          >
            <Sparkles size={16} />
          </button>
        )}

        <button
          onClick={handleZoomToFit}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom to Fit all nodes"
        >
          <Maximize2 size={16} />
        </button>

        <button
          onClick={handleResetZoom}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Floating Connection Status Toast */}
      {(connectingFrom || internalConnectingFrom) && (
        <div className="absolute top-4 left-4 z-40 bg-blue-600 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>
            {connectingFrom && `Connecting ${connectingFrom.portType} port... Click a compatible port or press Esc to cancel`}
            {internalConnectingFrom && `Connecting internal ${internalConnectingFrom.portType} port... Click target or press Esc to cancel`}
          </span>
        </div>
      )}

      {/* Empty State Instruction */}
      {dataNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl max-w-sm pointer-events-auto">
            <div className="text-4xl mb-3">🏗️</div>
            <h3 className="text-base font-bold text-gray-800">Your Canvas is Ready</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Drag <span className="font-semibold text-blue-600">Data Node</span> from the toolbox on the left to begin modeling your data architecture.
            </p>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center space-x-3 text-[11px] text-gray-400">
              <span>Scroll to Zoom</span>
              <span>•</span>
              <span>Space + Drag to Pan</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;