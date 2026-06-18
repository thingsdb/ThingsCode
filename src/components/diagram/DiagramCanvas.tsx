import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from 'react';
import { Text, Badge, Box, Flex, IconButton, Theme } from '@radix-ui/themes';
import { CubeIcon, TokensIcon, Cross2Icon, PlusIcon, ResetIcon, MinusIcon, ComponentInstanceIcon } from '@radix-ui/react-icons';
import ELK from 'elkjs/lib/elk.bundled.js';
import ElkWorkerModule from 'elkjs/lib/elk-worker.js?worker';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
import { useTheme } from '../../hooks';
import type { Cardinality, Enum, Type } from '../../types';
import { determineCardinality } from '../../utils';

type DiagramData = [Type[], Enum[]];

interface DiagramCanvasProps {
  onClose: () => void;
  data: DiagramData;
  scope: string;
  onNavigateToType?: (name: string) => void;
  onNavigateToEnum?: (name: string) => void;
  includeWpo: boolean;
  includeStandalone: boolean;
}

interface Node extends ElkNode {
  tp?: Type;
  enu?: Enum;
}

interface Edge extends ElkExtendedEdge {
  card: Cardinality;
  label: string;
}

interface WorkerModule {
  default: new () => Worker;
}

const elk = new ELK({
  workerFactory: () => {
    const module = ElkWorkerModule as unknown as WorkerModule;
    const WorkerConstructor = module.default || ElkWorkerModule;
    return new WorkerConstructor();
  }
});

const getCardinalityColor = (cardinality: string | undefined): string => {
  if (!cardinality) return 'var(--gray-6)';
  if (cardinality === '1:1') return 'var(--iris-8)';
  if (cardinality === '1:N' || cardinality === 'N:1') return 'var(--amber-8)';
  if (cardinality === 'N:N') return 'var(--crimson-8)';
  return 'var(--gray-6)';
};

