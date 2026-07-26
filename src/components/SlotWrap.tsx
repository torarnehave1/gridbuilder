import React, { useState, useEffect } from 'react';
import {
  Layers,
  Trash2,
  Plus,
  Grid,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { SlotData, NodeItem, GridCellData, GridBlockData, AppMode } from '../types';
import { GridBlock } from './GridBlock';
import { BgImageModal } from './BgImageModal';
import { extractImageFromDrop } from '../utils/imageDropUtils';

interface SlotWrapProps {
  slot: SlotData;
  index: number;
  totalSlots: number;
  nodes: NodeItem[];
  mode: AppMode;
  onRemoveSlot: () => void;
  onToggleSlotTransparentBg?: () => void;
  onUpdateSlot?: (updated: Partial<SlotData>) => void;
  onMoveSlot: (fromIndex: number, toIndex: number) => void;
  onUpdateSlotTitle?: (newTitle: string) => void;
  onRemoveGrid: (gridIndex: number) => void;
  onToggleGridTransparentBg?: (gridIndex: number) => void;
  onUpdateGrid?: (gridIndex: number, updated: Partial<GridBlockData>) => void;
  onUpdateCell: (
    gridIndex: number,
    cellIndex: number,
    updated: Partial<GridCellData>
  ) => void;
  onClearCell: (gridIndex: number, cellIndex: number) => void;
  onUpdateNodeInfo?: (nodeId: string, info: string, expectedVersion?: number) => void;
  isDragOverSlot?: boolean;
  onAddGridToSlot?: (size: number) => void;
  // Section drag and drop props
  isDraggingThisSlot?: boolean;
  isDragTargetSlot?: boolean;
  onSlotDragStart?: (e: React.DragEvent, index: number) => void;
  onSlotDragOver?: (e: React.DragEvent, index: number) => void;
  onSlotDragLeave?: (e: React.DragEvent, index: number) => void;
  onSlotDrop?: (e: React.DragEvent, index: number) => void;
  onSlotDragEnd?: (e: React.DragEvent) => void;
  allSlots?: SlotData[];
  activeGraphId?: string;
  activeGraphTitle?: string;
}

export const SlotWrap: React.FC<SlotWrapProps> = ({
  slot,
  index,
  totalSlots,
  nodes,
  mode,
  onRemoveSlot,
  onToggleSlotTransparentBg,
  onUpdateSlot,
  onMoveSlot,
  onUpdateSlotTitle,
  onRemoveGrid,
  onToggleGridTransparentBg,
  onUpdateGrid,
  onUpdateCell,
  onClearCell,
  onUpdateNodeInfo,
  isDragOverSlot,
  onAddGridToSlot,
  isDraggingThisSlot,
  isDragTargetSlot,
  onSlotDragStart,
  onSlotDragOver,
  onSlotDragLeave,
  onSlotDrop,
  onSlotDragEnd,
  allSlots,
  activeGraphId,
  activeGraphTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(slot.title || `Section ${index + 1}`);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  useEffect(() => {
    setTempTitle(slot.title || `Section ${index + 1}`);
  }, [slot.title, index]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    const trimmed = tempTitle.trim();
    if (trimmed && onUpdateSlotTitle) {
      onUpdateSlotTitle(trimmed);
    }
  };

  const handleSlotImageDrop = async (e: React.DragEvent) => {
    const droppedImage = await extractImageFromDrop(e);
    if (droppedImage && onUpdateSlot) {
      e.preventDefault();
      e.stopPropagation();
      onUpdateSlot({ bgImage: droppedImage });
    } else {
      onSlotDrop?.(e, index);
    }
  };

  if (mode === 'view') {
    if (slot.grids.length === 0) return null;
    return (
      <section
        className="mb-8 p-4 rounded-3xl relative overflow-hidden"
        style={{
          backgroundImage: slot.bgImage ? `url(${slot.bgImage})` : undefined,
          backgroundSize: slot.bgFit || 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: slot.bgFit === 'repeat' ? 'repeat' : 'no-repeat',
        }}
      >
        {slot.bgImage && (
          <div
            className="absolute inset-0 pointer-events-none z-0 rounded-3xl"
            style={{
              backgroundColor: 'rgba(0,0,0,1)',
              opacity: slot.bgOverlay ?? 0.25,
            }}
          />
        )}
        <div className="relative z-1">
          {slot.grids.map((grid, gIdx) => (
            <GridBlock
              key={grid.id || gIdx}
              grid={grid}
              nodes={nodes}
              mode={mode}
              slotTransparentBg={slot.transparentBg}
              onRemoveGrid={() => onRemoveGrid(gIdx)}
              onUpdateGrid={(updated) => onUpdateGrid?.(gIdx, updated)}
              onUpdateCell={(cIdx, updated) => onUpdateCell(gIdx, cIdx, updated)}
              onClearCell={(cIdx) => onClearCell(gIdx, cIdx)}
              onUpdateNodeInfo={onUpdateNodeInfo}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`mb-8 group/slot transition-all relative overflow-hidden rounded-3xl p-2 ${
        isDraggingThisSlot
          ? 'opacity-30 scale-[0.99] border-2 border-dashed border-indigo-500 rounded-2xl p-1'
          : ''
      } ${
        isDragTargetSlot
          ? 'ring-2 ring-indigo-500/90 bg-indigo-500/10 rounded-2xl p-1'
          : ''
      }`}
      style={{
        backgroundImage: slot.bgImage ? `url(${slot.bgImage})` : undefined,
        backgroundSize: slot.bgFit || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: slot.bgFit === 'repeat' ? 'repeat' : 'no-repeat',
      }}
      data-slot-id={slot.id}
      onDragOver={(e) => {
        e.preventDefault();
        onSlotDragOver?.(e, index);
      }}
      onDragLeave={(e) => onSlotDragLeave?.(e, index)}
      onDrop={handleSlotImageDrop}
    >
      {slot.bgImage && (
        <div
          className="absolute inset-0 pointer-events-none z-0 rounded-3xl"
          style={{
            backgroundColor: 'rgba(0,0,0,1)',
            opacity: slot.bgOverlay ?? 0.25,
          }}
        />
      )}

      {/* Drop Target Indicator Bar */}
      {isDragTargetSlot && (
        <div className="absolute -top-3 left-0 right-0 h-1 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 animate-pulse z-20" />
      )}

      {/* Slot Header */}
      <div
        className="relative z-1 flex items-center justify-between mb-2 pb-1.5 border-b rounded-t-2xl px-3 py-2 backdrop-blur-sm shadow-2xs transition-all"
        style={{
          backgroundColor: slot.transparentBg ? 'transparent' : 'var(--card-bg)',
          borderColor: slot.transparentBg ? 'rgba(255,255,255,0.08)' : 'var(--card-border)',
          color: 'var(--text)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Drag Handle for Reordering */}
          <div
            draggable
            onDragStart={(e) => onSlotDragStart?.(e, index)}
            onDragEnd={onSlotDragEnd}
            className="p-1 rounded cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity flex items-center gap-1 group/grip"
            title="Click and drag to reorder section"
            style={{ color: 'var(--text)' }}
          >
            <GripVertical className="w-4 h-4 opacity-60 group-hover/grip:opacity-100" />
          </div>

          <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />

          {/* Section Title & Rename */}
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="px-2 py-0.5 border rounded text-xs font-bold focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg1)',
                    borderColor: 'var(--accent)',
                    color: 'var(--text)',
                  }}
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 rounded text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="group/title flex items-center gap-1.5 hover:opacity-80 px-1.5 py-0.5 rounded transition-opacity text-left"
                title="Click to rename section"
              >
                <span
                  className="font-bold text-xs uppercase tracking-wider"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text)',
                  }}
                >
                  {slot.title || `Section ${index + 1}`}
                </span>
                <Edit2 className="w-3 h-3 opacity-0 group-hover/title:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
              </button>
            )}

            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded border hidden sm:inline opacity-75"
              style={{
                borderColor: 'var(--card-border)',
                backgroundColor: 'rgba(0,0,0,0.05)',
                color: 'var(--text)',
              }}
            >
              {slot.grids.length} {slot.grids.length === 1 ? 'grid block' : 'grid blocks'}
            </span>
          </div>
        </div>

        {/* Section Reorder & Action Controls */}
        <div className="flex items-center gap-1" style={{ color: 'var(--text)' }}>
          {/* Section Background Image Button */}
          <button
            onClick={() => setIsBgModalOpen(true)}
            className={`p-1 px-2 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 border mr-1 ${
              slot.bgImage
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                : 'opacity-70 hover:opacity-100 border-transparent hover:bg-black/10'
            }`}
            title="Section Background Image (Drag & Drop or Pick)"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {slot.bgImage ? 'Section BG Active' : 'Section BG'}
            </span>
          </button>

          {/* Toggle Seamless Section Background */}
          {onToggleSlotTransparentBg && (
            <button
              onClick={onToggleSlotTransparentBg}
              className={`p-1 px-2 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 border mr-1 ${
                slot.transparentBg
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'opacity-70 hover:opacity-100 border-transparent hover:bg-black/10'
              }`}
              title={
                slot.transparentBg
                  ? 'Seamless Section Active (Background & Border Removed)'
                  : 'Remove Section Background & Border (Seamless Page Color)'
              }
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {slot.transparentBg ? 'Seamless Section' : 'No Section BG'}
              </span>
            </button>
          )}

          <span className="text-[10px] font-semibold uppercase tracking-wider hidden md:inline mr-1 opacity-60">
            Reorder
          </span>

          {/* Move Up Button */}
          <button
            onClick={() => onMoveSlot(index, index - 1)}
            disabled={index === 0}
            className="p-1 rounded hover:opacity-100 opacity-60 disabled:opacity-20 transition-opacity"
            title="Move section up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          {/* Move Down Button */}
          <button
            onClick={() => onMoveSlot(index, index + 1)}
            disabled={index === totalSlots - 1}
            className="p-1 rounded hover:opacity-100 opacity-60 disabled:opacity-20 transition-opacity"
            title="Move section down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-3.5 mx-1 opacity-20 bg-current" />

          {/* Remove Section */}
          <button
            onClick={onRemoveSlot}
            className="p-1 rounded hover:text-rose-500 opacity-60 hover:opacity-100 transition-opacity"
            title="Remove section"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slot Drop Zone */}
      <div
        className={`relative z-1 min-h-[120px] rounded-2xl p-4 transition-all border-2 border-dashed ${
          isDragOverSlot ? 'scale-[0.995]' : ''
        }`}
        style={{
          borderColor: isDragOverSlot
            ? 'var(--accent)'
            : slot.transparentBg
            ? 'rgba(255,255,255,0.08)'
            : 'var(--card-border)',
          backgroundColor: isDragOverSlot
            ? 'rgba(0,0,0,0.08)'
            : slot.transparentBg
            ? 'transparent'
            : 'rgba(0,0,0,0.02)',
        }}
      >
        {slot.grids.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Grid className="w-8 h-8 mx-auto opacity-40" style={{ color: 'var(--text)' }} />
            <p className="text-xs italic opacity-75" style={{ color: 'var(--text)' }}>
              Drop a <strong>Grid Size Tile</strong> or <strong>Background Image</strong> here
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1, 2, 3, 4].map((size) => (
                <button
                  key={size}
                  onClick={() => onAddGridToSlot?.(size)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text)',
                  }}
                >
                  + Add {size}×{size}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {slot.grids.map((grid, gIdx) => (
              <GridBlock
                key={grid.id || gIdx}
                grid={grid}
                nodes={nodes}
                mode={mode}
                slotTransparentBg={slot.transparentBg}
                onRemoveGrid={() => onRemoveGrid(gIdx)}
                onToggleGridTransparentBg={() => onToggleGridTransparentBg?.(gIdx)}
                onUpdateGrid={(updated) => onUpdateGrid?.(gIdx, updated)}
                onUpdateCell={(cIdx, updated) =>
                  onUpdateCell(gIdx, cIdx, updated)
                }
                onClearCell={(cIdx) => onClearCell(gIdx, cIdx)}
                onUpdateNodeInfo={onUpdateNodeInfo}
                allSlots={allSlots}
                activeGraphId={activeGraphId}
                activeGraphTitle={activeGraphTitle}
              />
            ))}
          </div>
        )}
      </div>

      <BgImageModal
        isOpen={isBgModalOpen}
        title="Section / Slot Background Image"
        bgImage={slot.bgImage}
        bgOverlay={slot.bgOverlay}
        bgFit={slot.bgFit}
        onClose={() => setIsBgModalOpen(false)}
        onSave={(config) => {
          if (onUpdateSlot) {
            onUpdateSlot(config);
          }
        }}
      />
    </section>
  );
};
