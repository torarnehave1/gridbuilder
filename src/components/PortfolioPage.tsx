import React, { useState, useEffect } from 'react';
import {
  Network,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Layers,
  Calendar,
  User,
  Tag,
  ArrowRight,
  X,
  Plus,
  Check,
  ExternalLink,
  ShieldCheck,
  FileText,
  Sparkles,
  GitCommit,
  Hash,
  Database,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { renderMarkdownToHtml } from '../utils/markdown';
import { ImageContextMenu } from './ImageContextMenu';
import { updateImageInMarkdown } from '../utils/imageUtils';
import { patchVegvisrNode } from '../utils/vegvisrApi';
import { TextFontContextMenu } from './TextFontContextMenu';
import { applyStyleToSelectedText } from '../utils/fontUtils';
import { ConfirmModal } from './ConfirmModal';
import {
  KnowGraphSummary,
  KnowGraphDetail,
  MetaAreaItem,
  NodeItem,
} from '../types';

const API_TOKEN = 'vgvsr_2f390889b0373a8c846c5c795a4deea3f86fe022240622bf';
const BASE_URL = 'https://knowledge.vegvisr.org';

interface PortfolioPageProps {
  onImportNode?: (node: NodeItem) => void;
  onNavigateToEditor?: () => void;
  onOpenGraphInEditor?: (graphDetail: KnowGraphDetail) => void;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({
  onImportNode,
  onNavigateToEditor,
  onOpenGraphInEditor,
}) => {
  // State for summaries list
  const [summaries, setSummaries] = useState<KnowGraphSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [limit] = useState<number>(20);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMetaArea, setSelectedMetaArea] = useState<string | null>(null);

  // Meta-areas state
  const [metaAreas, setMetaAreas] = useState<MetaAreaItem[]>([]);
  const [loadingMetaAreas, setLoadingMetaAreas] = useState<boolean>(false);
  const [metaAreaSearch, setMetaAreaSearch] = useState<string>('');
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);

  // Modal / Detail state
  const [selectedGraphId, setSelectedGraphId] = useState<string | null>(null);
  const [graphDetail, setGraphDetail] = useState<KnowGraphDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'nodes' | 'edges' | 'raw'>('nodes');
  const [nodeSearch, setNodeSearch] = useState<string>('');
  const [importedNodeIds, setImportedNodeIds] = useState<Record<string, boolean>>({});

  // Image scaling context menu state
  const [imageMenu, setImageMenu] = useState<{
    x: number;
    y: number;
    src: string;
    alt: string;
    pipeStyles?: string;
    nodeId: string;
  } | null>(null);

  const [textMenu, setTextMenu] = useState<{
    x: number;
    y: number;
    selectedText: string;
    nodeId: string;
  } | null>(null);

  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    onConfirm: () => void;
  } | null>(null);

  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
    const selStr = window.getSelection()?.toString().trim();
    if (selStr && selStr.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setTextMenu({
        x: e.clientX,
        y: e.clientY,
        selectedText: selStr,
        nodeId,
      });
      return;
    }

    handleImageInteraction(e, nodeId);
  };

  const handleApplyTextStyle = (
    styleType: 'font' | 'color' | 'bold' | 'italic' | 'code' | 'highlight' | 'h1' | 'h2' | 'h3' | 'clear',
    value?: string
  ) => {
    if (!textMenu || !graphDetail) return;
    const targetNode = graphDetail.nodes?.find((n) => n.id === textMenu.nodeId);
    if (!targetNode || !targetNode.info) return;

    const updatedMd = applyStyleToSelectedText(
      targetNode.info,
      textMenu.selectedText,
      styleType,
      value
    );

    setGraphDetail((prev) => {
      if (!prev || !prev.nodes) return prev;
      return {
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === textMenu.nodeId ? { ...n, info: updatedMd } : n
        ),
      };
    });

    setTextMenu(null);
  };

  const handleImageInteraction = (e: React.MouseEvent, nodeId: string) => {
    const target = e.target as HTMLElement;
    const imgEl = target.closest('img, [data-img-src]') as HTMLImageElement | null;
    if (!imgEl) return;

    e.preventDefault();
    e.stopPropagation();

    const src = imgEl.getAttribute('data-img-src') || imgEl.src || '';
    const alt = imgEl.getAttribute('data-img-alt') || imgEl.alt || 'Image';
    const pipeStyles = imgEl.getAttribute('data-img-styles') || '';

    const rect = imgEl.getBoundingClientRect();
    let x = e.clientX || (rect ? rect.left + rect.width / 2 : 100);
    let y = e.clientY || (rect ? rect.top + rect.height / 2 : 100);

    setImageMenu({
      x,
      y,
      src,
      alt,
      pipeStyles,
      nodeId,
    });
  };

  const handleApplyImageScaling = (newUrl: string, newAlt: string, newPipeStyles: string) => {
    if (!imageMenu || !graphDetail) return;
    const targetNode = graphDetail.nodes?.find((n) => n.id === imageMenu.nodeId);
    if (!targetNode || !targetNode.info) return;

    const updatedMd = updateImageInMarkdown(
      targetNode.info,
      imageMenu.src,
      newUrl,
      newAlt,
      newPipeStyles
    );

    setGraphDetail((prev) => {
      if (!prev || !prev.nodes) return prev;
      return {
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === imageMenu.nodeId ? { ...n, info: updatedMd } : n
        ),
      };
    });

    setImageMenu(null);
  };

  // Helper to make API calls with direct URL and proxy fallback
  const apiFetch = async (endpoint: string) => {
    const headers = {
      'X-API-Token': API_TOKEN,
      'Accept': 'application/json',
    };

    // Try direct fetch first
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`Direct fetch to ${BASE_URL}${endpoint} failed, trying server proxy:`, err);
    }

    // Fallback to local server proxy
    const proxyUrl = `/api/vegvisr/proxy${endpoint}`;
    const proxyRes = await fetch(proxyUrl, { headers });
    if (!proxyRes.ok) {
      const errData = await proxyRes.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${proxyRes.status} requesting ${endpoint}`);
    }
    return await proxyRes.json();
  };

  // Fetch meta-areas sidebar on load
  const fetchMetaAreas = async () => {
    setLoadingMetaAreas(true);
    try {
      const data = await apiFetch('/getmetaareas');
      let list: MetaAreaItem[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.metaAreas)) {
        list = data.metaAreas;
      }
      setMetaAreas(list);
    } catch (err: any) {
      console.error('Failed to fetch meta areas:', err);
    } finally {
      setLoadingMetaAreas(false);
    }
  };

  // Fetch summaries list
  const fetchSummaries = async (newOffset: number, append: boolean = false, metaAreaOverride?: string | null) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const activeMeta = metaAreaOverride !== undefined ? metaAreaOverride : selectedMetaArea;
      let endpoint = `/getknowgraphsummaries?offset=${newOffset}&limit=${limit}`;

      if (activeMeta) {
        endpoint += `&metaArea=${encodeURIComponent(activeMeta)}`;
      }

      const data = await apiFetch(endpoint);

      const items: KnowGraphSummary[] = Array.isArray(data.results) ? data.results : [];
      const total = data.total || items.length;
      const more = Boolean(data.hasMore);

      if (append) {
        setSummaries((prev) => [...prev, ...items]);
      } else {
        setSummaries(items);
      }

      setTotalCount(total);
      setHasMore(more);
      setOffset(newOffset);
    } catch (err: any) {
      console.error('Error fetching graph summaries:', err);
      setError(err.message || 'Failed to load Knowledge Graph summaries');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetaAreas();
    fetchSummaries(0, false, null);
  }, []);

  // Handle meta-area filter selection
  const handleSelectMetaArea = (areaName: string | null) => {
    setSelectedMetaArea(areaName);
    setShowMobileSidebar(false);
    fetchSummaries(0, false, areaName);
  };

  // Handle Load More
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextOffset = offset + limit;
      fetchSummaries(nextOffset, true);
    }
  };

  // Handle Card Click -> Fetch Detail
  const handleCardClick = async (id: string) => {
    setSelectedGraphId(id);
    setLoadingDetail(true);
    setDetailError(null);
    setGraphDetail(null);
    setDetailTab('nodes');

    try {
      const data = await apiFetch(`/getknowgraph?id=${encodeURIComponent(id)}`);
      setGraphDetail(data);
    } catch (err: any) {
      console.error(`Error loading detail for graph ${id}:`, err);
      setDetailError(err.message || 'Failed to load graph details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filter local summaries by search query if set
  const displayedSummaries = summaries.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = (item.title || '').toLowerCase();
    const desc = (item.metadata?.description || '').toLowerCase();
    const meta = (item.metadata?.metaArea || '').toLowerCase();
    const cat = (item.metadata?.category || '').toLowerCase();
    const creator = (item.metadata?.createdBy || '').toLowerCase();
    const text = (item.searchText || '').toLowerCase();

    return (
      title.includes(query) ||
      desc.includes(query) ||
      meta.includes(query) ||
      cat.includes(query) ||
      creator.includes(query) ||
      text.includes(query)
    );
  });

  // Filter meta-areas in sidebar
  const filteredMetaAreas = metaAreas.filter((item) =>
    item.name.toLowerCase().includes(metaAreaSearch.toLowerCase())
  );

  // Helper to parse meta area tags string e.g. "#APPS #THEMES" into clean pills
  const parseMetaTags = (rawMeta?: string): string[] => {
    if (!rawMeta) return [];
    return rawMeta
      .split(/[\s,]+/)
      .map((t) => t.trim().replace(/^#+/, ''))
      .filter((t) => t.length > 0);
  };

  // Import full graph as a canvas node
  const handleImportGraphAsNode = (detail: KnowGraphDetail) => {
    if (!onImportNode) return;

    const title = detail.title || detail.metadata?.title || detail.id || 'Knowledge Graph';
    const description = detail.metadata?.description || 'Imported Knowledge Graph from Vegvisr';

    let markdown = `# ${title}\n\n${description}\n\n`;

    if (detail.nodes && detail.nodes.length > 0) {
      markdown += `### Graph Structure (${detail.nodes.length} Nodes)\n\n`;
      detail.nodes.forEach((n) => {
        markdown += `#### **${n.label || n.id}** \`[${n.type || 'node'}]\` \n\n${n.info || 'No details'}\n\n`;
      });
      markdown += '\n';
    }

    if (detail.edges && detail.edges.length > 0) {
      markdown += `### Relationships (${detail.edges.length} Connections)\n\n`;
      detail.edges.forEach((e) => {
        const fromNode = e.source || e.from || 'Node';
        const toNode = e.target || e.to || 'Node';
        markdown += `- \`${fromNode}\` ➔ \`${toNode}\` (${e.label || e.relationship || 'rel'})\n`;
      });
      markdown += '\n';
    }

    const newNode: NodeItem = {
      id: `vegvisr-graph-${Date.now()}`,
      label: `[Graph] ${title}`,
      category: 'Imported Graphs',
      info: markdown,
    };

    onImportNode(newNode);
    setImportedNodeIds((prev) => ({ ...prev, [detail.id]: true }));
  };

  // Import individual node from detail view
  const handleImportSingleNode = (node: any, graphTitle: string) => {
    if (!onImportNode) return;

    const newNode: NodeItem = {
      id: `vegvisr-node-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      label: node.label || node.id || 'Graph Node',
      category: 'Imported Graphs',
      info: `### ${node.label || node.id}\n*Source Graph: ${graphTitle}*\n\n${node.info || 'No description provided.'}`,
    };

    onImportNode(newNode);
    setImportedNodeIds((prev) => ({ ...prev, [node.id]: true }));
  };

  // Open full graph directly in editor canvas
  const handleOpenGraph = async (graphId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onOpenGraphInEditor) return;

    try {
      const data = await apiFetch(`/getknowgraph?id=${encodeURIComponent(graphId)}`);
      onOpenGraphInEditor({ id: graphId, ...data });
    } catch (err: any) {
      console.error('Error opening graph in editor:', err);
      alert(`Could not load graph ${graphId}: ${err.message || err}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Portfolio Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Knowledge Graph Portfolio
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Vegvisr API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore, inspect, and connect structured graph architectures from <span className="font-mono text-indigo-300">knowledge.vegvisr.org</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToEditor && (
              <button
                onClick={onNavigateToEditor}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span>HyperBuilder Canvas</span>
              </button>
            )}

            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-8">
        {/* Sidebar: Meta Area Filter */}
        <aside
          className={`lg:w-72 shrink-0 ${
            showMobileSidebar
              ? 'fixed inset-0 z-40 bg-slate-950 p-6 overflow-y-auto'
              : 'hidden lg:block'
          }`}
        >
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-200">Meta Areas</h2>
              </div>
              {selectedMetaArea && (
                <button
                  onClick={() => handleSelectMetaArea(null)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Clear Filter
                </button>
              )}
              {showMobileSidebar && (
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="lg:hidden text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Meta Area Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter categories..."
                value={metaAreaSearch}
                onChange={(e) => setMetaAreaSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* All Meta Areas Button */}
            <button
              onClick={() => handleSelectMetaArea(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                selectedMetaArea === null
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5" />
                <span>All Meta-Areas</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 font-mono">
                {totalCount || metaAreas.length}
              </span>
            </button>

            {/* Meta Areas List */}
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {loadingMetaAreas ? (
                <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
                  Loading meta areas...
                </div>
              ) : filteredMetaAreas.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  No meta areas match
                </div>
              ) : (
                filteredMetaAreas.map((area) => {
                  const isSelected = selectedMetaArea === area.name;
                  return (
                    <button
                      key={area.name}
                      onClick={() => handleSelectMetaArea(area.name)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate pr-2">#{area.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {area.count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Content Section: Cards & Grid */}
        <main className="flex-1 space-y-6">
          {/* Top Search & Stats Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search graph titles, descriptions, node contents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
              {selectedMetaArea && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  #{selectedMetaArea}
                  <button
                    onClick={() => handleSelectMetaArea(null)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={() => fetchSummaries(0, false)}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Refresh Graph List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {loading && summaries.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-400">
                Loading Knowledge Graphs from Vegvisr API...
              </p>
            </div>
          ) : error && summaries.length === 0 ? (
            <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm space-y-3">
              <p className="font-bold flex items-center gap-2">
                Failed to fetch Knowledge Graphs
              </p>
              <p className="text-xs text-rose-400">{error}</p>
              <button
                onClick={() => fetchSummaries(0, false)}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500"
              >
                Retry Request
              </button>
            </div>
          ) : displayedSummaries.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-slate-950/30 rounded-2xl border border-slate-800/60 p-8">
              <Network className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-base font-semibold text-slate-300">No Knowledge Graphs Found</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No graphs match your current search query or meta-area filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleSelectMetaArea(null);
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedSummaries.map((graph) => {
                const title = graph.title || graph.metadata?.title || 'Knowledge Graph';
                const description =
                  graph.metadata?.description ||
                  (graph.searchText ? graph.searchText.substring(0, 160) + '...' : 'No description available.');
                const metaTags = parseMetaTags(graph.metadata?.metaArea);
                const nodeCount = graph.nodeCount ?? 0;
                const edgeCount = graph.edgeCount ?? 0;
                const updatedAt = graph.updatedAt
                  ? new Date(graph.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent';

                return (
                  <div
                    key={graph.id}
                    onClick={() => handleCardClick(graph.id)}
                    className="group relative bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-indigo-950/20 hover:-translate-y-0.5"
                  >
                    <div className="space-y-3">
                      {/* Header row: Title & Node Count Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {title}
                        </h3>
                        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <Layers className="w-3 h-3" />
                          {nodeCount} {nodeCount === 1 ? 'Node' : 'Nodes'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {description}
                      </p>

                      {/* Meta Area Tags */}
                      {metaTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {metaTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                            >
                              <Hash className="w-2.5 h-2.5 text-indigo-400" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer metadata & Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {updatedAt}
                        </span>
                        {edgeCount > 0 && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <GitCommit className="w-3 h-3 text-slate-500" />
                            {edgeCount} edges
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenGraphInEditor && (
                          <button
                            onClick={(e) => handleOpenGraph(graph.id, e)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-sm"
                            title="Open graph directly in layout editor"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open Graph
                          </button>
                        )}
                        <span className="inline-flex items-center gap-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform font-semibold text-xs">
                          Details
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !searchQuery && (
            <div className="py-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-indigo-950/40 transition-all disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading more graphs...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Knowledge Graphs</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {!hasMore && summaries.length > 0 && !searchQuery && (
            <div className="py-6 text-center text-xs text-slate-500">
              Showing all {totalCount} Knowledge Graphs
            </div>
          )}
        </main>
      </div>

      {/* Graph Detail Modal / Drawer */}
      {selectedGraphId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 lg:p-6 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {graphDetail?.title || graphDetail?.metadata?.title || 'Graph Detail'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {selectedGraphId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {graphDetail && onOpenGraphInEditor && (
                  <button
                    onClick={() => {
                      onOpenGraphInEditor({ id: selectedGraphId || graphDetail.id, ...graphDetail });
                      setSelectedGraphId(null);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Open Graph in Editor
                  </button>
                )}

                {graphDetail && onImportNode && (
                  <button
                    onClick={() => handleImportGraphAsNode(graphDetail)}
                    disabled={!!importedNodeIds[graphDetail.id]}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      importedNodeIds[graphDetail.id]
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {importedNodeIds[graphDetail.id] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Imported as Library Items
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Import Nodes to Library
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setSelectedGraphId(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {loadingDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading graph nodes and edges...</p>
              </div>
            ) : detailError ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm font-bold text-rose-400">Failed to load graph</p>
                <p className="text-xs text-slate-400">{detailError}</p>
                <button
                  onClick={() => handleCardClick(selectedGraphId)}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
                >
                  Retry Loading
                </button>
              </div>
            ) : graphDetail ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Graph Description & Metadata Header */}
                <div className="p-6 bg-slate-950/40 border-b border-slate-800 space-y-3">
                  {graphDetail.metadata?.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {graphDetail.metadata.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <strong>{graphDetail.nodes?.length || 0}</strong> Nodes
                    </span>

                    <span className="flex items-center gap-1 font-mono">
                      <GitCommit className="w-3.5 h-3.5 text-purple-400" />
                      <strong>{graphDetail.edges?.length || 0}</strong> Edges
                    </span>

                    {graphDetail.metadata?.createdBy && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {graphDetail.metadata.createdBy}
                      </span>
                    )}

                    {graphDetail.metadata?.metaArea && (
                      <span className="flex items-center gap-1 text-indigo-300 font-mono">
                        <Tag className="w-3.5 h-3.5" />
                        {graphDetail.metadata.metaArea}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs & Search Navigation */}
                <div className="px-6 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailTab('nodes')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        detailTab === 'nodes'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Nodes ({graphDetail.nodes?.length || 0})
                    </button>

                    <button
                      onClick={() => setDetailTab('edges')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        detailTab === 'edges'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Edges ({graphDetail.edges?.length || 0})
                    </button>

                    <button
                      onClick={() => setDetailTab('raw')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        detailTab === 'raw'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      JSON Source
                    </button>
                  </div>

                  {detailTab === 'nodes' && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search nodes..."
                        value={nodeSearch}
                        onChange={(e) => setNodeSearch(e.target.value)}
                        className="pl-8 pr-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Tab Content Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {detailTab === 'nodes' && (
                    <div className="space-y-3">
                      {(graphDetail.nodes || [])
                        .filter((n) => {
                          if (!nodeSearch.trim()) return true;
                          const q = nodeSearch.toLowerCase();
                          return (
                            (n.label || '').toLowerCase().includes(q) ||
                            (n.info || '').toLowerCase().includes(q) ||
                            (n.type || '').toLowerCase().includes(q)
                          );
                        })
                        .map((node, idx) => {
                          const isNodeImported = !!importedNodeIds[node.id];
                          return (
                            <div
                              key={node.id || idx}
                              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-100">
                                    {node.label || node.id}
                                  </h4>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                    {node.type || 'node'}
                                  </span>
                                  {node.color && (
                                    <span
                                      className="w-3 h-3 rounded-full border border-slate-700 inline-block"
                                      style={{ backgroundColor: node.color }}
                                      title={`Color: ${node.color}`}
                                    />
                                  )}
                                </div>

                                {onImportNode && (
                                  <button
                                    onClick={() =>
                                      handleImportSingleNode(
                                        node,
                                        graphDetail.title || 'Knowledge Graph'
                                      )
                                    }
                                    disabled={isNodeImported}
                                    className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded transition-colors ${
                                      isNodeImported
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                    }`}
                                  >
                                    {isNodeImported ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        Imported
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        Import Node
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>

                              {node.info && (
                                <div
                                  className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 prose prose-invert max-w-none overflow-x-auto"
                                  onClick={(e) => handleImageInteraction(e, node.id)}
                                  onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                                  dangerouslySetInnerHTML={{
                                    __html: renderMarkdownToHtml(node.info),
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {imageMenu && (
                    <ImageContextMenu
                      x={imageMenu.x}
                      y={imageMenu.y}
                      src={imageMenu.src}
                      alt={imageMenu.alt}
                      pipeStyles={imageMenu.pipeStyles}
                      onClose={() => setImageMenu(null)}
                      onApply={handleApplyImageScaling}
                    />
                  )}

                  {textMenu && (
                    <TextFontContextMenu
                      x={textMenu.x}
                      y={textMenu.y}
                      selectedText={textMenu.selectedText}
                      onClose={() => setTextMenu(null)}
                      onApplyStyle={handleApplyTextStyle}
                    />
                  )}

                  {detailTab === 'edges' && (
                    <div className="space-y-2">
                      {!graphDetail.edges || graphDetail.edges.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-8">
                          No relationship edges defined in this graph.
                        </p>
                      ) : (
                        graphDetail.edges.map((edge, idx) => (
                          <div
                            key={edge.id || idx}
                            className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300"
                          >
                            <span className="font-mono text-indigo-300">
                              {edge.source || edge.from || 'Node A'}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                              ──[{edge.label || edge.relationship || 'rel'}]──➔
                            </div>
                            <span className="font-mono text-purple-300">
                              {edge.target || edge.to || 'Node B'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'raw' && (
                    <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-indigo-200 overflow-x-auto border border-slate-800">
                      {JSON.stringify(graphDetail, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {confirmModalData && (
        <ConfirmModal
          isOpen={confirmModalData.isOpen}
          title={confirmModalData.title}
          message={confirmModalData.message}
          details={confirmModalData.details}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      )}
    </div>
  );
};
