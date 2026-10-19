/**
 * Knowledge Graph Types & Utilities
 */

import { SignalFeature, getDomainColor } from './signal';

export type GraphNodeType =
  | 'signal'
  | 'watch'
  | 'domain'
  | 'place'
  | 'subtheme'
  | 'location-type'
  | 'org'
  | 'module';

export type GraphEdgeRel =
  | 'IN_DOMAIN'
  | 'IN_MODULE'
  | 'IN_PLACE'
  | 'LOCATED_IN'
  | 'SOURCED_FROM'
  | 'HAS_SUBTHEME'
  | 'HAS_LOCATION_TYPE'
  | string;

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  module?: string;
  date?: string;
  confidence?: string;
  kind?: string;
  iso3?: string;
  // Layout & Physics attributes
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  radius?: number;
  color?: string;
  degree?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  rel: GraphEdgeRel;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const NODE_TYPE_CONFIG: Record<
  GraphNodeType,
  {
    label: string;
    baseRadius: number;
    color: string;
    borderColor: string;
    glowColor: string;
    textColor: string;
  }
> = {
  module: {
    label: 'Module',
    baseRadius: 24,
    color: '#0284c7', // Sky-600
    borderColor: '#38bdf8', // Sky-400
    glowColor: 'rgba(56, 189, 248, 0.4)',
    textColor: '#e0f2fe',
  },
  domain: {
    label: 'Domain',
    baseRadius: 20,
    color: '#0d9488', // Teal-600
    borderColor: '#2dd4bf', // Teal-400
    glowColor: 'rgba(45, 212, 191, 0.4)',
    textColor: '#ccfbf1',
  },
  subtheme: {
    label: 'Subtheme',
    baseRadius: 16,
    color: '#9333ea', // Purple-600
    borderColor: '#c084fc', // Purple-400
    glowColor: 'rgba(192, 132, 252, 0.35)',
    textColor: '#f3e8ff',
  },
  signal: {
    label: 'Signal',
    baseRadius: 13,
    color: '#0284c7', // Fallback, usually overridden by domain
    borderColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    textColor: '#ffffff',
  },
  org: {
    label: 'Organization',
    baseRadius: 14,
    color: '#059669', // Emerald-600
    borderColor: '#34d399', // Emerald-400
    glowColor: 'rgba(52, 211, 153, 0.35)',
    textColor: '#d1fae5',
  },
  place: {
    label: 'Place',
    baseRadius: 14,
    color: '#4f46e5', // Indigo-600
    borderColor: '#818cf8', // Indigo-400
    glowColor: 'rgba(129, 140, 248, 0.35)',
    textColor: '#e0e7ff',
  },
  watch: {
    label: 'Watch Item',
    baseRadius: 14,
    color: '#e11d48', // Rose-600
    borderColor: '#fb7185', // Rose-400
    glowColor: 'rgba(251, 113, 133, 0.4)',
    textColor: '#ffe4e6',
  },
  'location-type': {
    label: 'Location Type',
    baseRadius: 13,
    color: '#d97706', // Amber-600
    borderColor: '#fbbf24', // Amber-400
    glowColor: 'rgba(251, 191, 36, 0.35)',
    textColor: '#fef3c7',
  },
};

export const EDGE_REL_LABELS: Record<string, string> = {
  IN_DOMAIN: 'in domain',
  IN_MODULE: 'in module',
  IN_PLACE: 'located in',
  LOCATED_IN: 'site in',
  SOURCED_FROM: 'sourced from',
  HAS_SUBTHEME: 'subtheme',
  HAS_LOCATION_TYPE: 'location type',
};

/**
 * Filter graph data based on an optional active set of signal IDs and hidden node types.
 * If activeSignalIds is provided, only signals in that set and their connected neighbors are kept.
 */
