import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SlotWrap } from './components/SlotWrap';
import { ThemePickerModal } from './components/ThemePickerModal';
import { ExportModal } from './components/ExportModal';
import { AiGeneratorModal } from './components/AiGeneratorModal';
import { VegvisrModal } from './components/VegvisrModal';
import { VegvisrAuthModal } from './components/VegvisrAuthModal';
import { Login } from './components/Login';
import { ConfirmModal } from './components/ConfirmModal';
import { BgImageModal } from './components/BgImageModal';
import { extractImageFromDrop } from './utils/imageDropUtils';
import { useStore } from './store/useStore';
import { PortfolioPage } from './components/PortfolioPage';
import { THEMES, isDarkTheme } from './data/themes';
import { DEFAULT_NODES } from './data/defaultNodes';
import {
  DEMO_GRAPH_CONTEXT,
  DEMO_GRAPH_NODES,
  DEMO_GRAPH_SLOTS,
} from './data/demoGraph';
import {
  AppMode,
  Theme,
  NodeItem,
  SlotData,
  GridBlockData,
  GridCellData,
  DragItemPayload,
  ActiveGraphContext,
  VegvisrUser,
} from './types';
import { saveGraphWithHistory } from './utils/vegvisrApi';
import { ensureUUID } from './utils/uuidUtils';
import {
  verifyAndAuthenticateMagicToken,
  getUserFromLocalStorage,
} from './utils/vegvisrAuth';

// Initial default slots and grid blocks
const INITIAL_SLOTS: SlotData[] = [
  {
    id: 'slot-1',
    title: 'Main Showcase',
    grids: [
      {
        id: 'grid-1',
        size: 2,
        cols: 2,
        cells: [
          {
            id: 'cell-1-1',
            nodeId: 'hero-main',
            align: 'left',
            font: 'display',
          },
          {
            id: 'cell-1-2',
            nodeId: 'feature-card-1',
            align: 'left',
          },
          {
            id: 'cell-1-3',
            nodeId: 'feature-card-2',
            align: 'left',
          },
          {
            id: 'cell-1-4',
            nodeId: 'feature-card-3',
            align: 'left',
          },
        ],
      },
    ],
  },
  {
    id: 'slot-2',
    title: 'Testimonials & Call To Action',
    grids: [
      {
        id: 'grid-2',
        size: 2,
        cols: 2,
        cells: [
          {
            id: 'cell-2-1',
            nodeId: 'testimonial-quote',
            align: 'left',
            color: '--soft',
          },
          {
            id: 'cell-2-2',
            nodeId: 'stat-metric-1',
            align: 'center',
            color: '--accent',
          },
          {
            id: 'cell-2-3',
            nodeId: 'pricing-card-pro',
            align: 'left',
          },
          {
            id: 'cell-2-4',
            nodeId: 'cta-banner',
            align: 'center',
            color: '--primary',
          },
        ],
      },
    ],
  },
];

