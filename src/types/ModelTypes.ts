export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface MessagePort {
  id: string;
  name: string;
  type: 'input' | 'output';
  position: Position;
}

export interface BehaviouralElement {
  id: string;
  name: string;
  type: string;
  position: Position;
  size: Size;
  properties?: Record<string, any>;
}

export interface DataFlow {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort?: string;
  targetPort?: string;
  type: 'internal' | 'external';
}

export interface DataNode {
  id: string;
  name: string;
  position: Position;
  size: Size;
  messagePorts: MessagePort[];
  behaviouralElements: BehaviouralElement[];
  internalLinks: DataFlow[];
  isExpanded: boolean;
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePortId: string;
  targetPortId: string;
  label?: string;
}

export interface DataArchitecture {
  id: string;
  name: string;
  dataNodes: DataNode[];
  connections: Connection[];
}

export interface InternalConnection {
  id: string;
  sourceElementId: string;
  targetElementId: string;
  sourcePort?: string;
  targetPort?: string;
  nodeId: string;
}

export interface ToolboxItem {
  id: string;
  name: string;
  category: string;
  type: string;
  icon: string;
  color: string;
  properties?: Record<string, any>;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}