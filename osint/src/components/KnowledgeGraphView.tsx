import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  GraphData,
  GraphNode,
  GraphEdge,
  GraphNodeType,
  NODE_TYPE_CONFIG,
  EDGE_REL_LABELS,
  filterGraph,
} from '../types/graph';
import { SignalFeature, FilterState, getDomainColor } from '../types/signal';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Search,
  Info,
  X,
  Share2,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface KnowledgeGraphViewProps {
  graphData: GraphData;
  signals: SignalFeature[];
  selectedSignalId: string | null;
  onSelectSignal: (id: string) => void;
  onFocusMap?: (id: string) => void;
  filters: FilterState;
  onResetFilters?: () => void;
}

type LayoutMode = 'force' | 'concentric';

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  borderColor: string;
  glowColor: string;
  degree: number;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  graphData,
  signals,
  selectedSignalId,
  onSelectSignal,
  onFocusMap,
  filters,
  onResetFilters,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Layout & Simulation State
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [hiddenTypes, setHiddenTypes] = useState<Set<GraphNodeType>>(new Set());
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Inspector popup for non-signal entities
  const [inspectedEntity, setInspectedEntity] = useState<GraphNode | null>(null);

  // Local search query within graph
  const [graphSearch, setGraphSearch] = useState<string>('');

  // Transform (Pan & Zoom)
  const transformRef = useRef<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Interaction State
  const isDraggingCanvasRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);
  const hoveredNodeRef = useRef<SimNode | null>(null);

  // Simulation Nodes & Edges Cache
  const simNodesRef = useRef<SimNode[]>([]);
  const simEdgesRef = useRef<GraphEdge[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Derive active signal IDs based on parent filteredSignals
  const activeSignalIds = useMemo(() => {
    return new Set(signals.map((s) => s.properties?.id || s.id));
  }, [signals]);

  // Filtered Graph Data
  const currentFilteredGraph = useMemo(() => {
    return filterGraph(graphData, activeSignalIds, hiddenTypes);
  }, [graphData, activeSignalIds, hiddenTypes]);

  // Build simulation nodes with degree counting and positions
  useEffect(() => {
    const rawNodes = currentFilteredGraph.nodes;
    const rawEdges = currentFilteredGraph.edges;

    // Count degrees
    const degreeMap = new Map<string, number>();
    rawEdges.forEach((e) => {
      degreeMap.set(e.from, (degreeMap.get(e.from) || 0) + 1);
      degreeMap.set(e.to, (degreeMap.get(e.to) || 0) + 1);
    });

    const prevMap = new Map<string, SimNode>();
    simNodesRef.current.forEach((n) => prevMap.set(n.id, n));

    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const newSimNodes: SimNode[] = rawNodes.map((n, i) => {
      const existing = prevMap.get(n.id);
      const degree = degreeMap.get(n.id) || 1;
      const typeCfg = NODE_TYPE_CONFIG[n.type] || NODE_TYPE_CONFIG.signal;

      // Color coding: override signal color with domain color if available
      let nodeColor = typeCfg.color;
      let borderColor = typeCfg.borderColor;
      let glowColor = typeCfg.glowColor;

      if (n.type === 'signal') {
        const matchingSig = signals.find((s) => (s.properties?.id || s.id) === n.id);
        if (matchingSig?.properties?.domain) {
          const dc = getDomainColor(matchingSig.properties.domain);
          nodeColor = dc.hex;
          borderColor = dc.hex;
          glowColor = `${dc.hex}66`;
        }
      } else if (n.type === 'domain') {
        const dc = getDomainColor(n.label);
        nodeColor = dc.hex;
        borderColor = dc.hex;
        glowColor = `${dc.hex}88`;
      }

      // Radius scaled slightly by degree
      const radius = Math.min(32, typeCfg.baseRadius + Math.log2(degree + 1) * 2);

      let x = existing ? existing.x : centerX + (Math.random() - 0.5) * Math.min(width * 0.7, 600);
      let y = existing ? existing.y : centerY + (Math.random() - 0.5) * Math.min(height * 0.7, 450);

      if (layoutMode === 'concentric' && !existing) {
        // Arrange hierarchically in concentric rings
        let ringRadius = 0;
        if (n.type === 'module') ringRadius = 40;
        else if (n.type === 'domain') ringRadius = 120;
        else if (n.type === 'subtheme') ringRadius = 220;
        else if (n.type === 'location-type') ringRadius = 300;
        else if (n.type === 'signal') ringRadius = 380;
        else if (n.type === 'org') ringRadius = 460;
        else if (n.type === 'place') ringRadius = 540;
        else ringRadius = 600;

        const angle = (i / rawNodes.length) * Math.PI * 2;
        x = centerX + Math.cos(angle) * ringRadius;
        y = centerY + Math.sin(angle) * ringRadius;
      }

      return {
        ...n,
        x,
        y,
        vx: existing ? existing.vx * 0.2 : 0,
        vy: existing ? existing.vy * 0.2 : 0,
        radius,
        color: nodeColor,
        borderColor,
        glowColor,
        degree,
      };
    });

    simNodesRef.current = newSimNodes;
    simEdgesRef.current = rawEdges;
  }, [currentFilteredGraph, signals, layoutMode]);

  // Center & Fit simulation to view on initial load or reset
  const handleResetCamera = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    transformRef.current = {
      x: width / 2,
      y: height / 2,
      k: 0.85,
    };
    setZoomLevel(0.85);
  }, []);

  useEffect(() => {
    handleResetCamera();
  }, [handleResetCamera]);

  // Simulation Physics Loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const nodes = simNodesRef.current;
      const edges = simEdgesRef.current;
      const nodeCount = nodes.length;

      if (isSimRunning && nodeCount > 0) {
        const nodeMap = new Map<string, SimNode>();
        nodes.forEach((n) => nodeMap.set(n.id, n));

        // 1. Repulsion between all node pairs
        for (let i = 0; i < nodeCount; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodeCount; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy + 0.1;
            const dist = Math.sqrt(distSq);

            const minDist = n1.radius + n2.radius + 15;
            let repForce = 0;

            if (dist < minDist) {
              // Strong collision resolution
              repForce = ((minDist - dist) / minDist) * 8.0;
            } else if (dist < 400) {
              // Standard Coulomb repulsion
              repForce = -1800 / distSq;
            }

            const fx = (dx / dist) * repForce;
            const fy = (dy / dist) * repForce;

            if (draggedNodeRef.current !== n1) {
              n1.vx += fx;
              n1.vy += fy;
            }
            if (draggedNodeRef.current !== n2) {
              n2.vx -= fx;
              n2.vy -= fy;
            }
          }
        }

        // 2. Spring attraction along edges
        const springLength = layoutMode === 'concentric' ? 90 : 75;
        edges.forEach((edge) => {
          const source = nodeMap.get(edge.from);
          const target = nodeMap.get(edge.to);
          if (!source || !target) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const displacement = dist - springLength;
          const springStrength = 0.045;
          const fx = (dx / dist) * displacement * springStrength;
          const fy = (dy / dist) * displacement * springStrength;

          if (draggedNodeRef.current !== source) {
            source.vx += fx;
            source.vy += fy;
          }
          if (draggedNodeRef.current !== target) {
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        // 3. Centering force & velocity damping
        nodes.forEach((n) => {
          if (draggedNodeRef.current === n) return;

          // Weak gravity to center (0, 0) in world space
          n.vx -= n.x * 0.003;
          n.vy -= n.y * 0.003;

          // Velocity Damping
          n.vx *= 0.82;
          n.vy *= 0.82;

          // Clamp max speed
          const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
          if (speed > 15) {
            n.vx = (n.vx / speed) * 15;
            n.vy = (n.vy / speed) * 15;
          }

          n.x += n.vx;
          n.y += n.vy;
        });
      }

      // Render Scene
      renderCanvas();

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    animFrameIdRef.current = animId;

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isSimRunning, layoutMode, selectedSignalId, graphSearch]);

  // Main Canvas Render Procedure
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep space slate background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, width, height);

    const transform = transformRef.current;

    // Tactical graticule grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)'; // slate-800
    ctx.lineWidth = 1;
    const gridSize = 60 * transform.k;
    const offsetX = transform.x % gridSize;
    const offsetY = transform.y % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // World transform
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    const nodes = simNodesRef.current;
    const edges = simEdgesRef.current;
    const nodeMap = new Map<string, SimNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const hovered = hoveredNodeRef.current;
    const searchLower = graphSearch.trim().toLowerCase();

    // 1. Draw Edges
    edges.forEach((edge) => {
      const source = nodeMap.get(edge.from);
      const target = nodeMap.get(edge.to);
      if (!source || !target) return;

      const isConnectedToSelected =
        selectedSignalId && (source.id === selectedSignalId || target.id === selectedSignalId);
      const isConnectedToHovered =
        hovered && (source.id === hovered.id || target.id === hovered.id);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      if (isConnectedToSelected || isConnectedToHovered) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'; // glowing sky-400
        ctx.lineWidth = 2.2 / transform.k;
      } else {
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)'; // subtle slate-600
        ctx.lineWidth = 1.0 / transform.k;
      }
      ctx.stroke();
    });

    // 2. Draw Nodes
    nodes.forEach((node) => {
      const isSelected = selectedSignalId === node.id;
      const isHovered = hovered?.id === node.id;
      const matchesSearch =
        searchLower.length > 0 &&
        (node.label.toLowerCase().includes(searchLower) || node.id.toLowerCase().includes(searchLower));

      const isConnectedToHovered =
        hovered &&
        edges.some(
          (e) =>
            (e.from === hovered.id && e.to === node.id) ||
            (e.to === hovered.id && e.from === node.id)
        );

      ctx.save();
      ctx.translate(node.x, node.y);

      // Outer Glow Halo for Hubs / Selection / Search
      if (isSelected || isHovered || matchesSearch || node.type === 'module' || node.type === 'domain') {
        const glowRadius = node.radius * (isSelected || matchesSearch ? 2.4 : 1.8);
        const grad = ctx.createRadialGradient(0, 0, node.radius * 0.8, 0, 0, glowRadius);
        grad.addColorStop(0, node.glowColor);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Radar Pulse ring for matches or selection
      if (isSelected || matchesSearch) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5 / transform.k;
        ctx.beginPath();
        ctx.arc(0, 0, node.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Node Body Circle
      ctx.beginPath();
      ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#ffffff' : node.borderColor;
      ctx.lineWidth = (isSelected ? 2.5 : 1.5) / transform.k;
      ctx.stroke();

      // Node Inner Detail (Icon or Hub Center Dot)
      if (node.type === 'module' || node.type === 'domain') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, node.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Text Labels (Show for hubs, selected, hovered, or when zoomed in)
      const shouldDrawLabel =
        node.type === 'module' ||
        node.type === 'domain' ||
        isSelected ||
        isHovered ||
        matchesSearch ||
        isConnectedToHovered ||
        transform.k > 1.2;

      if (shouldDrawLabel) {
        ctx.font = `${Math.max(10, Math.min(13, 11 / transform.k))}px "JetBrains Mono", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const labelY = node.radius + 4;
        const maxLen = 24;
        const displayLabel =
          node.label.length > maxLen ? `${node.label.slice(0, maxLen)}...` : node.label;

        // Label background pill
        const textWidth = ctx.measureText(displayLabel).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(-textWidth / 2 - 4, labelY - 2, textWidth + 8, 16);

        ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
        ctx.fillText(displayLabel, 0, labelY);
      }

      ctx.restore();
    });

    ctx.restore();
  };

  // Convert Canvas Screen Coords to World Coords
  const screenToWorld = (screenX: number, screenY: number) => {
    const t = transformRef.current;
    return {
      x: (screenX - t.x) / t.k,
      y: (screenY - t.y) / t.k,
    };
  };

  // Find node under cursor
  const findNodeAt = (screenX: number, screenY: number): SimNode | null => {
    const world = screenToWorld(screenX, screenY);
    const nodes = simNodesRef.current;

    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = world.x - n.x;
      const dy = world.y - n.y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        return n;
      }
    }
    return null;
  };

  // Pointer Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = findNodeAt(x, y);
    if (hit) {
      draggedNodeRef.current = hit;
      hit.vx = 0;
      hit.vy = 0;
    } else {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Node Dragging
    if (draggedNodeRef.current) {
      const world = screenToWorld(screenX, screenY);
      draggedNodeRef.current.x = world.x;
      draggedNodeRef.current.y = world.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    // Canvas Panning
    if (isDraggingCanvasRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      transformRef.current.x += dx;
      transformRef.current.y += dy;
      return;
    }

    // Hover Detection
    const hit = findNodeAt(screenX, screenY);
    if (hit !== hoveredNodeRef.current) {
      hoveredNodeRef.current = hit;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = hit ? 'pointer' : 'grab';
      }
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingCanvasRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = findNodeAt(x, y);
    if (hit) {
      if (hit.type === 'signal') {
        onSelectSignal(hit.id);
        setInspectedEntity(null);
      } else {
        // Inspect Entity (Org, Place, Domain, etc.)
        setInspectedEntity(hit);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const current = transformRef.current;
    const newK = Math.max(0.15, Math.min(4.0, current.k * zoomFactor));

    // Zoom into cursor position
    current.x = mouseX - (mouseX - current.x) * (newK / current.k);
    current.y = mouseY - (mouseY - current.y) * (newK / current.k);
    current.k = newK;

    setZoomLevel(newK);
  };

  // Zoom Button Controls
  const handleZoomIn = () => {
    if (!containerRef.current) return;
    const cx = containerRef.current.clientWidth / 2;
    const cy = containerRef.current.clientHeight / 2;
    const current = transformRef.current;
    const newK = Math.min(4.0, current.k * 1.3);

    current.x = cx - (cx - current.x) * (newK / current.k);
    current.y = cy - (cy - current.y) * (newK / current.k);
    current.k = newK;
    setZoomLevel(newK);
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    const cx = containerRef.current.clientWidth / 2;
    const cy = containerRef.current.clientHeight / 2;
    const current = transformRef.current;
    const newK = Math.max(0.15, current.k * 0.77);

    current.x = cx - (cx - current.x) * (newK / current.k);
    current.y = cy - (cy - current.y) * (newK / current.k);
    current.k = newK;
    setZoomLevel(newK);
  };

  // Toggle Node Type Visibility
  const toggleNodeType = (type: GraphNodeType) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Connected signals for Inspected Entity
  const inspectedConnectedSignals = useMemo(() => {
    if (!inspectedEntity) return [];
    const connectedIds = new Set<string>();

    currentFilteredGraph.edges.forEach((e) => {
      if (e.from === inspectedEntity.id) connectedIds.add(e.to);
      if (e.to === inspectedEntity.id) connectedIds.add(e.from);
    });

    return signals.filter((s) => connectedIds.has(s.properties?.id || s.id));
  }, [inspectedEntity, currentFilteredGraph, signals]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden select-none"
    >
      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Top HUD: Status Bar & Search */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Stats Pill */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-xl pointer-events-auto">
          <Share2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-medium text-slate-200">
            NETWORK TOPOLOGY
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-mono text-cyan-400">
            {currentFilteredGraph.nodes.length} Nodes
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-mono text-slate-400">
            {currentFilteredGraph.edges.length} Edges
          </span>
          {activeSignalIds.size < graphData.nodes.filter((n) => n.type === 'signal').length && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
              Filtered
            </span>
          )}
        </div>

        {/* Right Search Input & Layout Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search graph entities..."
              value={graphSearch}
              onChange={(e) => setGraphSearch(e.target.value)}
              className="bg-slate-900/90 backdrop-blur-md text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 w-44 md:w-56"
            />
            {graphSearch && (
              <button
                onClick={() => setGraphSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Layout Mode Selector */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={() => setLayoutMode('force')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                layoutMode === 'force'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Force-Directed organic cluster layout"
            >
              Organic
            </button>
            <button
              onClick={() => setLayoutMode('concentric')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                layoutMode === 'concentric'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Concentric hierarchical orbital layout"
            >
              Concentric
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-2xl">
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors"
          title="Reset Camera & Center View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-0.5" />
        <button
          onClick={() => setIsSimRunning((prev) => !prev)}
          className={`p-1.5 rounded-lg transition-colors ${
            isSimRunning
              ? 'text-cyan-400 hover:bg-slate-800/80'
              : 'text-amber-400 hover:bg-slate-800/80'
          }`}
          title={isSimRunning ? 'Pause Physics Simulation' : 'Resume Physics Simulation'}
        >
          {isSimRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setShowLegend((prev) => !prev)}
          className={`p-1.5 rounded-lg transition-colors ${
            showLegend ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:bg-slate-800/80'
          }`}
          title="Toggle Entity Legend & Filters"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Entity Type Legend & Filter Pills */}
      {showLegend && (
        <div className="absolute bottom-4 right-4 max-w-md bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Entity Layer Filters
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Click to toggle visibility
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(NODE_TYPE_CONFIG) as GraphNodeType[]).map((type) => {
              const cfg = NODE_TYPE_CONFIG[type];
              const isHidden = hiddenTypes.has(type);
              const count = graphData.nodes.filter((n) => n.type === type).length;

              return (
                <button
                  key={type}
                  onClick={() => toggleNodeType(type)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono transition-all ${
                    isHidden
                      ? 'opacity-40 bg-slate-950 text-slate-500 line-through border border-transparent'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span>{cfg.label}</span>
                  <span className="text-[10px] text-slate-500">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Non-Signal Entity Inspector Drawer / Popover */}
      {inspectedEntity && (
        <div className="absolute top-16 left-4 w-80 md:w-96 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl p-4 overflow-hidden z-20">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      NODE_TYPE_CONFIG[inspectedEntity.type]?.color || '#38bdf8',
                  }}
                />
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  {NODE_TYPE_CONFIG[inspectedEntity.type]?.label || inspectedEntity.type}
                </span>
                {inspectedEntity.iso3 && (
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded border border-cyan-800/60">
                    {inspectedEntity.iso3}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mt-1">
                {inspectedEntity.label}
              </h3>
            </div>
            <button
              onClick={() => setInspectedEntity(null)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-mono">
                Connected Signals ({inspectedConnectedSignals.length})
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {inspectedConnectedSignals.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2">
                  No signals connected in current filter scope.
                </div>
              ) : (
                inspectedConnectedSignals.map((sig) => {
                  const p = sig.properties;
                  const domainStyle = getDomainColor(p.domain);
                  return (
                    <div
                      key={p.id || sig.id}
                      onClick={() => onSelectSignal(p.id || sig.id)}
                      className="group p-2 bg-slate-950/80 hover:bg-slate-800/80 rounded border border-slate-800/60 hover:border-cyan-800/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono mb-1">
                        <span className={domainStyle.text}>{p.domain}</span>
                        <span className="text-slate-500">{p.date}</span>
                      </div>
                      <div className="text-xs text-slate-200 font-medium group-hover:text-cyan-300 line-clamp-2">
                        {p.title}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State when filters produce no nodes */}
      {currentFilteredGraph.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl max-w-sm text-center pointer-events-auto">
            <Filter className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              No Network Nodes In Filter Scope
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              The currently selected filters or layer toggles exclude all network entities.
            </p>
            {onResetFilters && (
              <button
                onClick={onResetFilters}
                className="px-3 py-1.5 text-xs font-mono bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
