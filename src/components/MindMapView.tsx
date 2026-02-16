import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, ZoomIn, ZoomOut, Download, ChevronRight } from 'lucide-react';
import { MindMapData, MindMapNode } from '../types';
import * as htmlToImage from 'html-to-image';

type LayoutNode = {
  id: string;
  label: string;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hasChildren: boolean;
  expanded: boolean;
};

type LayoutEdge = {
  from: string;
  to: string;
};

type LayoutResult = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
};

const NODE_HEIGHT = 34;
const COL_GAP = 76;
const TOGGLE_SLOT = 56;
const ROW_GAP = 62;
const LEFT_PADDING = 80;
const TOP_PADDING = 70;

const getNodeWidth = (label: string, depth: number) => {
  const minWidth = depth === 0 ? 120 : depth === 1 ? 130 : 150;
  const maxWidth = depth >= 2 ? 260 : 220;
  const estimated = label.length * 7 + 34;
  return Math.max(minWidth, Math.min(maxWidth, estimated));
};

const buildLayout = (
  root: MindMapNode,
  expandedState: Record<string, boolean>,
  autoCollapsed: Set<string>
): LayoutResult => {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  let leafIndex = 0;
  const maxWidthByDepth = new Map<number, number>();

  const collectWidths = (node: MindMapNode, depth: number) => {
    const width = getNodeWidth(node.label || 'Node', depth);
    const prev = maxWidthByDepth.get(depth) || 0;
    if (width > prev) maxWidthByDepth.set(depth, width);
    (node.children || []).forEach((child) => collectWidths(child, depth + 1));
  };

  collectWidths(root, 0);

  const depthOffsets = new Map<number, number>();
  depthOffsets.set(0, LEFT_PADDING);
  const maxDepth = Math.max(...Array.from(maxWidthByDepth.keys()), 0);
  for (let depth = 1; depth <= maxDepth + 1; depth += 1) {
    const prevDepth = depth - 1;
    const prevOffset = depthOffsets.get(prevDepth) || LEFT_PADDING;
    const prevWidth = maxWidthByDepth.get(prevDepth) || 160;
    depthOffsets.set(depth, prevOffset + prevWidth + COL_GAP + TOGGLE_SLOT);
  }

  const isExpanded = (path: string, node: MindMapNode, depth: number) => {
    if (!node.children || node.children.length === 0) return false;
    if (expandedState[path] !== undefined) return expandedState[path];
    if (depth === 0) return true;
    return !autoCollapsed.has(path);
  };

  const walk = (node: MindMapNode, depth: number, parentId: string | undefined, path: string): { id: string; y: number } => {
    const width = getNodeWidth(node.label || 'Node', depth);
    const x = depthOffsets.get(depth) || LEFT_PADDING;
    const children = node.children || [];
    const expanded = isExpanded(path, node, depth);
    const visibleChildren = expanded ? children : [];

    let y = 0;
    if (visibleChildren.length === 0) {
      y = TOP_PADDING + leafIndex * ROW_GAP;
      leafIndex += 1;
    } else {
      const childMeta = visibleChildren.map((child, index) => walk(child, depth + 1, path, `${path}.${index}`));
      const sum = childMeta.reduce((acc, c) => acc + c.y, 0);
      y = sum / childMeta.length;
    }

    nodes.push({
      id: path,
      label: node.label || 'Node',
      depth,
      x,
      y,
      width,
      height: NODE_HEIGHT,
      hasChildren: children.length > 0,
      expanded,
    });

    if (parentId) edges.push({ from: parentId, to: path });
    return { id: path, y };
  };

  walk(root, 0, undefined, 'root');

  const rightMost = nodes.reduce((acc, n) => Math.max(acc, n.x + n.width), 0);
  const bottomMost = nodes.reduce((acc, n) => Math.max(acc, n.y + n.height), 0);

  return {
    nodes,
    edges,
    width: rightMost + 120,
    height: bottomMost + 90,
  };
};

interface NodeViewProps {
  node: LayoutNode;
  onNodeClick: (label: string) => void;
  onToggleChildren: (id: string) => void;
}

