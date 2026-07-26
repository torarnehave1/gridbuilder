import React, { useState } from 'react';
import {
  Grid,
  Box,
  Search,
  Plus,
  Info,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Maximize2,
} from 'lucide-react';
import { NodeItem, DragItemPayload } from '../types';

interface SidebarProps {
  nodes: NodeItem[];
  onAddCustomNode: (node: NodeItem) => void;
  onSelectNodeToInsert?: (nodeId: string) => void;
  onAddGridToActiveSlot?: (size: number) => void;
  onStartDrag: (payload: DragItemPayload, e: React.PointerEvent) => void;
}

const GRID_SIZES = [
  { size: 1, label: '1 × 1', desc: 'Single full card' },
  { size: 2, label: '2 × 2', desc: '2 col grid (4 cells)' },
  { size: 3, label: '3 × 3', desc: '3 col grid (9 cells)' },
  { size: 4, label: '4 × 4', desc: '4 col grid (16 cells)' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  onAddCustomNode,
  onSelectNodeToInsert,
  onAddGridToActiveSlot,
  onStartDrag,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showNewNodeForm, setShowNewNodeForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<NodeItem['category']>('Custom');
  const [newInfo, setNewInfo] = useState('');

  const defaultCategories = [
    'All',
    'Hero',
    'Features',
    'CTA',
    'Media',
    'Content',
    'Imported Graphs',
    'Custom',
  ];
  const categories = Array.from(
    new Set([...defaultCategories, ...nodes.map((n) => n.category)])
  );

  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.info.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === 'All' || node.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newNode: NodeItem = {
      id: `custom-node-${Date.now()}`,
      label: newLabel.trim(),
      category: newCategory,
      info: newInfo.trim() || `# ${newLabel}\n\nEnter markdown content here...`,
    };

    onAddCustomNode(newNode);
    setNewLabel('');
    setNewInfo('');
    setShowNewNodeForm(false);
  };

  if (collapsed) {
    return (
      <aside
        className="w-12 border-r flex flex-col items-center py-4 gap-4 z-30 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          color: 'var(--text)',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 hover:opacity-80 rounded transition-opacity cursor-pointer"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <img
          src="https://favicons.vegvisr.org/favicons/1785059670935-1-1785059677880-512x512.png"
          alt="GRID BUILDER Logo"
          className="w-8 h-8 object-contain rounded-md"
        />
        <div className="w-8 h-px opacity-20 bg-current" />
        <span title="Grid Sizes"><Grid className="w-4 h-4" style={{ color: 'var(--accent)' }} /></span>
        <span title="Nodes Library"><Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} /></span>
      </aside>
    );
  }

  return (
    <aside
      className="w-72 border-r flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 z-30 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        color: 'var(--text)',
      }}
    >
      {/* Top Header with Centered 200x200 Logo */}
      <div
        className="p-4 border-b flex flex-col items-center justify-center relative shrink-0"
        style={{ borderColor: 'var(--card-border)', backgroundColor: 'rgba(0,0,0,0.02)' }}
      >
        <button
          onClick={() => setCollapsed(true)}
          className="absolute top-2 right-2 p-1.5 hover:opacity-100 opacity-60 rounded transition-opacity cursor-pointer z-10"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <img
          src="https://favicons.vegvisr.org/favicons/1785059670935-1-1785059677880-512x512.png"
          alt="GRID BUILDER Logo"
          style={{ width: '200px', height: '200px' }}
          className="object-contain rounded-2xl shadow-md border border-slate-300 dark:border-slate-800 bg-slate-900/10 dark:bg-slate-900 p-1 shrink-0"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Section 1: Grid Sizes */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 opacity-75" style={{ color: 'var(--text)' }}>
              <Grid className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              Grid Layout Tiles
            </h3>
            <span className="text-[10px] opacity-60">Drag or Click</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {GRID_SIZES.map((item) => (
              <div
                key={item.size}
                onPointerDown={(e) =>
                  onStartDrag(
                    {
                      kind: 'size',
                      n: item.size,
                      label: `${item.label} Grid`,
                    },
                    e
                  )
                }
                onClick={() => onAddGridToActiveSlot?.(item.size)}
                className="group relative cursor-grab active:cursor-grabbing p-2.5 rounded border text-center transition-all select-none touch-none shadow-2xs hover:opacity-90"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text)',
                }}
              >
                <div className="flex items-center justify-center gap-1 font-bold text-xs" style={{ color: 'var(--text)' }}>
                  <Maximize2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  {item.label}
                </div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Nodes Library */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-indigo-600" />
              Nodes Library ({filteredNodes.length})
            </h3>
            <button
              onClick={() => setShowNewNodeForm(!showNewNodeForm)}
              className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs flex items-center gap-1 px-2 font-semibold"
            >
              <Plus className="w-3 h-3" />
              New Node
            </button>
          </div>

          {/* New Custom Node Form */}
          {showNewNodeForm && (
            <form
              onSubmit={handleCreateNode}
              className="p-3 bg-indigo-50/40 rounded border border-indigo-200 space-y-2 text-xs"
            >
              <h4 className="font-semibold text-indigo-900">Create Custom Node</h4>
              <input
                type="text"
                placeholder="Node Title (e.g., Features Section)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-indigo-500"
                required
              />
              <textarea
                placeholder="Markdown content (# Title...)"
                value={newInfo}
                onChange={(e) => setNewInfo(e.target.value)}
                rows={3}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewNodeForm(false)}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium"
                >
                  Save Node
                </button>
              </div>
            </form>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search content nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isImported = cat === 'Imported Graphs';
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? isImported
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'bg-indigo-600 text-white'
                      : isImported
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-300/80 font-bold'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Node Items List */}
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
            {filteredNodes.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No nodes match search filter.
              </div>
            ) : (
              filteredNodes.map((node) => {
                const isImportedGraph = node.category === 'Imported Graphs';
                return (
                  <div
                    key={node.id}
                    onPointerDown={(e) =>
                      onStartDrag(
                        {
                          kind: 'node',
                          nodeId: node.id,
                          label: node.label,
                        },
                        e
                      )
                    }
                    className={`group flex items-center justify-between p-2 rounded text-xs cursor-grab active:cursor-grabbing select-none touch-none transition-all shadow-2xs ${
                      isImportedGraph
                        ? 'bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-300/80 hover:border-emerald-400'
                        : 'bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <GripVertical
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isImportedGraph
                            ? 'text-emerald-500 group-hover:text-emerald-700'
                            : 'text-slate-300 group-hover:text-indigo-600'
                        }`}
                      />
                      <span
                        className={`truncate font-medium ${
                          isImportedGraph
                            ? 'text-emerald-950 font-semibold'
                            : 'text-slate-700 group-hover:text-indigo-900'
                        }`}
                      >
                        {node.label}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 max-w-[110px] truncate border ${
                        isImportedGraph
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                      title={node.category}
                    >
                      {node.category}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Builder Instructions Tip */}
        <section className="p-3 rounded bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            Quick Instructions
          </div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Drag a <strong>Grid Layout</strong> tile into any slot.</li>
            <li>Drag a <strong>Content Node</strong> into any grid cell.</li>
            <li>Hover over filled cells to format text or generate markdown.</li>
            <li>Use <strong>Preview Site</strong> for responsive output.</li>
          </ol>
        </section>
      </div>
    </aside>
  );
};
