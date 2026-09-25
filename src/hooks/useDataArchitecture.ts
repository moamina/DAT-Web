import { useState, useCallback } from 'react';
import { DataArchitecture, DataNode, Connection, BehaviouralElement, ToolboxItem, InternalConnection } from '../types/ModelTypes';
import { computeAutoLayout } from '../utils/autoLayout';

interface ArchitectureSnapshot {
  architecture: DataArchitecture;
  internalConnections: InternalConnection[];
}

export const useDataArchitecture = () => {
  const [architecture, setArchitecture] = useState<DataArchitecture>({
    id: 'arch-1',
    name: 'Data Architecture Model',
    dataNodes: [],
    connections: []
  });

  const [internalConnections, setInternalConnections] = useState<InternalConnection[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [internalConnectingFrom, setInternalConnectingFrom] = useState<{
    nodeId: string;
    elementId: string;
    portType: 'input' | 'output';
  } | null>(null);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<{
    past: ArchitectureSnapshot[];
    future: ArchitectureSnapshot[];
  }>({
    past: [],
    future: []
  });

  const recordSnapshot = useCallback(() => {
    setHistory(prev => ({
      past: [...prev.past.slice(-25), { architecture, internalConnections }],
      future: []
    }));
  }, [architecture, internalConnections]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);

      setArchitecture(previous.architecture);
      setInternalConnections(previous.internalConnections);
      setSelectedElement(null);
      setInternalConnectingFrom(null);

      return {
        past: newPast,
        future: [{ architecture, internalConnections }, ...prev.future.slice(0, 25)]
      };
    });
  }, [architecture, internalConnections]);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      setArchitecture(next.architecture);
      setInternalConnections(next.internalConnections);
      setSelectedElement(null);
      setInternalConnectingFrom(null);

      return {
        past: [...prev.past.slice(-25), { architecture, internalConnections }],
        future: newFuture
      };
    });
  }, [architecture, internalConnections]);

  const clearCanvas = useCallback(() => {
    recordSnapshot();
    setArchitecture({
      id: `arch-${Date.now()}`,
      name: 'Data Architecture Model',
      dataNodes: [],
      connections: []
    });
    setInternalConnections([]);
    setSelectedElement(null);
    setInternalConnectingFrom(null);
  }, [recordSnapshot]);

  const addDataNode = useCallback((item: ToolboxItem, position: { x: number; y: number }) => {
    recordSnapshot();
    const nodeWidth = 180;
    const nodeHeight = 80;
    
    const newNode: DataNode = {
      id: `node-${Date.now()}`,
      name: item.name,
      position,
      size: { width: nodeWidth, height: nodeHeight },
      messagePorts: [
        {
          id: `port-in-${Date.now()}`,
          name: 'Input',
          type: 'input',
          position: { x: 0, y: 40 }
        },
        {
          id: `port-out-${Date.now()}`,
          name: 'Output',
          type: 'output',
          position: { x: nodeWidth, y: 40 }
        }
      ],
      behaviouralElements: [],
      internalLinks: [],
      isExpanded: true
    };

    setArchitecture(prev => ({
      ...prev,
      dataNodes: [...prev.dataNodes, newNode]
    }));

    return newNode.id;
  }, [recordSnapshot]);

  const updateNode = useCallback((nodeId: string, updates: Partial<DataNode>) => {
    const currentNode = architecture.dataNodes.find(n => n.id === nodeId);
    
    setArchitecture(prev => ({
      ...prev,
      dataNodes: prev.dataNodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));

    // Auto-connect new ports to existing elements if ports were added
    if (updates.messagePorts && currentNode && updates.messagePorts.length > currentNode.messagePorts.length) {
      const newPorts = updates.messagePorts.filter(newPort => 
        !currentNode.messagePorts.some(oldPort => oldPort.id === newPort.id)
      );

      newPorts.forEach(newPort => {
        if (newPort.type === 'input') {
          currentNode.behaviouralElements
            .filter(el => el.type === 'ReceiveData')
            .forEach(receiveElement => {
              const newConnection: InternalConnection = {
                id: `internal-conn-${Date.now()}-${Math.random()}`,
                sourceElementId: newPort.id,
                targetElementId: receiveElement.id,
                nodeId: nodeId
              };
              setInternalConnections(prev => [...prev, newConnection]);
            });
        } else if (newPort.type === 'output') {
          currentNode.behaviouralElements
            .filter(el => el.type === 'SendData')
            .forEach(sendElement => {
              const newConnection: InternalConnection = {
                id: `internal-conn-${Date.now()}-${Math.random()}`,
                sourceElementId: sendElement.id,
                targetElementId: newPort.id,
                nodeId: nodeId
              };
              setInternalConnections(prev => [...prev, newConnection]);
            });
        }
      });
    }
  }, [architecture.dataNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    recordSnapshot();
    setArchitecture(prev => ({
      ...prev,
      dataNodes: prev.dataNodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn => 
        conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
      )
    }));
    setInternalConnections(prev => prev.filter(conn => conn.nodeId !== nodeId));
  }, [recordSnapshot]);

  const addConnection = useCallback((
    sourceNodeId: string,
    targetNodeId: string,
    sourcePortId: string,
    targetPortId: string
  ) => {
    recordSnapshot();
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      sourceNodeId,
      targetNodeId,
      sourcePortId,
      targetPortId,
      label: 'Data Flow'
    };

    setArchitecture(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
  }, [recordSnapshot]);

  const updateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setArchitecture(prev => ({
      ...prev,
      connections: prev.connections.map(conn =>
        conn.id === connectionId ? { ...conn, ...updates } : conn
      )
    }));
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    recordSnapshot();
    setArchitecture(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== connectionId)
    }));
  }, [recordSnapshot]);

  const addBehaviouralElement = useCallback((nodeId: string, element: BehaviouralElement) => {
    recordSnapshot();
    const node = architecture.dataNodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedElements = [...node.behaviouralElements, element];
    
    setArchitecture(prev => ({
      ...prev,
      dataNodes: prev.dataNodes.map(n =>
        n.id === nodeId ? { ...n, behaviouralElements: updatedElements } : n
      )
    }));

    // Auto-create special connections for Receive Data and Send Data elements
    if (element.type === 'ReceiveData') {
      const inputPorts = node.messagePorts.filter(p => p.type === 'input');
      const newConns: InternalConnection[] = inputPorts.map(inputPort => ({
        id: `internal-conn-${Date.now()}-${Math.random()}`,
        sourceElementId: inputPort.id,
        targetElementId: element.id,
        nodeId: nodeId
      }));
      if (newConns.length > 0) {
        setInternalConnections(prev => [...prev, ...newConns]);
      }
    } else if (element.type === 'SendData') {
      const outputPorts = node.messagePorts.filter(p => p.type === 'output');
      const newConns: InternalConnection[] = outputPorts.map(outputPort => ({
        id: `internal-conn-${Date.now()}-${Math.random()}`,
        sourceElementId: element.id,
        targetElementId: outputPort.id,
        nodeId: nodeId
      }));
      if (newConns.length > 0) {
        setInternalConnections(prev => [...prev, ...newConns]);
      }
    }
  }, [architecture.dataNodes, recordSnapshot]);

  const deleteBehaviouralElement = useCallback((nodeId: string, elementId: string) => {
    recordSnapshot();
    setArchitecture(prev => ({
      ...prev,
      dataNodes: prev.dataNodes.map(n =>
        n.id === nodeId
          ? { ...n, behaviouralElements: n.behaviouralElements.filter(el => el.id !== elementId) }
          : n
      )
    }));
    // Remove every internal link (in and out) that pointed to this element
    setInternalConnections(prev =>
      prev.filter(conn => conn.sourceElementId !== elementId && conn.targetElementId !== elementId)
    );
  }, [recordSnapshot]);

  const addInternalConnection = useCallback((
    nodeId: string,
    sourceElementId: string,
    targetElementId: string
  ) => {
    recordSnapshot();
    const newConnection: InternalConnection = {
      id: `internal-conn-${Date.now()}`,
      sourceElementId,
      targetElementId,
      nodeId
    };

    setInternalConnections(prev => [...prev, newConnection]);
  }, [recordSnapshot]);

  const deleteInternalConnection = useCallback((connectionId: string) => {
    recordSnapshot();
    setInternalConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, [recordSnapshot]);

  const handleInternalPortClick = useCallback((
    nodeId: string,
    elementId: string,
    portType: 'input' | 'output' | 'nodeOutput'
  ) => {
    if (internalConnectingFrom) {
      if (internalConnectingFrom.nodeId === nodeId && internalConnectingFrom.elementId !== elementId) {
        const isSourcePort = internalConnectingFrom.elementId.startsWith('port-');
        const isTargetPort = elementId.startsWith('port-');
        
        let isValidConnection = false;
        
        // Rule 1: Input ports to element input ports
        if (isSourcePort && !isTargetPort && portType === 'input') {
          const sourcePort = architecture.dataNodes
            .find(n => n.id === nodeId)?.messagePorts
            .find(p => p.id === internalConnectingFrom.elementId);
          isValidConnection = sourcePort?.type === 'input';
        }
        // Rule 2: Element output ports to element input ports
        else if (!isSourcePort && !isTargetPort) {
          if (internalConnectingFrom.portType === 'output' && portType === 'input') {
            isValidConnection = true;
          }
        }
        // Rule 3: Element output ports to node output ports
        else if (!isSourcePort && isTargetPort && internalConnectingFrom.portType === 'output') {
          const targetPort = architecture.dataNodes
            .find(n => n.id === nodeId)?.messagePorts
            .find(p => p.id === elementId);
          isValidConnection = targetPort?.type === 'output';
        }
        // Rule 4: Send Data special blue port to node output ports
        else if (!isSourcePort && isTargetPort && internalConnectingFrom.portType === 'nodeOutput') {
          const sourceElement = architecture.dataNodes
            .find(n => n.id === nodeId)?.behaviouralElements
            .find(el => el.id === internalConnectingFrom.elementId);
          const targetPort = architecture.dataNodes
            .find(n => n.id === nodeId)?.messagePorts
            .find(p => p.id === elementId);
          isValidConnection = sourceElement?.type === 'SendData' && targetPort?.type === 'output';
        }
        
        if (isValidConnection) {
          addInternalConnection(nodeId, internalConnectingFrom.elementId, elementId);
        }
      }
      setInternalConnectingFrom(null);
    } else {
      setInternalConnectingFrom({ nodeId, elementId, portType });
    }
  }, [internalConnectingFrom, addInternalConnection, architecture.dataNodes]);

  const deleteElement = useCallback((elementId: string) => {
    // Check if it's a node
    const node = architecture.dataNodes.find(n => n.id === elementId);
    if (node) {
      deleteNode(elementId);
      return;
    }

    // Check if it's a connection
    const connection = architecture.connections.find(c => c.id === elementId);
    if (connection) {
      deleteConnection(elementId);
      return;
    }

    // Check if it's an internal connection
    const internalConnection = internalConnections.find(c => c.id === elementId);
    if (internalConnection) {
      deleteInternalConnection(elementId);
      return;
    }
  }, [architecture, internalConnections, deleteNode, deleteConnection, deleteInternalConnection]);

  const exportModel = useCallback(() => {
    return JSON.stringify({ ...architecture, internalConnections }, null, 2);
  }, [architecture, internalConnections]);

  const importModel = useCallback((modelJson: string) => {
    try {
      recordSnapshot();
      const parsedModel = JSON.parse(modelJson);
      setArchitecture({
        id: parsedModel.id || `arch-${Date.now()}`,
        name: parsedModel.name || 'Imported Architecture',
        dataNodes: parsedModel.dataNodes || [],
        connections: parsedModel.connections || []
      });
      setInternalConnections(parsedModel.internalConnections || []);
      setSelectedElement(null);
      setInternalConnectingFrom(null);
    } catch (error) {
      console.error('Failed to import model:', error);
    }
  }, [recordSnapshot]);

  const applyAutoLayout = useCallback(() => {

    if (architecture.dataNodes.length === 0) return;
    recordSnapshot();
    const newPositions = computeAutoLayout(architecture.dataNodes, architecture.connections);
    setArchitecture(prev => ({
      ...prev,
      dataNodes: prev.dataNodes.map(node =>
        newPositions[node.id] ? { ...node, position: newPositions[node.id] } : node
      )
    }));
  }, [architecture.dataNodes, architecture.connections, recordSnapshot]);

  return {
    architecture,
    internalConnections,
    selectedElement,
    internalConnectingFrom,
    deleteBehaviouralElement,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    clearCanvas,
    applyAutoLayout,
    recordSnapshot,
    setSelectedElement,
    setInternalConnectingFrom,
    addDataNode,
    updateNode,
    deleteNode,
    addConnection,
    updateConnection,
    deleteConnection,
    addInternalConnection,
    deleteInternalConnection,
    handleInternalPortClick,
    addBehaviouralElement,
    deleteElement,
    exportModel,
    importModel
  };
};