const NodeView: React.FC<NodeViewProps> = ({ node, onNodeClick, onToggleChildren }) => {
  const styleByDepth = () => {
    if (node.depth === 0) return 'bg-[#4b5678] border-[#7886b5] text-white font-semibold';
    if (node.depth === 1) return 'bg-[#3f4a5f] border-[#64748b] text-white font-semibold';
    return 'bg-[#2f5a4a] border-[#416f5d] text-[#f0fff7] font-medium';
  };

  return (
    <div
      className="absolute transition-all duration-300 ease-out"
      style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNodeClick(node.label);
        }}
        className={`relative h-full w-full border rounded-[8px] px-3 text-left whitespace-nowrap transition-all duration-200 hover:brightness-110 hover:shadow-[0_8px_20px_-12px_rgba(125,211,252,0.55)] ${styleByDepth()}`}
        style={{ fontSize: node.depth >= 2 ? 12 : 13 }}
        title={node.label}
      >
        <span className="truncate block leading-[18px]">{node.label}</span>
      </button>

      {node.hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleChildren(node.id);
          }}
          className="absolute -right-12 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-slate-400/25 bg-[#3c4758] text-slate-100 hover:bg-[#465366] transition-all duration-200 leading-none flex items-center justify-center"
          title={node.expanded ? "Tarmoqlarni yashirish" : "Tarmoqlarni ko'rsatish"}
        >
          <ChevronRight
            size={18}
            className={`transition-transform duration-300 ${node.expanded ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>
      )}
    </div>
  );
};

interface MindMapViewProps {
  data: MindMapData;
  sourceCount: number;
  onClose: () => void;
  onReview?: (query: string) => void;
  theme: 'light' | 'dark';
  mode?: 'sidebar' | 'fullscreen';
  title?: string;
}

const MindMapView: React.FC<MindMapViewProps> = ({ data, sourceCount, onClose, onReview, title }) => {
  const [zoom, setZoom] = useState(0.9);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  const viewportRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const autoCollapsed = useMemo(() => {
    const set = new Set<string>();
    const visit = (node: MindMapNode, path: string, depth: number) => {
      const children = node.children || [];
      if (depth >= 1 && children.length >= 3) set.add(path);
      children.forEach((child, index) => visit(child, `${path}.${index}`, depth + 1));
    };
    if (data?.rootNode?.label) visit(data.rootNode, 'root', 0);
    return set;
  }, [data]);

  const layout = useMemo(() => {
    if (!data?.rootNode?.label) return null;
    return buildLayout(data.rootNode, expandedState, autoCollapsed);
  }, [data, expandedState, autoCollapsed]);

  const nodeMap = useMemo(() => {
    if (!layout) return new Map<string, LayoutNode>();
    return new Map(layout.nodes.map((n) => [n.id, n]));
  }, [layout]);

  useEffect(() => {
    setZoom(0.9);
    setPosition({ x: 0, y: 0 });
    setExpandedState({});
  }, [data]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = Math.pow(1.1, -e.deltaY / 120);
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.35), 2.2));
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mapContentRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toJpeg(mapContentRef.current, {
        quality: 0.98,
        backgroundColor: '#343740',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      const safeTitle = (title || data.title || 'Aqliy_xarita').replace(/\s+/g, '_');
      link.download = `${safeTitle}_mindmap.jpg`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNodeClick = (label: string) => {
    if (onReview) onReview(`"${label}" mavzusi haqida manbalar asosida batafsil ma'lumot bering.`);
  };

  const handleToggleChildren = (id: string) => {
    setExpandedState((prev) => {
      const next = { ...prev };
      const current = prev[id] !== undefined ? prev[id] : !autoCollapsed.has(id);
      next[id] = !current;
      return next;
    });
  };

  if (!layout) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#1a1c1f] text-white">
        <p className="text-gray-400">Ma'lumot yuklanmadi yoki xatolik yuz berdi.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-[#1a1c1f] text-white p-4">
      <div className="relative h-full w-full rounded-2xl border border-[#2b3139] bg-[linear-gradient(180deg,#232831_0%,#1f242c_18%,#1b1f25_100%)] overflow-hidden">
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="text-[22px] font-semibold text-gray-100 leading-none">{title || data.title || 'Aqliy xarita'}</h2>
            <p className="text-[11px] text-gray-400 mt-1">{sourceCount} ta manba asosida</p>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <button onClick={handleDownload} className="p-2 rounded-md hover:bg-white/5" title="Yuklab olish">
              <Download size={18} />
            </button>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-white/5" title="Yopish">
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          ref={viewportRef}
          className={`relative h-[calc(100%-6rem)] overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            <div ref={mapContentRef} className="relative" style={{ width: layout.width, height: layout.height }}>
              <svg className="absolute inset-0 pointer-events-none" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`}>
                {layout.edges.map((edge, idx) => {
                  const from = nodeMap.get(edge.from);
                  const to = nodeMap.get(edge.to);
                  if (!from || !to) return null;

                  const sx = from.x + from.width;
                  const sy = from.y + from.height / 2;
                  const ex = to.x;
                  const ey = to.y + to.height / 2;
                  const dx = Math.max(18, (ex - sx) * 0.45);

                  return (
                    <g key={idx}>
                      <path
                        d={`M ${sx} ${sy} C ${sx + dx} ${sy}, ${ex - dx} ${ey}, ${ex} ${ey}`}
                        fill="none"
                        stroke="rgba(167, 243, 208, 0.92)"
                        strokeWidth="1.35"
                        strokeLinecap="round"
                      />
                      <circle cx={ex} cy={ey} r="2.1" fill="rgba(186, 230, 253, 0.95)" />
                    </g>
                  );
                })}
              </svg>

              {layout.nodes.map((node) => (
                <NodeView key={node.id} node={node} onNodeClick={handleNodeClick} onToggleChildren={handleToggleChildren} />
              ))}
            </div>
          </div>

          <div className="absolute right-3 bottom-3 flex flex-col rounded-full bg-[#0f1720]/90 border border-white/10 overflow-hidden">
            <button onClick={() => setZoom((z) => Math.min(2.2, z + 0.12))} className="p-2.5 hover:bg-white/10 text-gray-300">
              <ZoomIn size={18} />
            </button>
            <button onClick={() => setZoom((z) => Math.max(0.35, z - 0.12))} className="p-2.5 hover:bg-white/10 text-gray-300 border-t border-white/10">
              <ZoomOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMapView;