export default function App() {
  const [mode, setMode] = useState<AppMode>('editor');
  const [activeTheme, setActiveTheme] = useState<Theme>(THEMES[0]);
  const [lastLightTheme, setLastLightTheme] = useState<Theme>(
    THEMES.find((t) => !isDarkTheme(t)) || THEMES[0]
  );
  const [lastDarkTheme, setLastDarkTheme] = useState<Theme>(
    THEMES.find((t) => isDarkTheme(t)) || THEMES[1]
  );

  const isDarkMode = isDarkTheme(activeTheme);

  const handleSelectTheme = (theme: Theme) => {
    recordHistory();
    setActiveTheme(theme);
    if (isDarkTheme(theme)) {
      setLastDarkTheme(theme);
    } else {
      setLastLightTheme(theme);
    }
  };

  const handleToggleDarkMode = () => {
    if (isDarkMode) {
      setActiveTheme(lastLightTheme);
    } else {
      setActiveTheme(lastDarkTheme);
    }
  };

  const [nodes, setNodes] = useState<NodeItem[]>(DEFAULT_NODES);
  const [slots, setSlots] = useState<SlotData[]>(INITIAL_SLOTS);
  const [pageBgImage, setPageBgImage] = useState<string | undefined>(undefined);
  const [pageBgOverlay, setPageBgOverlay] = useState<number>(0.25);
  const [pageBgFit, setPageBgFit] = useState<'cover' | 'contain' | 'repeat'>('cover');
  const [isPageBgModalOpen, setIsPageBgModalOpen] = useState(false);
  const [activeGraph, setActiveGraph] = useState<ActiveGraphContext | null>(null);
  const [isSavingQuickGraph, setIsSavingQuickGraph] = useState(false);
  const [saveStatusBanner, setSaveStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // Global Undo / Redo History Stack (holds up to 25 snapshots)
  interface HistorySnapshot {
    slots: SlotData[];
    nodes: NodeItem[];
    activeTheme: Theme;
  }

  const [past, setPast] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);

  const recordHistory = () => {
    setPast((prev) => {
      const nextPast = [...prev, { slots, nodes, activeTheme }];
      return nextPast.length > 25 ? nextPast.slice(nextPast.length - 25) : nextPast;
    });
    setFuture([]);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture((prev) => [{ slots, nodes, activeTheme }, ...prev]);
    setPast(newPast);

    setSlots(previous.slots);
    setNodes(previous.nodes);
    setActiveTheme(previous.activeTheme);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, { slots, nodes, activeTheme }]);
    setFuture(newFuture);

    setSlots(next.slots);
    setNodes(next.nodes);
    setActiveTheme(next.activeTheme);
  };

  // Keyboard shortcut listener for Ctrl+Z / Cmd+Z (Undo) and Ctrl+Y / Cmd+Shift+Z / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && /MAC/i.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && !e.altKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key.toLowerCase() === 'y' && !isMac) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, slots, nodes, activeTheme]);

  // Auth Store
  const { user: currentUser, isAuthenticated, isLoading, checkMagicLinkOnMount, login } = useStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isVegvisrModalOpen, setIsVegvisrModalOpen] = useState(false);

  // Check Magic Link on Mount
  useEffect(() => {
    checkMagicLinkOnMount();
  }, [checkMagicLinkOnMount]);

  // Automatically restore last worked graph from localStorage on page load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vegvisr_last_active_graph');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeGraph && Array.isArray(parsed.slots) && parsed.slots.length > 0) {
          setActiveGraph(parsed.activeGraph);
          setSlots(parsed.slots);
          if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
            setNodes(parsed.nodes);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore last active graph from localStorage:', e);
    }
  }, []);

  // Automatically persist current active graph layout state whenever activeGraph, slots, or nodes update
  useEffect(() => {
    if (activeGraph) {
      try {
        localStorage.setItem(
          'vegvisr_last_active_graph',
          JSON.stringify({
            activeGraph,
            slots,
            nodes,
          })
        );
      } catch (e) {
        console.warn('Failed to store active graph to localStorage:', e);
      }
    }
  }, [activeGraph, slots, nodes]);

  // Handler to load the dedicated Demo Playground Graph
  const handleLoadDemoGraph = () => {
    setActiveGraph(DEMO_GRAPH_CONTEXT);
    setSlots(DEMO_GRAPH_SLOTS);
    setNodes(DEMO_GRAPH_NODES);
    setMode('editor');
  };

  // Drag state
  const [dragState, setDragState] = useState<{
    payload: DragItemPayload;
    x: number;
    y: number;
  } | null>(null);

  const [activeDropTarget, setActiveDropTarget] = useState<{
    slotId?: string;
    gridIndex?: number;
    cellIndex?: number;
  } | null>(null);

  // Apply Theme CSS variables to root element
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(activeTheme.vars).forEach(([key, val]) => {
      if (typeof val === 'string' && val) root.style.setProperty(key, val);
    });

    // Handle Google Fonts link tag dynamically
    const fontImport = activeTheme.vars['--font-import'];
    let fontLink = document.getElementById('theme-google-font') as HTMLLinkElement;
    if (fontImport) {
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = 'theme-google-font';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      fontLink.href = fontImport;
    } else if (fontLink) {
      fontLink.remove();
    }
  }, [activeTheme]);

  // Pointer drag listeners for global element dropping
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));

      // Calculate drop target under pointer
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (!element) {
        setActiveDropTarget(null);
        return;
      }

      // Check if over a grid cell
      const cellEl = element.closest('[data-cell-index]') as HTMLElement;
      if (cellEl) {
        const cellIndex = parseInt(cellEl.dataset.cellIndex || '0', 10);
        const slotEl = element.closest('[data-slot-id]') as HTMLElement;
        const slotId = slotEl?.dataset.slotId;
        setActiveDropTarget({ slotId, cellIndex });
        return;
      }

      // Check if over a slot container
      const slotEl = element.closest('[data-slot-id]') as HTMLElement;
      if (slotEl) {
        const slotId = slotEl.dataset.slotId;
        setActiveDropTarget({ slotId });
        return;
      }

      setActiveDropTarget(null);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!dragState) return;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        // Drop Grid Size Tile onto a Slot
        if (dragState.payload.kind === 'size' && dragState.payload.n) {
          const slotEl = element.closest('[data-slot-id]') as HTMLElement;
          if (slotEl) {
            const slotId = slotEl.dataset.slotId;
            handleAddGridBlockToSlot(slotId!, dragState.payload.n, dragState.payload.rows);
          }
        }

        // Drop Content Node onto a Grid Cell
        if (dragState.payload.kind === 'node' && dragState.payload.nodeId) {
          const cellEl = element.closest('[data-cell-index]') as HTMLElement;
          const slotEl = element.closest('[data-slot-id]') as HTMLElement;

          if (cellEl && slotEl) {
            const cellIndex = parseInt(cellEl.dataset.cellIndex || '0', 10);
            const slotId = slotEl.dataset.slotId;

            recordHistory();
            // Find grid block index inside slot
            setSlots((prevSlots) =>
              prevSlots.map((s) => {
                if (s.id !== slotId) return s;
                return {
                  ...s,
                  grids: s.grids.map((g) => {
                    // Update cell in the target grid
                    const updatedCells = [...g.cells];
                    if (updatedCells[cellIndex]) {
                      const targetNode = nodes.find(
                        (n) => n.id === dragState.payload.nodeId
                      );
                      updatedCells[cellIndex] = {
                        ...updatedCells[cellIndex],
                        nodeId: dragState.payload.nodeId!,
                        customMarkdown: targetNode?.info,
                        graphId: targetNode?.graphId,
                        sourceNodeId: targetNode?.sourceNodeId || targetNode?.id,
                        expectedVersion: targetNode?.expectedVersion,
                      };
                    }
                    return { ...g, cells: updatedCells };
                  }),
                };
              })
            );
          }
        }
      }

      setDragState(null);
      setActiveDropTarget(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, slots, nodes, activeTheme]);

  const handleStartDrag = (payload: DragItemPayload, e: React.PointerEvent) => {
    if (mode !== 'editor') return;
    setDragState({
      payload,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Slot Actions
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [dragTargetSlotIndex, setDragTargetSlotIndex] = useState<number | null>(null);

  const handleMoveSlot = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= slots.length || fromIndex === toIndex) return;
    recordHistory();
    setSlots((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const handleUpdateSlotTitle = (slotId: string, newTitle: string) => {
    recordHistory();
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, title: newTitle } : s))
    );
  };

  const handleSlotDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSlotIndex(index);
    e.dataTransfer.setData('text/plain', `slot:${index}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSlotDragOver = (e: React.DragEvent, index: number) => {
    if (draggedSlotIndex !== null && draggedSlotIndex !== index) {
      e.preventDefault();
      setDragTargetSlotIndex(index);
    }
  };

  const handleSlotDragLeave = () => {
    // leave as is until drop
  };

  const handleSlotDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSlotIndex !== null && draggedSlotIndex !== targetIndex) {
      handleMoveSlot(draggedSlotIndex, targetIndex);
    }
    setDraggedSlotIndex(null);
    setDragTargetSlotIndex(null);
  };

  const handleSlotDragEnd = () => {
    setDraggedSlotIndex(null);
    setDragTargetSlotIndex(null);
  };

  const handleAddSlot = () => {
    recordHistory();
    const newSlot: SlotData = {
      id: `slot-${Date.now()}`,
      title: `Slot ${slots.length + 1}`,
      grids: [],
    };
    setSlots((prev) => [...prev, newSlot]);
  };

  const handleRemoveSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    setConfirmModalData({
      isOpen: true,
      title: 'Delete Section / Slot',
      message: `Are you sure you want to delete "${slot?.title || 'this slot'}"?`,
      details: 'This will remove all grid blocks and node placements inside this section.',
      confirmLabel: 'Delete Section',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        setConfirmModalData(null);
        recordHistory();
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
      },
    });
  };

  const handleToggleSlotTransparentBg = (slotId: string) => {
    recordHistory();
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, transparentBg: !s.transparentBg } : s
      )
    );
  };

  const handleUpdateSlot = (slotId: string, updated: Partial<SlotData>) => {
    recordHistory();
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, ...updated } : s))
    );
  };

  const handleUpdateGrid = (
    slotId: string,
    gridIndex: number,
    updated: Partial<GridBlockData>
  ) => {
    recordHistory();
    setSlots((prevSlots) =>
      prevSlots.map((s) => {
        if (s.id !== slotId) return s;
        const updatedGrids = s.grids.map((g, idx) =>
          idx === gridIndex ? { ...g, ...updated } : g
        );
        return { ...s, grids: updatedGrids };
      })
    );
  };

  const handlePageDrop = async (e: React.DragEvent) => {
    const droppedImage = await extractImageFromDrop(e);
    if (droppedImage) {
      e.preventDefault();
      e.stopPropagation();
      setPageBgImage(droppedImage);
    }
  };

  // Grid Block Actions
  const handleAddGridBlockToSlot = (slotId: string, size: number, rows?: number) => {
    recordHistory();
    const numRows = rows ?? size;
    const newGridCells: GridCellData[] = Array.from(
      { length: size * numRows },
      (_, idx) => ({
        id: `cell-${Date.now()}-${idx}`,
        nodeId: null,
        align: 'left',
      })
    );

    const newGrid: GridBlockData = {
      id: `grid-${Date.now()}`,
      size,
      cols: size,
      rows: numRows,
      cells: newGridCells,
    };

    setSlots((prevSlots) =>
      prevSlots.map((s) =>
        s.id === slotId ? { ...s, grids: [...s.grids, newGrid] } : s
      )
    );
  };

  const handleRemoveGridFromSlot = (slotId: string, gridIndex: number) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Delete Grid Block',
      message: `Are you sure you want to delete Grid Block #${gridIndex + 1}?`,
      details: 'This will remove the grid container and its assigned cards from the section.',
      confirmLabel: 'Delete Grid',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        setConfirmModalData(null);
        recordHistory();
        setSlots((prevSlots) =>
          prevSlots.map((s) =>
            s.id === slotId
              ? { ...s, grids: s.grids.filter((_, idx) => idx !== gridIndex) }
              : s
          )
        );
      },
    });
  };

  const handleToggleGridTransparentBg = (slotId: string, gridIndex: number) => {
    recordHistory();
    setSlots((prevSlots) =>
      prevSlots.map((s) => {
        if (s.id !== slotId) return s;
        const updatedGrids = s.grids.map((g, idx) =>
          idx === gridIndex ? { ...g, transparentBg: !g.transparentBg } : g
        );
        return { ...s, grids: updatedGrids };
      })
    );
  };

  // Cell Actions
  const handleUpdateCell = (
    slotId: string,
    gridIndex: number,
    cellIndex: number,
    updated: Partial<GridCellData>
  ) => {
    recordHistory();
    setSlots((prevSlots) =>
      prevSlots.map((s) => {
        if (s.id !== slotId) return s;
        return {
          ...s,
          grids: s.grids.map((g, gIdx) => {
            if (gIdx !== gridIndex) return g;
            const updatedCells = [...g.cells];
            updatedCells[cellIndex] = {
              ...updatedCells[cellIndex],
              ...updated,
            };
            return { ...g, cells: updatedCells };
          }),
        };
      })
    );
  };

  const handleClearCell = (
    slotId: string,
    gridIndex: number,
    cellIndex: number
  ) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Remove Node from Grid',
      message: 'Are you sure you want to remove this node card from the grid?',
      details: 'The card content will be removed from this cell.',
      confirmLabel: 'Remove Node',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        setConfirmModalData(null);
        handleUpdateCell(slotId, gridIndex, cellIndex, {
          nodeId: null,
          customMarkdown: undefined,
        });
      },
    });
  };

  // Reset Canvas Layout
  const handleResetLayout = () => {
    setConfirmModalData({
      isOpen: true,
      title: 'Reset Canvas Layout',
      message: 'Are you sure you want to reset the entire canvas layout to default?',
      details: 'All unsaved slot arrangements and grid configurations will be reset.',
      confirmLabel: 'Reset Layout',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        setConfirmModalData(null);
        recordHistory();
        setSlots(INITIAL_SLOTS);
      },
    });
  };

  const handleAddCustomNode = (newNode: NodeItem) => {
    recordHistory();
    setNodes((prev) => [newNode, ...prev]);
  };

  const handleUpdateNodeInfo = (nodeId: string, newInfo: string, newVersion?: number) => {
    recordHistory();
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              info: newInfo,
              ...(newVersion !== undefined ? { expectedVersion: newVersion } : {}),
            }
          : n
      )
    );
  };

  const formatNodeContent = (node: any, graphTitle?: string): string => {
    const baseText = (node.info || node.description || '').trim();
    const nodeType = (node.type || '').toLowerCase();
    const videoPath = (node.path || node.url || node.videoUrl || '').trim();
    const publicUrl = (node.publicUrl || '').trim();
    const label = node.label || node.id || 'Node';

    const isVideo =
      nodeType === 'cloudflare-video' ||
      nodeType === 'video' ||
      !!videoPath.match(/\.(webm|mp4|mov|ogg|m4v)(\?.*)?$/i) ||
      !!publicUrl.match(/\.(webm|mp4|mov|ogg|m4v)(\?.*)?$/i) ||
      node.id === 'node-video-lydmora';

    if (isVideo) {
      let mainMediaUrl = publicUrl;
      if (!mainMediaUrl) {
        if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
          mainMediaUrl = videoPath;
        } else if (videoPath.startsWith('recordings/')) {
          mainMediaUrl = `https://realtimevideos.vegvisr.org/${videoPath}`;
        } else if (videoPath) {
          mainMediaUrl = `/api/vegvisr/proxy/${videoPath}`;
        }
      }

      const proxyMediaUrl = videoPath ? `/api/vegvisr/proxy/${videoPath}` : mainMediaUrl;

      const heading = `### 🎬 ${label}`;
      const desc = baseText ? baseText : `*Video Node (${nodeType || 'Cloudflare Video'})*`;

      let videoHtml = '';
      if (mainMediaUrl) {
        videoHtml = `\n\n<div class="my-3 p-3 rounded-2xl border border-slate-700/80 bg-slate-950/90 shadow-xl backdrop-blur-md">
  <div class="flex items-center justify-between text-xs font-semibold text-pink-300 mb-2">
    <span>🎥 ${label}</span>
    <span class="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">Video Player</span>
  </div>
  <video controls class="w-full h-auto rounded-xl max-h-[420px] bg-black shadow-inner" preload="metadata">
    <source src="${mainMediaUrl}" type="video/webm" />
    <source src="${proxyMediaUrl}" type="video/webm" />
    <source src="${mainMediaUrl}" type="video/mp4" />
    Your browser does not support playing this video directly.
  </video>
  <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between gap-2 overflow-hidden">
    <span class="truncate">Source: <code class="text-slate-300 bg-slate-800/80 px-1 py-0.5 rounded">${mainMediaUrl}</code></span>
    <a href="${mainMediaUrl}" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline font-semibold shrink-0">Open Video ↗</a>
  </div>
</div>`;
      } else {
        videoHtml = `\n\n<div class="my-3 p-4 rounded-2xl border border-dashed border-pink-500/40 bg-pink-950/20 text-center">
  <div class="text-pink-300 font-semibold text-sm mb-1">🎬 ${label}</div>
  <p class="text-xs text-slate-400 mb-2">No video URL attached yet. Paste a URL in the Markdown editor.</p>
</div>`;
      }

      if (baseText.includes('<video') || baseText.includes('video-card-container')) {
        return baseText;
      }
      return `${heading}\n${desc}${videoHtml}`;
    }

    return baseText || `### ${label}\n*Source Graph: ${graphTitle || 'Knowledge Graph'}*`;
  };

  const handleOpenGraphInEditor = (graphData: any) => {
    const title =
      graphData.title ||
      graphData.metadata?.title ||
      graphData.name ||
      graphData.id ||
      'Knowledge Graph';
    const graphNodes = graphData.nodes || [];

    const rawGraphId =
      graphData.id ||
      graphData.graphId ||
      graphData.graph_id ||
      graphData._id ||
      graphData.metadata?.graphId ||
      graphData.metadata?.id;

    // Strict policy: Graph ID MUST be a valid UUID. If missing or invalid, generate a clean UUID.
    const graphId = ensureUUID(rawGraphId);

    const version = graphData.metadata?.version ?? graphData.version ?? 0;

    setActiveGraph({
      id: graphId,
      title: title,
      version: version,
    });

    if (!graphNodes.length) {
      const emptyCell: GridCellData = {
        id: `cell-${Date.now()}-0`,
        nodeId: 'node-empty',
        customMarkdown: `# ${title}\n\n*Source Graph: ${title}*\n\nThis graph has no nodes yet.`,
        graphId,
        expectedVersion: version,
        align: 'left',
      };
      const emptyGrid: GridBlockData = {
        id: `grid-${Date.now()}-0`,
        size: 1,
        cols: 1,
        cells: [emptyCell],
      };
      const newSlot: SlotData = {
        id: `slot-${Date.now()}`,
        title: title,
        grids: [emptyGrid],
      };
      setSlots([newSlot]);
      setMode('editor');
      return;
    }

    // Register all nodes into Node Library (`nodes` state)
    const libraryNodes: NodeItem[] = graphNodes.map((n: any) => ({
      id: n.id || `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: n.label || n.name || n.id || 'Graph Node',
      category: `[Graph] ${title}`,
      info: formatNodeContent(n, title),
      graphId,
      sourceNodeId: n.id,
      expectedVersion: version,
    }));

    setNodes((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const toAdd = libraryNodes.filter((item) => !existingIds.has(item.id));
      return [...toAdd, ...prev];
    });

    // Check if graph nodes carry slot layout metadata
    const hasSlotMetadata = graphNodes.some((n: any) => n.metadata?.slotId);

    let newSlots: SlotData[] = [];

    if (hasSlotMetadata) {
      const slotMap = new Map<
        string,
        {
          title: string;
          gridMap: Map<string, { size: number; cols: number; cells: GridCellData[] }>;
        }
      >();

      graphNodes.forEach((node: any, idx: number) => {
        const meta = node.metadata || {};
        const slotId = meta.slotId || `slot-${node.id || idx}`;
        const slotTitle = meta.slotTitle || node.label || node.name || `Slot ${idx + 1}`;
        const gridId = meta.gridId || `grid-${slotId}-${idx}`;
        const gridSize = meta.gridSize || 1;
        const gridCols = meta.gridCols || 1;

        if (!slotMap.has(slotId)) {
          slotMap.set(slotId, { title: slotTitle, gridMap: new Map() });
        }

        const slotEntry = slotMap.get(slotId)!;
        if (!slotEntry.gridMap.has(gridId)) {
          slotEntry.gridMap.set(gridId, { size: gridSize, cols: gridCols, cells: [] });
        }

        const cellContent =
          node.info !== undefined && node.info !== null && node.info !== ''
            ? node.info
            : formatNodeContent(node, title);

        const cell: GridCellData = {
          id: `cell-${node.id || idx}`,
          nodeId: node.id,
          customMarkdown: cellContent,
          graphId,
          sourceNodeId: node.id,
          expectedVersion: version,
          align: meta.cellAlign || meta.align || 'left',
        };

        slotEntry.gridMap.get(gridId)!.cells.push(cell);
      });

      slotMap.forEach((slotEntry, slotId) => {
        const grids: GridBlockData[] = [];
        slotEntry.gridMap.forEach((gridData, gridId) => {
          grids.push({
            id: gridId,
            size: gridData.size,
            cols: gridData.cols,
            cells: gridData.cells,
          });
        });

        newSlots.push({
          id: slotId,
          title: slotEntry.title,
          grids,
        });
      });
    } else {
      // Each node in the graph has its own slot
      newSlots = graphNodes.map((node: any, idx: number) => {
        const meta = node.metadata || {};
        const nodeLabel = node.label || node.name || node.id || `Node ${idx + 1}`;
        const slotTitle = meta.slotTitle || nodeLabel;
        const cellContent =
          node.info !== undefined && node.info !== null && node.info !== ''
            ? node.info
            : formatNodeContent(node, title);

        const cell: GridCellData = {
          id: `cell-${node.id || idx}`,
          nodeId: node.id,
          customMarkdown: cellContent,
          graphId,
          sourceNodeId: node.id,
          expectedVersion: version,
          align: meta.cellAlign || meta.align || 'left',
        };

        const grid: GridBlockData = {
          id: meta.gridId || `grid-${node.id || idx}`,
          size: meta.gridSize || 1,
          cols: meta.gridCols || 1,
          cells: [cell],
        };

        return {
          id: meta.slotId || `slot-${node.id || idx}`,
          title: slotTitle,
          grids: [grid],
        };
      });
    }

    setSlots(newSlots);
    setMode('editor');
  };

  const executeQuickSave = async () => {
    if (!activeGraph) return;
    setIsSavingQuickGraph(true);
    setSaveStatusBanner(null);
    const targetId = ensureUUID(activeGraph.id);
    try {
      const res = await saveGraphWithHistory({
        id: targetId,
        title: activeGraph.title,
        slots,
        nodes,
        override: true,
      });
      const finalId = ensureUUID(res.id || targetId);
      setActiveGraph((prev) =>
        prev
          ? {
              ...prev,
              id: finalId,
              version: res.newVersion !== undefined ? res.newVersion : (prev.version ? prev.version + 1 : 1),
            }
          : null
      );
      setSaveStatusBanner({
        type: 'success',
        text: `Graph '${activeGraph.title}' saved to Vegvisr v${res.newVersion || 1}!`,
      });
      setTimeout(() => setSaveStatusBanner(null), 6000);
    } catch (err: any) {
      console.error('Quick save failed:', err);
      setSaveStatusBanner({
        type: 'error',
        text: `Save graph failed: ${err.message || err}`,
      });
    } finally {
      setIsSavingQuickGraph(false);
    }
  };

  const handleQuickSaveGraph = () => {
    if (!activeGraph) return;

    const graphId = ensureUUID(activeGraph.id);

    const placedNodesCount = slots.reduce((acc, slot) => {
      return (
        acc +
        slot.grids.reduce((gAcc, grid) => {
          return (
            gAcc +
            grid.cells.filter(
              (cell) => cell.nodeId || cell.customMarkdown?.trim()
            ).length
          );
        }, 0)
      );
    }, 0);

    setConfirmModalData({
      isOpen: true,
      title: 'Confirm Save Graph',
      message: `Do you want to save changes to the active graph?`,
      details: `Graph Title: "${activeGraph.title}"\nGraph ID: ${graphId}\nLayout Structure: ${slots.length} slots | ${placedNodesCount} active nodes in canvas`,
      onConfirm: () => {
        setConfirmModalData(null);
        executeQuickSave();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white text-sm font-sans space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-300 font-medium">Verifying magic link authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300 flex flex-col"
      style={{
        backgroundColor: 'var(--bg1)',
        color: 'var(--text)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Top Navbar */}
      <Navbar
        mode={mode}
        setMode={setMode}
        activeTheme={activeTheme}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenThemePicker={() => setIsThemePickerOpen(true)}
        onAddSlot={handleAddSlot}
        onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
        onOpenVegvisrModal={() => setIsVegvisrModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onResetLayout={handleResetLayout}
        slotCount={slots.length}
        activeGraph={activeGraph}
        onClearActiveGraph={() => {
          setActiveGraph(null);
          localStorage.removeItem('vegvisr_last_active_graph');
        }}
        onQuickSaveGraph={handleQuickSaveGraph}
        isSavingQuickGraph={isSavingQuickGraph}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onLoadDemoGraph={handleLoadDemoGraph}
        onOpenPageBgModal={() => setIsPageBgModalOpen(true)}
        hasPageBg={!!pageBgImage}
      />

      {/* Main Workspace Layout */}
      {mode === 'portfolio' ? (
        <PortfolioPage
          onImportNode={handleAddCustomNode}
          onNavigateToEditor={() => setMode('editor')}
          onOpenGraphInEditor={handleOpenGraphInEditor}
        />
      ) : (
        <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
          {/* Left Palette Sidebar (Editor Mode Only) */}
          {mode === 'editor' && (
            <Sidebar
              nodes={nodes}
              onAddCustomNode={handleAddCustomNode}
              onStartDrag={handleStartDrag}
              onAddGridToActiveSlot={(size, rows) => {
                if (slots.length > 0) {
                  handleAddGridBlockToSlot(slots[slots.length - 1].id, size, rows);
                } else {
                  handleAddSlot();
                }
              }}
            />
          )}

          {/* Main Canvas Area */}
          <main
            className={`flex-1 overflow-y-auto transition-all relative ${
              mode === 'view'
                ? 'max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16'
                : 'p-6 sm:p-10'
            }`}
            style={{
              backgroundColor: pageBgImage ? undefined : 'var(--bg1)',
              backgroundImage: pageBgImage ? `url(${pageBgImage})` : undefined,
              backgroundSize: pageBgFit || 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: pageBgFit === 'repeat' ? 'repeat' : 'no-repeat',
              color: 'var(--text)',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handlePageDrop}
          >
            {pageBgImage && (
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundColor: 'rgba(0,0,0,1)',
                  opacity: pageBgOverlay ?? 0.25,
                }}
              />
            )}

            <div className="relative z-1">
              {mode === 'editor' && (
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                      Interactive HTML Node Canvas
                    </h2>
                    <p className="text-xs mt-1 opacity-80" style={{ color: 'var(--text)' }}>
                      Drag grid sizes into slot dropzones, or drop background images directly anywhere onto the page.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium opacity-80" style={{ color: 'var(--text)' }}>
                      {slots.length} Slots
                    </span>
                  </div>
                </div>
              )}

              {/* Slots List */}
              <div className="space-y-6">
                {slots.map((slot, sIdx) => (
                  <SlotWrap
                    key={slot.id}
                    slot={slot}
                    index={sIdx}
                    totalSlots={slots.length}
                    nodes={nodes}
                    mode={mode}
                    onRemoveSlot={() => handleRemoveSlot(slot.id)}
                    onToggleSlotTransparentBg={() => handleToggleSlotTransparentBg(slot.id)}
                    onUpdateSlot={(updated) => handleUpdateSlot(slot.id, updated)}
                    onMoveSlot={handleMoveSlot}
                    onUpdateSlotTitle={(newTitle) =>
                      handleUpdateSlotTitle(slot.id, newTitle)
                    }
                    onRemoveGrid={(gIdx) => handleRemoveGridFromSlot(slot.id, gIdx)}
                    onToggleGridTransparentBg={(gIdx) => handleToggleGridTransparentBg(slot.id, gIdx)}
                    onUpdateGrid={(gIdx, updated) => handleUpdateGrid(slot.id, gIdx, updated)}
                    onUpdateCell={(gIdx, cIdx, updated) =>
                      handleUpdateCell(slot.id, gIdx, cIdx, updated)
                    }
                    onClearCell={(gIdx, cIdx) => handleClearCell(slot.id, gIdx, cIdx)}
                    onUpdateNodeInfo={handleUpdateNodeInfo}
                    isDragOverSlot={activeDropTarget?.slotId === slot.id}
                    onAddGridToSlot={(size) => handleAddGridBlockToSlot(slot.id, size)}
                    isDraggingThisSlot={draggedSlotIndex === sIdx}
                    isDragTargetSlot={dragTargetSlotIndex === sIdx}
                    onSlotDragStart={handleSlotDragStart}
                    onSlotDragOver={handleSlotDragOver}
                    onSlotDragLeave={handleSlotDragLeave}
                    onSlotDrop={handleSlotDrop}
                    onSlotDragEnd={handleSlotDragEnd}
                    allSlots={slots}
                    activeGraphId={activeGraph?.id}
                    activeGraphTitle={activeGraph?.title}
                  />
                ))}

                {/* Trailing Add Slot Drop Zone in Editor Mode */}
                {mode === 'editor' && (
                  <button
                    onClick={handleAddSlot}
                    className="w-full py-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 text-xs font-semibold group hover:opacity-100 opacity-80"
                    style={{
                      borderColor: 'var(--card-border)',
                      backgroundColor: 'rgba(0,0,0,0.03)',
                      color: 'var(--text)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors font-bold text-sm"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text)',
                      }}
                    >
                      +
                    </div>
                    Click to add another Slot Container Dropzone
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Floating Drag Ghost Follower */}
      {dragState && (
        <div
          className="fixed pointer-events-none z-50 px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-indigo-400/50 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${dragState.x}px`,
            top: `${dragState.y}px`,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          {dragState.payload.label}
        </div>
      )}

      {/* Theme Picker Modal */}
      <ThemePickerModal
        isOpen={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        slots={slots}
        nodes={nodes}
        activeTheme={activeTheme}
        onImportJson={(importedSlots) => setSlots(importedSlots)}
        pageBgImage={pageBgImage}
        pageBgOverlay={pageBgOverlay}
        pageBgFit={pageBgFit}
      />

      {/* Page Background Image Modal */}
      <BgImageModal
        isOpen={isPageBgModalOpen}
        title="Page Background Image"
        bgImage={pageBgImage}
        bgOverlay={pageBgOverlay}
        bgFit={pageBgFit}
        onClose={() => setIsPageBgModalOpen(false)}
        onSave={(config) => {
          setPageBgImage(config.bgImage);
          if (config.bgOverlay !== undefined) setPageBgOverlay(config.bgOverlay);
          if (config.bgFit !== undefined) setPageBgFit(config.bgFit);
        }}
      />

      {/* AI Content Generator Modal */}
      <AiGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onAddGeneratedNode={handleAddCustomNode}
      />

      {/* Vegvisr Knowledge Graphs Modal */}
      <VegvisrModal
        isOpen={isVegvisrModalOpen}
        onClose={() => setIsVegvisrModalOpen(false)}
        onImportAsNode={handleAddCustomNode}
        onOpenGraphInEditor={handleOpenGraphInEditor}
        slots={slots}
        nodes={nodes}
        activeTheme={activeTheme}
        activeGraph={activeGraph}
        onLoadDemoGraph={handleLoadDemoGraph}
        onGraphSaved={(graphId, title, version) =>
          setActiveGraph({
            id: graphId,
            title,
            version,
          })
        }
      />

      {/* Vegvisr Auth Modal */}
      <VegvisrAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Global Confirmation Modal */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={confirmModalData.isOpen}
          title={confirmModalData.title}
          message={confirmModalData.message}
          details={confirmModalData.details}
          confirmLabel={confirmModalData.confirmLabel}
          cancelLabel={confirmModalData.cancelLabel}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      )}

      {/* Global Save Status Toast Banner */}
      {saveStatusBanner && (
        <div
          id="global-save-toast-banner"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-semibold animate-bounce ${
            saveStatusBanner.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          <span>{saveStatusBanner.text}</span>
          <button
            onClick={() => setSaveStatusBanner(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
