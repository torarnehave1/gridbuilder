import React, { useState, useEffect } from 'react';
import {
  X,
  Network,
  RefreshCw,
  Check,
  Search,
  Plus,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Save,
  Download,
  ChevronRight,
  ChevronDown,
  Layers,
  Loader2,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { NodeItem, SlotData, Theme, ActiveGraphContext } from '../types';
import { saveGraphWithHistory } from '../utils/vegvisrApi';
import { vegvisrFetch } from '../utils/vegvisrClient';
import { ensureUUID, isValidUUID } from '../utils/uuidUtils';
import { ConfirmModal } from './ConfirmModal';

interface VegvisrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAsNode: (node: NodeItem) => void;
  onOpenGraphInEditor?: (graphDetail: any) => void;
  slots?: SlotData[];
  nodes?: NodeItem[];
  activeTheme?: Theme;
  activeGraph?: ActiveGraphContext | null;
  onGraphSaved?: (graphId: string, title: string, version?: number) => void;
  onLoadDemoGraph?: () => void;
}

export const VegvisrModal: React.FC<VegvisrModalProps> = ({
  isOpen,
  onClose,
  onImportAsNode,
  onOpenGraphInEditor,
  slots = [],
  nodes = [],
  activeTheme,
  activeGraph,
  onGraphSaved,
  onLoadDemoGraph,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'save'>('import');
  const [graphs, setGraphs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});

  // Node inspection state
  const [expandedGraphId, setExpandedGraphId] = useState<string | null>(null);
  const [expandedGraphData, setExpandedGraphData] = useState<any | null>(null);
  const [loadingNodes, setLoadingNodes] = useState(false);

  // Save Graph state
  const [saveTitle, setSaveTitle] = useState('HyperBuilder Page Layout');
  const [saveDescription, setSaveDescription] = useState('HTML Editor layout exported from HyperBuilder studio');
  const [targetGraphId, setTargetGraphId] = useState<string>(''); // empty = new graph
  const [isSavingGraph, setIsSavingGraph] = useState(false);
  const [saveResult, setSaveResult] = useState<{ id: string; version?: number; message?: string } | null>(null);
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchGraphs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vegvisrFetch('/getknowgraphs');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch knowledge graphs (${res.status})`);
      }

      if (Array.isArray(data)) {
        setGraphs(data);
      } else if (data && Array.isArray(data.results)) {
        setGraphs(data.results);
      } else if (data && Array.isArray(data.graphs)) {
        setGraphs(data.graphs);
      } else if (data && typeof data === 'object') {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setGraphs(list);
      } else {
        setGraphs([]);
      }
    } catch (err: any) {
      console.error('Error fetching Vegvisr graphs:', err);
      setError(err.message || 'Failed to load Knowledge Graphs from Vegvisr API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGraphs();
      if (activeGraph) {
        const validId =
          activeGraph.id && activeGraph.id.toLowerCase() !== 'graph' ? activeGraph.id : '';
        setTargetGraphId(validId);
        if (activeGraph.title) setSaveTitle(activeGraph.title);
        if (activeGraph.description) setSaveDescription(activeGraph.description);
      }
    }
  }, [isOpen, activeGraph]);

  if (!isOpen) return null;

  // Inspect nodes for a specific graph
  const handleToggleExpandGraph = async (graphId: string) => {
    if (expandedGraphId === graphId) {
      setExpandedGraphId(null);
      setExpandedGraphData(null);
      return;
    }

    setExpandedGraphId(graphId);
    setLoadingNodes(true);
    try {
      const res = await vegvisrFetch(`/getknowgraph?id=${encodeURIComponent(graphId)}`);
      const data = await res.json();
      setExpandedGraphData(data);
    } catch (e) {
      console.error('Error loading graph nodes:', e);
    } finally {
      setLoadingNodes(false);
    }
  };

  // Import an individual node from a graph
  const handleImportSingleNode = (graph: any, node: any) => {
    const rawGraphId =
      graph.id ||
      graph.graphId ||
      graph.graph_id ||
      graph._id ||
      graph.metadata?.graphId ||
      graph.metadata?.id;
    const graphId = ensureUUID(rawGraphId);
    const sourceNodeId = node.id || node.nodeId || `node-${Date.now()}`;
    const label = node.label || node.name || sourceNodeId;
    const categoryName = `[Graph] ${graph.title || graph.id || 'Vegvisr'}`;

    const newNode: NodeItem = {
      id: sourceNodeId,
      label,
      category: categoryName as any,
      info: node.info || node.description || `Node ${sourceNodeId} from ${graph.title}`,
      graphId,
      sourceNodeId,
      expectedVersion:
        graph.metadata?.version ??
        graph.version ??
        expandedGraphData?.metadata?.version ??
        0,
    };

    onImportAsNode(newNode);
    setImportedIds((prev) => ({ ...prev, [sourceNodeId]: true }));
  };

  // Import all nodes of a graph
  const handleImportAllGraphNodes = (graph: any, graphData: any) => {
    const rawNodes = graphData?.nodes || graph?.nodes || [];
    if (!Array.isArray(rawNodes) || rawNodes.length === 0) return;

    rawNodes.forEach((node: any) => {
      handleImportSingleNode(graph, node);
    });
  };

  // Save current HTML editor layout to Vegvisr graph
  const executeSaveGraph = async () => {
    setIsSavingGraph(true);
    setSaveResult(null);
    setError(null);

    try {
      const res = await saveGraphWithHistory({
        id: targetGraphId.trim() || undefined,
        title: saveTitle.trim(),
        description: saveDescription.trim(),
        slots,
        nodes,
        activeTheme,
        override: true,
      });

      setSaveResult({
        id: res.id,
        version: res.newVersion,
        message: res.message || 'Graph with history successfully saved to Vegvisr!',
      });

      if (onGraphSaved) {
        onGraphSaved(res.id, saveTitle.trim(), res.newVersion);
      }

      // Refresh graph list
      fetchGraphs();
    } catch (err: any) {
      console.error('Error saving graph:', err);
      setError(`Failed to save graph: ${err.message || err}`);
    } finally {
      setIsSavingGraph(false);
    }
  };

  const handleSaveGraph = () => {
    if (!saveTitle.trim()) return;

    const rawTarget = targetGraphId.trim();
    const isUpdating = Boolean(rawTarget && isValidUUID(rawTarget));
    const targetId = isUpdating ? rawTarget : ensureUUID(rawTarget);

    setConfirmData({
      isOpen: true,
      title: isUpdating ? 'Overwrite Existing Graph' : 'Create New Graph',
      message: isUpdating
        ? `Are you sure you want to OVERWRITE the graph '${saveTitle.trim()}'?`
        : `Are you sure you want to create a NEW graph titled '${saveTitle.trim()}'?`,
      details: `Graph Title: "${saveTitle.trim()}"\nGraph ID: ${targetId}\nAction: ${
        isUpdating ? 'Overwrite Existing Graph' : 'Create New Graph (UUID Assigned)'
      }`,
      onConfirm: () => {
        setConfirmData(null);
        executeSaveGraph();
      },
    });
  };

  const filteredGraphs = graphs.filter((g) => {
    const term = searchTerm.toLowerCase();
    const title = (g.title || g.name || g.id || '').toLowerCase();
    const desc = (g.description || g.summary || '').toLowerCase();
    return title.includes(term) || desc.includes(term);
  });

  const totalGridCount = slots.reduce((acc, s) => acc + (s.grids?.length || 0), 0);
  const totalCellCount = slots.reduce(
    (acc, s) => acc + s.grids.reduce((gAcc, g) => gAcc + (g.cells?.length || 0), 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Vegvisr Knowledge Graphs Integration
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  API Active (patchNode & saveGraphWithHistory)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sync nodes bi-directionally or save HTML Editor grid state as graph history
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-t border-x ${
              activeTab === 'import'
                ? 'bg-white text-indigo-700 border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Import Knowledge Graph Nodes ({graphs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-t border-x ${
              activeTab === 'save'
                ? 'bg-white text-indigo-700 border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Save className="w-4 h-4 text-emerald-600" />
            <span>Save HTML Editor to Graph (saveGraphWithHistory)</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchGraphs}
                className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 rounded font-semibold text-[11px]"
              >
                Retry
              </button>
            </div>
          )}

          {activeTab === 'import' ? (
            /* TAB 1: BROWSE & IMPORT GRAPHS / NODES */
            <div className="space-y-4">
              {/* Search & Actions Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search knowledge graphs by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>

                <button
                  onClick={fetchGraphs}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Graph Cards */}
              <div className="space-y-3">
                {/* Pinned Demo Sandbox Graph Card */}
                {onLoadDemoGraph && (!searchTerm || 'demo sandbox playground'.includes(searchTerm.toLowerCase())) && (
                  <div className="rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-emerald-500/10 border-2 border-purple-500/40 p-4 shadow-sm flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 fill-current shrink-0" />
                        <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">
                          Demo Sandbox Playground Graph
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-600 text-white font-bold">
                          PINNED DEMO
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Isolated playground graph with test cards, image overlays, font formatting, and patch write-back confirmation prompts.
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                        <span>Graph ID: <strong className="font-mono">demo-sandbox-graph-01</strong></span>
                        <span>• 2 Demo Cards</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onLoadDemoGraph();
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
                      title="Load Demo Playground Graph"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      Open Demo Graph
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="py-12 text-center space-y-2">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">Loading Vegvisr Knowledge Graphs...</p>
                  </div>
                ) : filteredGraphs.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Network className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No Knowledge Graphs Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {searchTerm
                        ? 'No graphs matched your search filter.'
                        : 'Vegvisr API returned 0 graphs.'}
                    </p>
                  </div>
                ) : (
                  filteredGraphs.map((graph, idx) => {
                    const graphId = ensureUUID(graph.id || graph.graphId || graph._id);
                    const title = graph.title || graph.name || 'Knowledge Graph';
                    const isExpanded = expandedGraphId === graphId;

                    return (
                      <div
                        key={graphId}
                        className="rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all overflow-hidden"
                      >
                        <div className="p-4 flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-800">{title}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {graphId}
                              </span>
                            </div>

                            {graph.description && (
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {graph.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                              {graph.nodes && (
                                <span>
                                  <strong>{Array.isArray(graph.nodes) ? graph.nodes.length : 0}</strong> Nodes
                                </span>
                              )}
                              {graph.edges && (
                                <span>
                                  <strong>{Array.isArray(graph.edges) ? graph.edges.length : 0}</strong> Edges
                                </span>
                              )}
                              <span>
                                Version: <strong>{graph.metadata?.version ?? 0}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {onOpenGraphInEditor && (
                              <button
                                onClick={async () => {
                                  let gData = isExpanded ? expandedGraphData : null;
                                  if (!gData) {
                                    try {
                                      const res = await vegvisrFetch(
                                        `/getknowgraph?id=${encodeURIComponent(
                                          graph.id || graphId
                                        )}`
                                      );
                                      gData = await res.json();
                                    } catch (e) {
                                      console.error('Failed to fetch graph data:', e);
                                    }
                                  }
                                  if (gData) {
                                    onOpenGraphInEditor({ id: graph.id || graphId, ...gData });
                                    onClose();
                                  }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors"
                                title="Open graph directly in layout editor"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open Graph
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleExpandGraph(graphId)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  Hide Nodes
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                  Inspect Nodes
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Node Drawer */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                Graph Nodes in {title}
                              </h5>
                              <button
                                onClick={() => handleImportAllGraphNodes(graph, expandedGraphData)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-2xs flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Import All Nodes as Library Items
                              </button>
                            </div>

                            {loadingNodes ? (
                              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                Fetching nodes via getknowgraph endpoint...
                              </div>
                            ) : expandedGraphData?.nodes && Array.isArray(expandedGraphData.nodes) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                                {expandedGraphData.nodes.map((node: any) => {
                                  const nodeLabel = node.label || node.name || node.id;
                                  const isImported = !!importedIds[node.id];

                                  return (
                                    <div
                                      key={node.id}
                                      className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-300"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-xs text-slate-800 truncate">
                                            {nodeLabel}
                                          </span>
                                          <span className="text-[9px] font-mono opacity-60 bg-slate-100 px-1 rounded">
                                            {node.id}
                                          </span>
                                        </div>
                                        {node.info && (
                                          <p className="text-[10px] text-slate-500 truncate">
                                            {node.info.slice(0, 60)}
                                          </p>
                                        )}
                                      </div>

                                      <button
                                        onClick={() => handleImportSingleNode(graph, node)}
                                        className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                                          isImported
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                        }`}
                                      >
                                        {isImported ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            Imported
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="w-3 h-3" />
                                            Import Node
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic py-2">
                                No nodes returned for this graph.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: SAVE HTML EDITOR TO GRAPH */
            <div className="space-y-5 max-w-2xl mx-auto py-2">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Save HTML Editor to Vegvisr Graph
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  This exports the current layout to a Vegvisr Knowledge Graph using the <code className="font-bold font-mono">/saveGraphWithHistory</code> endpoint. Each node in your slots stays as its own distinct graph node!
                </p>
              </div>

              {saveResult && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{saveResult.message}</span>
                  </div>
                  <div className="text-xs text-indigo-700 font-mono space-y-1">
                    <div>Graph ID: <strong className="text-indigo-950">{saveResult.id}</strong></div>
                    {saveResult.version !== undefined && (
                      <div>Version: <strong className="text-indigo-950">v{saveResult.version}</strong></div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Graph Title:
                  </label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Enter Knowledge Graph title..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Graph Description:
                  </label>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    rows={2}
                    placeholder="Enter brief description of this layout..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Graph ID (Optional):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={targetGraphId}
                      onChange={(e) => setTargetGraphId(e.target.value)}
                      placeholder="Leave blank to create a NEW Graph, or enter existing Graph ID..."
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs font-mono"
                    />
                    {targetGraphId && (
                      <button
                        onClick={() => setTargetGraphId('')}
                        className="px-2 py-1.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    If specified, updates the existing graph in Vegvisr; otherwise creates a new graph entry with a fresh UUID.
                  </span>
                </div>

                {/* Layout Stats Summary */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-around text-center text-xs">
                  <div>
                    <span className="block text-slate-400 font-medium">Slots Containers</span>
                    <strong className="text-sm font-bold text-slate-800">{slots.length}</strong>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-200" />
                  <div>
                    <span className="block text-slate-400 font-medium">Grid Blocks (Graph Nodes)</span>
                    <strong className="text-sm font-bold text-indigo-600">{totalGridCount}</strong>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-200" />
                  <div>
                    <span className="block text-slate-400 font-medium">Grid Cells</span>
                    <strong className="text-sm font-bold text-slate-800">{totalCellCount}</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveGraph}
                    disabled={isSavingGraph || slots.length === 0}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingGraph ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Graph with History via Vegvisr API...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Current HTML Editor to Vegvisr Graph
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Bi-directional sync enabled for patchNode & saveGraphWithHistory.</span>
          </div>

          <a
            href="https://knowledge.vegvisr.org/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-600 hover:underline font-semibold"
          >
            View Vegvisr API Specs
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {confirmData && (
        <ConfirmModal
          isOpen={confirmData.isOpen}
          title={confirmData.title}
          message={confirmData.message}
          details={confirmData.details}
          onConfirm={confirmData.onConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}
    </div>
  );
};
