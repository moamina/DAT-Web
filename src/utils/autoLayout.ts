import { DataNode, Connection, Position } from '../types/ModelTypes';

/**
 * Computes a clean hierarchical Directed Acyclic Graph (DAG) layout for data nodes.
 * Assigns ranks based on data flow direction (in-degree -> out-degree) and centers layers.
 */
export function computeAutoLayout(
  nodes: DataNode[],
  connections: Connection[]
): { [nodeId: string]: Position } {
  if (nodes.length === 0) return {};

  const nodeMap = new Map<string, DataNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Build adjacency graph
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  nodes.forEach(n => {
    outgoing.set(n.id, []);
    incoming.set(n.id, []);
  });

  connections.forEach(conn => {
    if (nodeMap.has(conn.sourceNodeId) && nodeMap.has(conn.targetNodeId)) {
      outgoing.get(conn.sourceNodeId)?.push(conn.targetNodeId);
      incoming.get(conn.targetNodeId)?.push(conn.sourceNodeId);
    }
  });

  // Calculate topological rank / layer using longest path
  const ranks = new Map<string, number>();

  // Initialize nodes with 0 incoming connections to rank 0
  const queue: string[] = [];
  nodes.forEach(n => {
    if ((incoming.get(n.id)?.length || 0) === 0) {
      ranks.set(n.id, 0);
      queue.push(n.id);
    }
  });

  // If there is a cycle and no nodes have in-degree 0, pick the first node
  if (queue.length === 0 && nodes.length > 0) {
    ranks.set(nodes[0].id, 0);
    queue.push(nodes[0].id);
  }

  // Assign layers using BFS/longest path
  let visitedCount = 0;
  while (queue.length > 0 && visitedCount < nodes.length * 3) {
    const currentId = queue.shift()!;
    visitedCount++;
    const currentRank = ranks.get(currentId) || 0;
    const children = outgoing.get(currentId) || [];

    children.forEach(childId => {
      const childRank = ranks.get(childId);
      if (childRank === undefined || childRank < currentRank + 1) {
        ranks.set(childId, currentRank + 1);
        queue.push(childId);
      }
    });
  }

  // Any unassigned nodes (disconnected components) get assigned rank 0
  nodes.forEach(n => {
    if (!ranks.has(n.id)) {
      ranks.set(n.id, 0);
    }
  });

  // Group nodes by rank
  const layers: Map<number, DataNode[]> = new Map();
  nodes.forEach(node => {
    const rank = ranks.get(node.id) || 0;
    if (!layers.has(rank)) {
      layers.set(rank, []);
    }
    layers.get(rank)?.push(node);
  });

  // Spacing configurations
  const HORIZONTAL_SPACING = 340;
  const VERTICAL_GAP = 50;
  const START_X = 80;
  const START_Y = 80;

  // Find max layer height to center smaller layers
  let maxColumnHeight = 0;
  layers.forEach(layerNodes => {
    const colHeight = layerNodes.reduce((sum, n) => sum + n.size.height + VERTICAL_GAP, 0) - VERTICAL_GAP;
    maxColumnHeight = Math.max(maxColumnHeight, colHeight);
  });

  const positions: { [nodeId: string]: Position } = {};

  // Sort ranks ascending
  const sortedRanks = Array.from(layers.keys()).sort((a, b) => a - b);

  sortedRanks.forEach(rank => {
    const layerNodes = layers.get(rank) || [];
    const colHeight = layerNodes.reduce((sum, n) => sum + n.size.height + VERTICAL_GAP, 0) - VERTICAL_GAP;
    const yOffset = Math.max(0, (maxColumnHeight - colHeight) / 2);

    let currentY = START_Y + yOffset;
    const currentX = START_X + rank * HORIZONTAL_SPACING;

    layerNodes.forEach(node => {
      positions[node.id] = {
        x: Math.round(currentX),
        y: Math.round(currentY)
      };
      currentY += node.size.height + VERTICAL_GAP;
    });
  });

  return positions;
}
