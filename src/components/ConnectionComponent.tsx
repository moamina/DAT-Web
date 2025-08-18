import React from 'react';
import { Connection, DataNode } from '../types/ModelTypes';

interface ConnectionComponentProps {
  connection: Connection;
  dataNodes: DataNode[];
  isSelected: boolean;
  onSelect: () => void;
}

const ConnectionComponent: React.FC<ConnectionComponentProps> = ({
  connection,
  dataNodes,
  isSelected,
  onSelect
}) => {
  const sourceNode = dataNodes.find(node => node.id === connection.sourceNodeId);
  const targetNode = dataNodes.find(node => node.id === connection.targetNodeId);
  
  if (!sourceNode || !targetNode) return null;

  const sourcePort = sourceNode.messagePorts.find(port => port.id === connection.sourcePortId);
  const targetPort = targetNode.messagePorts.find(port => port.id === connection.targetPortId);
  
  if (!sourcePort || !targetPort) return null;

  // Use EXACT same coordinates as port visual centers
  const sourceX = sourceNode.position.x + sourcePort.position.x;
  const sourceY = sourceNode.position.y + sourcePort.position.y;
  const targetX = targetNode.position.x + targetPort.position.x;
  const targetY = targetNode.position.y + targetPort.position.y;

  // Create curved connection path
  const controlX1 = sourceX + (targetX - sourceX) * 0.5;
  const controlY1 = sourceY;
  const controlX2 = sourceX + (targetX - sourceX) * 0.5;
  const controlY2 = targetY;
  
  const pathD = `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;

  return (
    <g>
      <path
        d={pathD}
        stroke={isSelected ? '#3B82F6' : '#6B7280'}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        markerEnd="url(#arrowhead)"
        className="cursor-pointer hover:stroke-blue-500 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />
      
      {connection.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2 - 10}
          textAnchor="middle"
          className="fill-gray-600 text-sm font-medium pointer-events-none"
        >
          {connection.label}
        </text>
      )}
      
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={isSelected ? '#3B82F6' : '#6B7280'}
          />
        </marker>
      </defs>
    </g>
  );
};

export default ConnectionComponent;