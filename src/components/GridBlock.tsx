import React, { useState } from 'react';
import { Trash2, Grid as GridIcon, Maximize2, Image as ImageIcon } from 'lucide-react';
import { GridBlockData, NodeItem, GridCellData, SlotData, AppMode } from '../types';
import { CellComponent } from './CellComponent';
import { BgImageModal } from './BgImageModal';
import { extractImageFromDrop } from '../utils/imageDropUtils';

interface GridBlockProps {
  grid: GridBlockData;
  nodes: NodeItem[];
  mode: AppMode;
  slotTransparentBg?: boolean;
  onRemoveGrid: () => void;
  onToggleGridTransparentBg?: () => void;
  onUpdateGrid?: (updated: Partial<GridBlockData>) => void;
  onUpdateCell: (cellIndex: number, updated: Partial<GridCellData>) => void;
  onClearCell: (cellIndex: number) => void;
  onDropNodeOnCell?: (cellIndex: number, nodeId: string) => void;
  onUpdateNodeInfo?: (nodeId: string, info: string, expectedVersion?: number) => void;
  dragOverCellIndex?: number | null;
  allSlots?: SlotData[];
  activeGraphId?: string;
  activeGraphTitle?: string;
}

export const GridBlock: React.FC<GridBlockProps> = ({
  grid,
  nodes,
  mode,
  slotTransparentBg,
  onRemoveGrid,
  onToggleGridTransparentBg,
  onUpdateGrid,
  onUpdateCell,
  onClearCell,
  onUpdateNodeInfo,
  dragOverCellIndex,
  allSlots,
  activeGraphId,
  activeGraphTitle,
}) => {
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const nodeMap = new Map<string, NodeItem>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const filledCells = grid.cells.filter((c) => !!c.nodeId || !!c.customMarkdown?.trim());
  const numCols = grid.cols || grid.size || 1;
  const isSeamless = grid.transparentBg || slotTransparentBg;

  const handleGridDrop = async (e: React.DragEvent) => {
    const droppedImage = await extractImageFromDrop(e);
    if (droppedImage && onUpdateGrid) {
      e.preventDefault();
      e.stopPropagation();
      onUpdateGrid({ bgImage: droppedImage });
    }
  };

  if (mode === 'view') {
    if (filledCells.length === 0) return null;
    return (
      <div
        className="grid gap-4 sm:gap-6 my-4 p-4 rounded-2xl relative overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
          backgroundImage: grid.bgImage ? `url(${grid.bgImage})` : undefined,
          backgroundSize: grid.bgFit || 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: grid.bgFit === 'repeat' ? 'repeat' : 'no-repeat',
        }}
      >
        {grid.bgImage && (
          <div
            className="absolute inset-0 pointer-events-none z-0 rounded-2xl"
            style={{
              backgroundColor: 'rgba(0,0,0,1)',
              opacity: grid.bgOverlay ?? 0.25,
            }}
          />
        )}
        {grid.cells.map((cell, idx) => {
          const hasContent = !!cell.nodeId || !!cell.customMarkdown?.trim();
          if (!hasContent) {
            return <div key={cell.id || idx} className="min-h-0 relative z-1" />;
          }

          const node = cell.nodeId ? nodeMap.get(cell.nodeId) : undefined;
          const isCellSeamless = cell.transparentBg || isSeamless;
          return (
            <div
              key={cell.id || idx}
              className={`transition-all overflow-hidden relative z-1 ${
                isCellSeamless
                  ? 'bg-transparent border-none shadow-none seamless-container'
                  : 'themed-tile backdrop-blur-sm'
              }`}
              style={{
                borderRadius: isCellSeamless ? '0' : 'var(--radius, 16px)',
              }}
            >
              <CellComponent
                cell={cell}
                node={node}
                mode={mode}
                isParentSeamless={isSeamless}
                onUpdateCell={(updated) => onUpdateCell(idx, updated)}
                onClearCell={() => onClearCell(idx)}
                onUpdateNodeInfo={onUpdateNodeInfo}
                allSlots={allSlots}
                allNodes={nodes}
                activeGraphId={activeGraphId}
                activeGraphTitle={activeGraphTitle}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleGridDrop}
      className={`relative group/block border rounded-2xl p-4 my-4 transition-all backdrop-blur-sm overflow-hidden ${
        isSeamless ? 'seamless-container' : ''
      }`}
      style={{
        backgroundColor: isSeamless ? 'transparent' : 'var(--card-bg)',
        borderColor: isSeamless ? 'rgba(255,255,255,0.08)' : 'var(--card-border)',
        boxShadow: isSeamless ? 'none' : undefined,
        color: 'var(--text)',
        backgroundImage: grid.bgImage ? `url(${grid.bgImage})` : undefined,
        backgroundSize: grid.bgFit || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: grid.bgFit === 'repeat' ? 'repeat' : 'no-repeat',
      }}
    >
      {grid.bgImage && (
        <div
          className="absolute inset-0 pointer-events-none z-0 rounded-2xl"
          style={{
            backgroundColor: 'rgba(0,0,0,1)',
            opacity: grid.bgOverlay ?? 0.25,
          }}
        />
      )}

      {/* Editor Header Tag */}
      <div className="relative z-1 flex items-center justify-between mb-3 text-xs opacity-80">
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text)' }}>
          <GridIcon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-display)' }}>{grid.size} × {grid.size} Grid Block</span>
          <span className="text-[10px] opacity-60 font-normal">
            ({grid.cells.length} cells)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsBgModalOpen(true)}
            className={`p-1 px-2 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 border ${
              grid.bgImage
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                : 'opacity-70 hover:opacity-100 border-transparent hover:bg-black/10'
            }`}
            title="Grid Background Image (Drag & Drop or Pick)"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {grid.bgImage ? 'Grid BG Active' : 'Grid BG'}
            </span>
          </button>

          {onToggleGridTransparentBg && (
            <button
              onClick={onToggleGridTransparentBg}
              className={`p-1 px-2 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 border ${
                grid.transparentBg
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'opacity-70 hover:opacity-100 border-transparent hover:bg-black/10'
              }`}
              title={
                grid.transparentBg
                  ? 'Seamless Grid Active (No Background)'
                  : 'Remove Grid Background & Border (Seamless Page Color)'
              }
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {grid.transparentBg ? 'Seamless Grid' : 'No Grid BG'}
              </span>
            </button>
          )}

          <button
            onClick={onRemoveGrid}
            className="p-1 px-2 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors flex items-center gap-1 text-[11px] font-medium"
            title="Remove Grid Block"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete Grid</span>
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div
        className="grid gap-3 relative z-1"
        style={{
          gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
        }}
      >
        {grid.cells.map((cell, idx) => {
          const node = cell.nodeId ? nodeMap.get(cell.nodeId) : undefined;
          return (
            <div key={cell.id || idx} data-cell-index={idx}>
              <CellComponent
                cell={cell}
                node={node}
                mode={mode}
                isParentSeamless={isSeamless}
                onUpdateCell={(updated) => onUpdateCell(idx, updated)}
                onClearCell={() => onClearCell(idx)}
                onUpdateNodeInfo={onUpdateNodeInfo}
                isDragOver={dragOverCellIndex === idx}
                allSlots={allSlots}
                allNodes={nodes}
                activeGraphId={activeGraphId}
                activeGraphTitle={activeGraphTitle}
              />
            </div>
          );
        })}
      </div>

      <BgImageModal
        isOpen={isBgModalOpen}
        title="Grid Block Background Image"
        bgImage={grid.bgImage}
        bgOverlay={grid.bgOverlay}
        bgFit={grid.bgFit}
        onClose={() => setIsBgModalOpen(false)}
        onSave={(config) => {
          if (onUpdateGrid) {
            onUpdateGrid(config);
          }
        }}
      />
    </div>
  );
};
