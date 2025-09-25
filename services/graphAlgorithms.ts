import { Node, Link } from '../types';

/**
 * Calculates the degree (number of connections) for each node in the graph.
 * @param nodes - Array of nodes in the graph.
 * @param links - Array of links in the graph.
 * @returns A map of node ID to its degree count.
 */
export const calculateDegreeCentrality = (nodes: Node[], links: Link[]): Map<string, number> => {
    const degrees = new Map<string, number>();
    nodes.forEach(node => degrees.set(node.id, 0));
    links.forEach(link => {
        degrees.set(link.source, (degrees.get(link.source) || 0) + 1);
        degrees.set(link.target, (degrees.get(link.target) || 0) + 1);
    });
    return degrees;
};

/**
 * Detects communities (clusters) in the graph by finding connected components.
 * @param nodes - Array of nodes in the graph.
 * @param links - Array of links in the graph.
 * @returns A map of node ID to a numeric community ID.
 */
export const detectCommunities = (nodes: Node[], links: Link[]): Map<string, number> => {
    const adj = new Map<string, string[]>();
    nodes.forEach(node => adj.set(node.id, []));
    links.forEach(link => {
        if (link.source && link.target) {
          adj.get(link.source)?.push(link.target);
          adj.get(link.target)?.push(link.source);
        }
    });

    const communities = new Map<string, number>();
    let communityId = 0;
    const visited = new Set<string>();

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            const component = new Set<string>();
            const queue = [node.id];
            visited.add(node.id);

            while (queue.length > 0) {
                const u = queue.shift()!;
                component.add(u);
                adj.get(u)?.forEach(v => {
                    if (!visited.has(v)) {
                        visited.add(v);
                        queue.push(v);
                    }
                });
            }
            
            component.forEach(memberId => communities.set(memberId, communityId));
            communityId++;
        }
    }
    return communities;
};

/**
 * Finds the shortest path between two nodes using Breadth-First Search (BFS).
 * @param startNodeId - The ID of the starting node.
 * @param endNodeId - The ID of the ending node.
 * @param nodes - Array of nodes in the graph.
 * @param links - Array of links in the graph.
 * @returns An object containing the path as an array of node IDs and the links in the path.
 */
export const findShortestPath = (startNodeId: string, endNodeId: string, nodes: Node[], links: Link[]): { path: string[] | null, links: {source: string, target: string}[] | null } => {
    if (startNodeId === endNodeId) return { path: [startNodeId], links: [] };

    const adj = new Map<string, string[]>();
    nodes.forEach(node => adj.set(node.id, []));
    links.forEach(link => {
        adj.get(link.source)?.push(link.target);
        adj.get(link.target)?.push(link.source);
    });

    const queue: string[] = [startNodeId];
    const visited = new Set<string>([startNodeId]);
    const parent = new Map<string, string>();

    while (queue.length > 0) {
        const u = queue.shift()!;
        if (u === endNodeId) {
            // Reconstruct path
            const path = [];
            let curr = endNodeId;
            while (curr) {
                path.unshift(curr);
                curr = parent.get(curr)!;
            }
            const pathLinks = [];
            for (let i = 0; i < path.length - 1; i++) {
                pathLinks.push({ source: path[i], target: path[i + 1] });
            }
            return { path, links: pathLinks };
        }

        for (const v of (adj.get(u) || [])) {
            if (!visited.has(v)) {
                visited.add(v);
                parent.set(v, u);
                queue.push(v);
            }
        }
    }
    return { path: null, links: null }; // No path found
};

/**
 * Finds the common neighbors between two nodes.
 * @param node1Id - The ID of the first node.
 * @param node2Id - The ID of the second node.
 * @param nodes - Array of nodes in the graph.
 * @param links - Array of links in the graph.
 * @returns An array of node IDs that are common neighbors.
 */
export const findCommonNeighbors = (node1Id: string, node2Id: string, nodes: Node[], links: Link[]): string[] => {
    const adj = new Map<string, Set<string>>();
    nodes.forEach(node => adj.set(node.id, new Set()));
    links.forEach(link => {
        adj.get(link.source)?.add(link.target);
        adj.get(link.target)?.add(link.source);
    });
    
    const neighbors1 = adj.get(node1Id) || new Set();
    const neighbors2 = adj.get(node2Id) || new Set();
    
    const common = [...neighbors1].filter(n => neighbors2.has(n));
    return common;
};
