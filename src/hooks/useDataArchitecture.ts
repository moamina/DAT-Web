import { useState, useCallback } from 'react';
import { DataArchitecture, DataNode, Connection, BehaviouralElement, ToolboxItem, InternalConnection } from '../types/ModelTypes';

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

  const addDataNode = useCallback((item: ToolboxItem, position: { x: number; y: number }) => {
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
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<DataNode>) => {
    setArchitecture(prev => ({
      ...prev,
      dataNodes: prev.dataNodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
    
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setArchitecture(prev => ({
      ...prev,
      dataNodes: prev.dataNodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn => 
        conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
      )
    }));
  }, []);

  const addConnection = useCallback((
    sourceNodeId: string,
    targetNodeId: string,
    sourcePortId: string,
    targetPortId: string
  ) => {
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
  }, []);

  const updateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setArchitecture(prev => ({
      ...prev,
      connections: prev.connections.map(conn =>
        conn.id === connectionId ? { ...conn, ...updates } : conn
      )
    }));
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    setArchitecture(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== connectionId)
    }));
    
    // Also remove any connections that reference deleted ports
    setArchitecture(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => {
        const sourceNode = prev.dataNodes.find(n => n.id === conn.sourceNodeId);
        const targetNode = prev.dataNodes.find(n => n.id === conn.targetNodeId);
        const sourcePortExists = sourceNode?.messagePorts.some(p => p.id === conn.sourcePortId);
        const targetPortExists = targetNode?.messagePorts.some(p => p.id === conn.targetPortId);
        return sourcePortExists && targetPortExists;
      })
    }));
  }, []);

  const addBehaviouralElement = useCallback((nodeId: string, element: BehaviouralElement) => {
    updateNode(nodeId, {
      behaviouralElements: [
        ...architecture.dataNodes.find(n => n.id === nodeId)?.behaviouralElements || [],
        element
      ]
    });

    // Auto-create special connections for Receive Data and Send Data elements
    const node = architecture.dataNodes.find(n => n.id === nodeId);
    if (node) {
      if (element.type === 'ReceiveData') {
        // Connect ALL input ports to Receive Data element
        const inputPorts = node.messagePorts.filter(p => p.type === 'input');
        inputPorts.forEach(inputPort => {
          const newConnection: InternalConnection = {
            id: `internal-conn-${Date.now()}-${Math.random()}`,
            sourceElementId: inputPort.id,
            targetElementId: element.id,
            nodeId: nodeId
          };
          setInternalConnections(prev => [...prev, newConnection]);
        });
      } else if (element.type === 'SendData') {
        // Connect Send Data element to ALL output ports
        const outputPorts = node.messagePorts.filter(p => p.type === 'output');
        outputPorts.forEach(outputPort => {
          const newConnection: InternalConnection = {
            id: `internal-conn-${Date.now()}-${Math.random()}`,
            sourceElementId: element.id,
            targetElementId: outputPort.id,
            nodeId: nodeId
          };
          setInternalConnections(prev => [...prev, newConnection]);
        });
      }
    }
  }, [architecture.dataNodes, updateNode]);

  // Auto-create connections when new ports are added
  const updateNodeEnhanced = useCallback((nodeId: string, updates: Partial<DataNode>) => {
    const currentNode = architecture.dataNodes.find(n => n.id === nodeId);
    
    setArchitecture(prev => ({
      ...prev,
      dataNodes: prev.dataNodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));

    // Auto-connect new ports to existing elements
    if (updates.messagePorts && currentNode && updates.messagePorts.length > currentNode.messagePorts.length) {
      const newPorts = updates.messagePorts.filter(newPort => 
        !currentNode.messagePorts.some(oldPort => oldPort.id === newPort.id)
      );

      newPorts.forEach(newPort => {
        if (newPort.type === 'input') {
          // Connect new input port to all Receive Data elements
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
          // Connect all Send Data elements to new output port
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

  const originalUpdateNode = useCallback((nodeId: string, updates: Partial<DataNode>) => {
    setArchitecture(prev => ({
      ...prev,
      dataNodes: prev.dataNodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  }, []);

  // Replace the original updateNode with our enhanced version
  const enhancedUpdateNode = updateNodeEnhanced;

  const addInternalConnection = useCallback((
    nodeId: string,
    sourceElementId: string,
    targetElementId: string
  ) => {
    const newConnection: InternalConnection = {
      id: `internal-conn-${Date.now()}`,
      sourceElementId,
      targetElementId,
      nodeId
    };

    setInternalConnections(prev => [...prev, newConnection]);
  }, []);

  const deleteInternalConnection = useCallback((connectionId: string) => {
    setInternalConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  const handleInternalPortClick = useCallback((
    nodeId: string,
    elementId: string,
    portType: 'input' | 'output' | 'nodeOutput'
  ) => {
    if (internalConnectingFrom) {
      if (internalConnectingFrom.nodeId === nodeId && internalConnectingFrom.elementId !== elementId) {
        // Determine connection validity based on port types and element types
        const isSourcePort = internalConnectingFrom.elementId.startsWith('port-');
        const isTargetPort = elementId.startsWith('port-');
        
        let isValidConnection = false;
        
        // Rule 1: Input ports (green) to element input ports (green)
        if (isSourcePort && !isTargetPort && portType === 'input') {
          const sourcePort = architecture.dataNodes
            .find(n => n.id === nodeId)?.messagePorts
            .find(p => p.id === internalConnectingFrom.elementId);
          isValidConnection = sourcePort?.type === 'input';
        }
        // Rule 2: Element output ports (red) to element input ports (green)
        else if (!isSourcePort && !isTargetPort) {
          // Any element output (red) to any element input (green)
          if (internalConnectingFrom.portType === 'output' && portType === 'input') {
            isValidConnection = true;
          }
          // Also allow output to output for special cases
          else if (internalConnectingFrom.portType === 'output' && portType === 'output') {
            isValidConnection = false; // Keep this false for now
          }
        }
        // Rule 3: Element output ports (red) to node output ports (red)
        else if (!isSourcePort && isTargetPort && 
                 internalConnectingFrom.portType === 'output') {
          const targetPort = architecture.dataNodes
            .find(n => n.id === nodeId)?.messagePorts
            .find(p => p.id === elementId);
          isValidConnection = targetPort?.type === 'output';
        }
        // Rule 4: Send Data special blue port to node output ports
        else if (!isSourcePort && isTargetPort && 
                 internalConnectingFrom.portType === 'nodeOutput') {
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
      // Also delete internal connections for this node
      setInternalConnections(prev => prev.filter(conn => conn.nodeId !== elementId));
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
      const parsedModel = JSON.parse(modelJson);
      setArchitecture({
        id: parsedModel.id,
        name: parsedModel.name,
        dataNodes: parsedModel.dataNodes,
        connections: parsedModel.connections
      });
      setInternalConnections(parsedModel.internalConnections || []);
      setSelectedElement(null);
      setInternalConnectingFrom(null);
    } catch (error) {
      console.error('Failed to import model:', error);
    }
  }, []);

  return {
    architecture,
    internalConnections,
    selectedElement,
    internalConnectingFrom,
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