export function filterGraph(
  graph: GraphData,
  activeSignalIds: Set<string> | null,
  hiddenTypes: Set<GraphNodeType> = new Set()
): GraphData {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return { nodes: [], edges: [] };
  }

  // 1. If activeSignalIds is provided, find all relevant nodes
  let allowedNodeIds: Set<string> | null = null;
  if (activeSignalIds && activeSignalIds.size > 0) {
    allowedNodeIds = new Set<string>();

    // Add all active signals
    activeSignalIds.forEach((id) => allowedNodeIds!.add(id));

    // Add 1st degree neighbors of these signals
    graph.edges.forEach((edge) => {
      if (activeSignalIds.has(edge.from)) {
        allowedNodeIds!.add(edge.to);
      } else if (activeSignalIds.has(edge.to)) {
        allowedNodeIds!.add(edge.from);
      }
    });

    // Add 2nd degree places (e.g. city -> country via IN_PLACE)
    graph.edges.forEach((edge) => {
      if (edge.rel === 'IN_PLACE' && allowedNodeIds!.has(edge.from)) {
        allowedNodeIds!.add(edge.to);
      }
      // Add module of any allowed subtheme
      if (edge.rel === 'IN_MODULE' && allowedNodeIds!.has(edge.from)) {
        allowedNodeIds!.add(edge.to);
      }
    });
  }

  // 2. Filter nodes by hidden types and allowed IDs
  const keptNodes = graph.nodes.filter((node) => {
    if (hiddenTypes.has(node.type)) return false;
    if (allowedNodeIds && !allowedNodeIds.has(node.id)) return false;
    return true;
  });

  const keptNodeIds = new Set(keptNodes.map((n) => n.id));

  // 3. Filter edges: both ends must be in keptNodeIds
  const keptEdges = graph.edges.filter((edge) => {
    return keptNodeIds.has(edge.from) && keptNodeIds.has(edge.to);
  });

  return {
    nodes: keptNodes,
    edges: keptEdges,
  };
}

/**
 * Derives a GraphData structure directly from an array of SignalFeatures.
 * Serves as an algorithmic fallback whenever graph.json is not available or custom signals are uploaded.
 */
export function deriveGraphFromSignals(signals: SignalFeature[]): GraphData {
  const nodesMap = new Map<string, GraphNode>();
  const edgesMap = new Map<string, GraphEdge>();

  const addEdge = (from: string, to: string, rel: string) => {
    const key = `${from}->${to}:${rel}`;
    if (!edgesMap.has(key)) {
      edgesMap.set(key, { from, to, rel });
    }
  };

  signals.forEach((signal) => {
    const p = signal.properties;
    const signalId = p.id || signal.id;
    if (!signalId) return;

    // Signal Node
    nodesMap.set(signalId, {
      id: signalId,
      type: 'signal',
      label: p.title || signalId,
      module: p.module,
      date: p.date,
      confidence: p.confidence,
    });

    // Domain Node & Edge
    if (p.domain) {
      const domainSlug = p.domain.trim().toLowerCase();
      const domainId = `domain:${domainSlug}`;
      if (!nodesMap.has(domainId)) {
        nodesMap.set(domainId, {
          id: domainId,
          type: 'domain',
          label: p.domain.trim(),
        });
      }
      addEdge(signalId, domainId, 'IN_DOMAIN');
    }

    // Module Node & Edge
    if (p.module) {
      const moduleId = `module:${p.module.trim().toLowerCase()}`;
      if (!nodesMap.has(moduleId)) {
        nodesMap.set(moduleId, {
          id: moduleId,
          type: 'module',
          label: p.module.trim(),
        });
      }
      addEdge(signalId, moduleId, 'IN_MODULE');
    }

    // Subtheme Node & Edge
    if (p.subtheme) {
      const subthemeSlug = p.subtheme.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const subthemeId = `subtheme:${(p.module || 'general').toLowerCase()}--${subthemeSlug}`;
      if (!nodesMap.has(subthemeId)) {
        nodesMap.set(subthemeId, {
          id: subthemeId,
          type: 'subtheme',
          label: p.subtheme.trim(),
          module: p.module,
        });
      }
      addEdge(signalId, subthemeId, 'HAS_SUBTHEME');
      if (p.module) {
        addEdge(subthemeId, `module:${p.module.trim().toLowerCase()}`, 'IN_MODULE');
      }
    }

    // Location Type Node & Edge
    if (p.location_type) {
      const locTypeSlug = p.location_type.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const locTypeId = `loctype:${locTypeSlug}`;
      if (!nodesMap.has(locTypeId)) {
        nodesMap.set(locTypeId, {
          id: locTypeId,
          type: 'location-type',
          label: p.location_type.trim(),
        });
      }
      addEdge(signalId, locTypeId, 'HAS_LOCATION_TYPE');
    }

    // Place Node & Edge
    if (p.location) {
      const parts = p.location.split(';').map((s) => s.trim()).filter(Boolean);
      const placeSlug = (parts[0] || p.location).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const placeId = `place:${placeSlug}`;
      if (!nodesMap.has(placeId)) {
        nodesMap.set(placeId, {
          id: placeId,
          type: 'place',
          label: parts[0] || p.location,
          iso3: p.iso3,
        });
      }
      addEdge(signalId, placeId, 'LOCATED_IN');
    }
  });

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values()),
  };
}