export default function DiagramCanvas({
  onClose,
  data,
  scope,
  onNavigateToType,
  onNavigateToEnum,
  includeWpo,
  includeStandalone
}: DiagramCanvasProps) {
  const { appearance } = useTheme();

  const [types, enums] = data;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const [zoom, setZoom] = useState(1.00);
  const [isReady, setIsReady] = useState(false);

  const [hoveredEdge, setHoveredEdge] = useState<Edge | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const nodesRef = useRef<Node[]>([]);

  const navigateToNode = (targetId: string) => {
    if (!svgRef.current) return;
    const targetNode = nodesRef.current.find(n => n.id === targetId);
    if (!targetNode) return;

    // Get the dynamic dimension boundaries of the physical browser viewport window
    const rect = svgRef.current.getBoundingClientRect();
    const viewWidth = rect.width;
    const viewHeight = rect.height;

    // Apply viewport midpoint geometry delta scaling formula
    const newX = viewWidth / 2 - (targetNode.x! + targetNode.width! / 2) * zoom;
    const newY = viewHeight / 2 - (targetNode.y! + targetNode.height! / 2) * zoom;

    setPan({ x: newX, y: newY });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    async function computeLayout() {
      const childrenNodes: Node[] = [];
      const edgeRoutes: Edge[] = [];
      const processedPairs = new Set<string>();
      const nameOnryRe = /[^_a-zA-Z0-9]/g;
      const names = new Set<string>([
        ...types.map(tp => tp.name),
        ...enums.map(en => en.name),
      ]);
      const standalone = new Set<string>(includeStandalone ? [] : [...names]);
      const calcTypeEdges = (tp: Type) => {
        tp.fields.forEach(([fName, fDef]) => {
          if (typeof fDef === 'string') {
            const rel = tp.relations[fName];
            if (rel !== undefined) {
              const pairKey = `edge-${[tp.name, rel.type].sort().join('-')}`;
              if (processedPairs.has(pairKey)) return;
              processedPairs.add(pairKey);

              const card = determineCardinality(fDef, rel.definition);
              if (tp.name !== rel.type) {
                standalone.delete(tp.name);
                standalone.delete(rel.type);
              }
              edgeRoutes.push({
                id: pairKey,
                sources: [tp.name],
                targets: [rel.type],
                card: card,
                label: `${tp.name} (${card}) ${rel.type}`,
              });
              return;
            }
            const other = fDef.replace(nameOnryRe, '');
            const pairKey = `edge-${[tp.name, other].sort().join('-')}`;
            if (!names.has(other) || processedPairs.has(pairKey)) return;
            processedPairs.add(pairKey);

            const card = determineCardinality(fDef, undefined);
            if (tp.name !== other) {
              standalone.delete(tp.name);
              standalone.delete(other);
            }
            edgeRoutes.push({
              id: pairKey,
              sources: [tp.name],
              targets: [other],
              card: card,
              label: `${tp.name} (${card}) ${other}`,
            });
          }
        });
      };

      types.forEach((tp) => {
        if (!includeWpo && tp.wrapOnly) return;
        calcTypeEdges(tp);
      });

      types.forEach((tp) => {
        if ((!includeWpo && tp.wrapOnly) || standalone.has(tp.name)) return;
        const headerHeight = 40;
        const fieldRowHeight = 20;
        const totalHeight = headerHeight + (tp.fields.length * fieldRowHeight) + 8;

        childrenNodes.push({
          id: tp.name,
          width: 300,
          height: totalHeight,
          layoutOptions: { 'elk.portConstraints': 'FREE' },
          tp: tp,
        });
      });

      enums.forEach((enu) => {
        if (standalone.has(enu.name)) return;
        const headerHeight = 40;
        const memberRowHeight = 20;
        const totalHeight = headerHeight + (enu.members.length * memberRowHeight) + 8;
        childrenNodes.push({
          id: enu.name,
          width: 200,
          height: totalHeight,
          enu: enu,
        });
      });

      const layoutGraph: ElkNode = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
        },
        children: childrenNodes,
        edges: edgeRoutes.filter((edge) => !standalone.has(edge.sources[0])),
      };

      try {
        const result = await elk.layout(layoutGraph);
        if (!active) return;

        nodesRef.current = result.children as Node[] || []; // Store coordinates in ref
        setNodes(result.children as Node[] || []);
        setEdges(result.edges as Edge[] || []);
        setIsReady(true);
      } catch (err) {
        console.error('ELK Engine fault:', err);
      }
    }

    computeLayout();
    return () => { active = false; };
  }, [types, enums, includeStandalone, includeWpo]);

  const renderedEdges = useMemo(() => {
    return edges.map((edge) => {
      const sections = edge.sections?.[0];
      if (!sections) return { ...edge, path: '' };

      const start = sections.startPoint;
      const end = sections.endPoint;
      let pathString = `M ${start.x} ${start.y}`;

      if (sections.bendPoints) {
        sections.bendPoints.forEach((bp) => {
          pathString += ` L ${bp.x} ${bp.y}`;
        });
      }
      pathString += ` L ${end.x} ${end.y}`;
      return { ...edge, path: pathString };
    });
  }, [edges]);

  const handleZoomWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.stopPropagation();
    if (!svgRef.current) return;

    const zoomIntensity = 0.05;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const canvasX = (mouseX - pan.x) / zoom;
    const canvasY = (mouseY - pan.y) / zoom;

    const zoomFactor = event.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    const nextZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 2.0);

    setPan({
      x: mouseX - canvasX * nextZoom,
      y: mouseY - canvasY * nextZoom
    });
    setZoom(nextZoom);
    if (hoveredEdge) setHoveredEdge(null);
  };

  const handleZoomStep = (zoomStep: number) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.right / 2;
    const centerY = rect.bottom / 2;
    const canvasX = (centerX - pan.x) / zoom;
    const canvasY = (centerY - pan.y) / zoom;

    const nextZoom = Math.min(Math.max(zoom + zoomStep, 0.1), 2.0);

    setPan({
      x: centerX - canvasX * nextZoom,
      y: centerY - canvasY * nextZoom
    });
    setZoom(nextZoom);
    if (hoveredEdge) setHoveredEdge(null);
  };

  const handlePanStart = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: event.clientX - pan.x, y: event.clientY - pan.y };
  };

  const handlePanMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (!isDragging.current) return;
    setPan({
      x: event.clientX - dragStart.current.x,
      y: event.clientY - dragStart.current.y
    });
  };

  const handlePanEnd = () => {
    isDragging.current = false;
  };

  const handleEdgeMouseMove = (event: ReactMouseEvent<SVGPathElement>, edge: Edge) => {
    setHoveredEdge(edge);
    setTooltipPos({ x: event.clientX + 14, y: event.clientY + 14 });
  };


  return createPortal(
    <Theme appearance={appearance}>
      <div className="fixed inset-0 w-screen h-screen m-0 p-0 overflow-hidden z-[9999]">
        <div className="absolute inset-0 w-full h-full z-10 bg-[var(--gray-1)] select-none">
          {!isReady ? (
            <Flex align="center" justify="center" className="w-full h-full bg-[var(--gray-2)]">
              <Text size="2" color="gray" className="animate-pulse font-mono">
                Calculating coordinates...
              </Text>
            </Flex>
          ) : nodes.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="3"
              className="w-full h-full bg-[var(--gray-2)] select-none animate-fade-in"
            >
              <div className="p-4 bg-[var(--gray-3)] border border-[var(--gray-4)] rounded-full text-[var(--gray-8)]">
                <ComponentInstanceIcon width="24" height="24" className="opacity-40" />
              </div>
              <Flex direction="column" align="center" gap="1">
                <Text size="3" weight="bold" className="font-mono text-[var(--gray-12)]">
                  No components found in this scope
                </Text>
                <Text size="1" color="gray" className="text-center max-w-[320px]">
                  No matching types or enumerators resolved within <code className="bg-[var(--gray-3)] px-1 rounded text-[var(--gray-11)] font-mono">{scope}</code>.
                </Text>
              </Flex>
            </Flex>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
              onMouseDown={handlePanStart}
              onMouseMove={handlePanMove}
              onMouseUp={handlePanEnd}
              onMouseLeave={() => { handlePanEnd(); setHoveredEdge(null); }}
              onWheel={handleZoomWheel}
            >
              <defs>
                <marker id="marker-one-src" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <circle cx="5" cy="5" r="3" className="fill-[context-stroke]" style={{ fill: 'context-stroke' }} />
                </marker>

                <marker id="marker-one-tgt" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <circle cx="5" cy="5" r="3" className="fill-[context-stroke]" style={{ fill: 'context-stroke' }} />
                </marker>

                <marker id="marker-many-src" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 9 2 L 2 5 L 9 8 M 2 5 L 9 5" className="fill-none stroke-[1.2px]" style={{ stroke: 'context-stroke' }} />
                </marker>

                <marker id="marker-many-tgt" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 9 2 L 2 5 L 9 8 M 2 5 L 9 5" className="fill-none stroke-[1.2px]" style={{ stroke: 'context-stroke' }} />
                </marker>
              </defs>

              <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', transition: 'transform 0.2s ease-out' }}>

                {/* EDGES */}
                {renderedEdges.map((edge) => {
                  const card = edge.card ?? '1:1';
                  const [srcType, tgtType] = card.split(':');
                  const markerStart = srcType === 'N' ? 'url(#marker-many-src)' : srcType === '1' ? 'url(#marker-one-src)' : 'url(#marker-no-src)';
                  const markerEnd = tgtType === 'N' ? 'url(#marker-many-tgt)' : tgtType === '1' ? 'url(#marker-one-src)' : 'url(#marker-no-src)';
                  const lineColor = getCardinalityColor(edge.card);
                  const lineWidth = edge.card.includes('0') ? '2px' : '3px';
                  const isThisHovered = hoveredEdge?.id === edge.id;
                  return (
                    <path
                      key={edge.id}
                      d={edge.path}
                      markerStart={markerStart}
                      markerEnd={markerEnd}
                      onMouseMove={(e) => { handleEdgeMouseMove(e, edge); }}
                      onMouseLeave={() => { setHoveredEdge(null); }}
                      style={{
                        stroke: lineColor,
                        strokeWidth: isThisHovered ? '5px' : lineWidth,
                      }}
                      className="fill-none transition-all duration-700 cursor-pointer opacity-75 hover:opacity-100"
                    />
                  );
                })}

                {/* NODES */}
                {nodes.map((node) => (
                  <foreignObject
                    key={node.id}
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    className="overflow-visible"
                  >
                    {node.tp && (
                      <Box className={`bg-[var(--gray-1)] border border-[var(--gray-4)] rounded-lg shadow-sm w-full h-full cursor-default overflow-hidden transition-all duration-150 hover:border-[var(--iris-7)] ${node.tp.wrapOnly ? 'opacity-80' : ''}`}>
                        <Flex
                          align="center"
                          justify="between"
                          className="bg-[var(--gray-2)] border-b border-[var(--gray-4)] px-3 py-2 select-none cursor-pointer"
                          onClick={() => onNavigateToType?.(node.id)}
                        >
                          <Flex align="center" gap="2">
                            <CubeIcon color="var(--iris-9)" width="14" height="14" />
                            <Text size="2" weight="bold" className="font-mono text-[var(--gray-12)]">{node.id}</Text>
                          </Flex>
                          {node.tp.wrapOnly && <Badge size="1" color="iris">WPO</Badge>}
                        </Flex>

                        <Box className="p-2">
                          {node.tp.fields.sort().map(([fName, fDef]) => {
                            const nameOnryRe = /[^_a-zA-Z0-9]/g;
                            const target = typeof fDef === 'string' ? fDef.replace(nameOnryRe, '') : '';
                            const targetNode = target ? nodes.find(n => n.id === target) : undefined;
                            const isClickable = !!targetNode;

                            return (
                              <Flex
                                key={fName}
                                align="center"
                                justify="between"
                                className={`px-2 py-0.5 rounded transition-colors duration-100 select-none ${isClickable
                                  ? 'cursor-pointer hover:bg-[var(--iris-3)]'
                                  : 'cursor-default'
                                }`}
                                onClick={(e) => {
                                  if (!isClickable) return;
                                  e.stopPropagation();
                                  navigateToNode(target);
                                }}
                              >
                                <Text size="1" weight="medium" className="font-mono text-[var(--gray-11)]">{fName}</Text>
                                <Text size="1" className="font-mono text-[var(--gray-8)] max-w-[120px] truncate">{String(fDef)}</Text>
                              </Flex>
                            );
                          })}
                        </Box>
                      </Box>
                    )}
                    {node.enu && (
                      <Box className="bg-[var(--gray-1)] border border-[var(--gray-4)] rounded-lg shadow-sm w-full h-full overflow-hidden hover:border-[var(--orange-7)] cursor-default">
                        <Flex
                          align="center"
                          gap="2"
                          className="bg-[var(--gray-2)] border-b border-[var(--gray-4)] px-3 py-2 cursor-pointer"
                          onClick={() => onNavigateToEnum?.(node.id)}
                        >
                          <TokensIcon color="var(--orange-9)" width="14" height="14" />
                          <Text size="2" weight="bold" className="font-mono text-[var(--orange-11)]">{node.id}</Text>
                        </Flex>
                        <Box className="p-1.5">
                          {node.enu.members.map(([mName, mVal]) => (
                            <Flex key={mName} align="center" justify="between" className="px-2 py-0.5">
                              <Text size="1" weight="medium" className="font-mono text-[var(--gray-10)]">{mName}</Text>
                              <Text size="1" className="font-mono text-[var(--gray-7)] max-w-[90px] truncate">{typeof mVal === 'string' ? mVal : JSON.stringify(mVal)}</Text>
                            </Flex>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </foreignObject>
                ))}
              </g>
            </svg>
          )}
        </div>

        <div
          className="absolute inset-0 w-full h-full pointer-events-none z-20 flex justify-end items-start p-4"
        >
          <div className="flex items-center gap-3 pointer-events-auto">
            {nodes.length > 0 && (
              <div className="absolute top-4 right-14 z-[999999] flex items-center gap-2">
                <Flex
                  align="center"
                  gap="2"
                  className="bg-[var(--gray-surface)] border border-[var(--gray-4)] shadow-md p-1 rounded-full pointer-events-auto"
                >
                  {/* ZOOM OUT */}
                  <IconButton
                    size="2"
                    variant="ghost"
                    color="gray"
                    onClick={() => { handleZoomStep(-0.05); }}
                    className="cursor-pointer rounded-full"
                    title="Zoom Out"
                  >
                    <MinusIcon width="14" height="14" />
                  </IconButton>

                  <button
                    onClick={() => {
                      setZoom(1.00);
                      setPan({ x: 100, y: 100 });
                    }}
                    className="px-2 py-0.5 hover:bg-[var(--gray-3)] rounded-md cursor-pointer transition-colors flex items-center gap-1 group"
                    title="Reset View to 100%"
                  >
                    <Text size="1" className="font-mono text-[var(--gray-11)] font-bold group-hover:text-[var(--iris-9)]">
                      {Math.round(zoom * 100)}%
                    </Text>
                    <ResetIcon
                      width="12" height="12"
                      className="text-[var(--gray-8)] group-hover:text-[var(--iris-9)] opacity-0 group-hover:opacity-100 transition-all duration-150"
                    />
                  </button>

                  {/* ZOOM IN */}
                  <IconButton
                    size="2"
                    variant="ghost"
                    color="gray"
                    onClick={() => { handleZoomStep(0.05); }}
                    className="cursor-pointer rounded-full"
                    title="Zoom In"
                  >
                    <PlusIcon width="14" height="14" />
                  </IconButton>
                </Flex>
              </div>
            )}
            <IconButton
              size="2"
              variant="solid"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="cursor-pointer rounded-full"
            >
              <Cross2Icon width="12" height="12" />
            </IconButton>
          </div>
        </div>

        {hoveredEdge && (
          <div
            className="fixed bg-[var(--gray-surface)] border border-[var(--gray-5)] rounded-md px-2 py-1 shadow-xl pointer-events-none z-[100] flex items-center gap-2"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <Box className="w-2 h-2 rounded-full" style={{ backgroundColor: getCardinalityColor(hoveredEdge.card) }} />
            <Text size="1" className="font-mono font-bold text-[var(--gray-12)]">
              {hoveredEdge.label}
            </Text>
          </div>
        )}

      </div>
    </Theme>,
    document.body
  );
}