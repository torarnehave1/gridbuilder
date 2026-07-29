import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Edit2,
  X,
  Sparkles,
  Check,
  Type,
  Palette,
  Loader2,
  Save,
  Maximize2,
  Image as ImageIcon,
  GripVertical,
} from 'lucide-react';
import { BgImageModal } from './BgImageModal';
import { extractImageFromDrop } from '../utils/imageDropUtils';
import {
  GridCellData,
  NodeItem,
  FontToken,
  ColorToken,
  SlotData,
  AppMode,
} from '../types';
import { renderMarkdownToHtml } from '../utils/markdown';
import { updateCardColorInMarkdown } from '../utils/fulltextParser';
import { patchVegvisrNode } from '../utils/vegvisrApi';
import { ImageContextMenu } from './ImageContextMenu';
import { updateImageInMarkdown } from '../utils/imageUtils';
import { TextFontContextMenu } from './TextFontContextMenu';
import { applyStyleToSelectedText } from '../utils/fontUtils';
import { ConfirmModal } from './ConfirmModal';

interface CellComponentProps {
  cell: GridCellData;
  node?: NodeItem;
  mode: AppMode;
  isParentSeamless?: boolean;
  onUpdateCell: (updated: Partial<GridCellData>) => void;
  onClearCell: () => void;
  onDropNodeOnCell?: (nodeId: string) => void;
  onUpdateNodeInfo?: (nodeId: string, info: string, expectedVersion?: number) => void;
  isDragOver?: boolean;
  allSlots?: SlotData[];
  allNodes?: NodeItem[];
  activeGraphId?: string;
  activeGraphTitle?: string;
}

export const CellComponent: React.FC<CellComponentProps> = ({
  cell,
  node,
  mode,
  isParentSeamless,
  onUpdateCell,
  onClearCell,
  onUpdateNodeInfo,
  isDragOver,
  allSlots,
  allNodes,
  activeGraphId,
  activeGraphTitle,
}) => {
  const isSeamless = cell.transparentBg || isParentSeamless;
  const [isEditing, setIsEditing] = useState(false);
  const [markdownText, setMarkdownText] = useState(
    cell.customMarkdown || node?.info || ''
  );
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [cardBgColor, setCardBgColor] = useState('#1e5f8d');
  const [cardAnim, setCardAnim] = useState<'lift' | 'scale' | 'glow' | 'pulse'>('lift');
  const [isPatching, setIsPatching] = useState(false);
  const [patchStatus, setPatchStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cardIndex: number;
    cardTitle: string;
    elementType?: string;
  } | null>(null);

  const [imageMenu, setImageMenu] = useState<{
    x: number;
    y: number;
    src: string;
    alt: string;
    pipeStyles?: string;
  } | null>(null);

  const [textMenu, setTextMenu] = useState<{
    x: number;
    y: number;
    selectedText: string;
  } | null>(null);

  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    onConfirm: () => void;
  } | null>(null);

  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  const handleCellContextMenu = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const selStr = selection ? selection.toString().trim() : '';

    if (selStr && selStr.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setTextMenu({
        x: e.clientX,
        y: e.clientY,
        selectedText: selStr,
      });
      return;
    }

    handleCardInteraction(e);
  };

  const handleApplyTextStyle = (
    styleType: 'font' | 'color' | 'bold' | 'italic' | 'code' | 'highlight' | 'h1' | 'h2' | 'h3' | 'script-embellish' | 'clear',
    value?: string
  ) => {
    if (!textMenu) return;
    const currentMd = cell.customMarkdown || node?.info || '';
    const updatedMd = applyStyleToSelectedText(
      currentMd,
      textMenu.selectedText,
      styleType,
      value
    );

    setMarkdownText(updatedMd);
    onUpdateCell({ customMarkdown: updatedMd });
    if (cell.nodeId && onUpdateNodeInfo) {
      onUpdateNodeInfo(cell.nodeId, updatedMd);
    }
    setTextMenu(null);
  };

  const handleApplyCardFont = (fontToken: FontToken) => {
    onUpdateCell({ font: fontToken });
    setTextMenu(null);
  };

  useEffect(() => {
    if (!contextMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.card-color-menu')) return;
      setContextMenu(null);
    };

    const timer = setTimeout(() => {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('click', handleClickOutside);
      window.addEventListener('contextmenu', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [contextMenu]);

  const handleCardInteraction = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // First check if an Image was clicked or right-clicked
    const imgEl = target.closest('img, [data-img-src]') as HTMLImageElement | null;
    if (imgEl) {
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
      });
      return;
    }

    const cardEl = target.closest('[data-element-index], [data-card-index]') as HTMLElement;

    if (cardEl) {
      if (target.tagName.toLowerCase() === 'a') return;

      e.preventDefault();
      e.stopPropagation();

      const idxAttr = cardEl.getAttribute('data-element-index') || cardEl.getAttribute('data-card-index');
      if (idxAttr === null || idxAttr === undefined) return;

      const idx = parseInt(idxAttr, 10);
      const elementType = cardEl.getAttribute('data-element-type') || 'card';
      const titleEl = cardEl.querySelector('strong, h1, h2, h3, h4, p, span');
      const cardTitle = titleEl?.textContent?.trim().slice(0, 30) || `${elementType.toUpperCase()} #${idx + 1}`;

      const rect = cardEl.getBoundingClientRect();
      let x = e.clientX;
      let y = e.clientY;

      if (!x && !y && rect) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      x = Math.min(Math.max(10, x), window.innerWidth - 260);
      y = Math.min(Math.max(10, y), window.innerHeight - 360);

      setContextMenu({
        x,
        y,
        cardIndex: idx,
        cardTitle,
        elementType,
      });
    }
  };

  const handleApplyImageScaling = (newUrl: string, newAlt: string, newPipeStyles: string) => {
    if (!imageMenu) return;
    const currentMd = cell.customMarkdown || node?.info || '';
    const updatedMd = updateImageInMarkdown(
      currentMd,
      imageMenu.src,
      newUrl,
      newAlt,
      newPipeStyles
    );

    setMarkdownText(updatedMd);
    onUpdateCell({ customMarkdown: updatedMd });
    if (cell.nodeId && onUpdateNodeInfo) {
      onUpdateNodeInfo(cell.nodeId, updatedMd);
    }
    setImageMenu(null);
  };

  const handleApplyCardColor = (option: { variant?: string; bg?: string }) => {
    if (!contextMenu) return;
    const currentMd = cell.customMarkdown || node?.info || '';
    const updatedMd = updateCardColorInMarkdown(
      currentMd,
      contextMenu.cardIndex,
      option,
      contextMenu.elementType || 'card'
    );

    setMarkdownText(updatedMd);
    onUpdateCell({ customMarkdown: updatedMd });
    setContextMenu(null);
  };

  const THEME_TOKEN_CARDS = [
    { label: 'Accent', variant: 'accent', token: 'var(--accent)', desc: 'Primary Theme Accent' },
    { label: 'Accent 2', variant: 'accent2', token: 'var(--accent2)', desc: 'Secondary Theme Accent' },
    { label: 'Primary', variant: 'primary', token: 'var(--primary)', desc: 'Primary Brand Tone' },
    { label: 'Brass', variant: 'brass', token: 'var(--brass, #a28f39)', desc: 'Ochre Brass Accent' },
    { label: 'Copper Green', variant: 'copper-green', token: 'var(--copper-green, #7fb3a0)', desc: 'Oxidative Copper Green' },
    { label: 'Titanium Blue', variant: 'titanium-blue', token: 'var(--titanium-blue, #a8d5e2)', desc: 'Light Titanium Blue' },
    { label: 'Linen', variant: 'linen', token: 'var(--linen, #d9d0af)', desc: 'Linen Neutral' },
    { label: 'Deep Olive', variant: 'deep-olive', token: 'var(--deep-olive, #2d2b16)', desc: 'Deep Olive Dark Tint' },
    { label: 'Soft', variant: 'soft', token: 'var(--soft)', desc: 'Subtle Soft Tint' },
    { label: 'Muted', variant: 'muted', token: 'var(--muted)', desc: 'Muted Background' },
    { label: 'Gradient', variant: 'gradient', token: 'linear-gradient', desc: 'Theme Accent Gradient' },
    { label: 'Outline', variant: 'outline', token: 'border-accent', desc: 'Accent Border Outline' },
    { label: 'Glass', variant: 'glass', token: 'backdrop-blur', desc: 'Translucent Glass' },
  ];

  const handleInsertThemeCard = (variant: string, anim: string = cardAnim) => {
    const cardSnippet = `\n\n[CARD | variant=${variant}; animate=${anim}]\n**${variant.toUpperCase()} Card**\nThis card automatically adapts to whichever Theme is active.\n[END CARD]`;
    setMarkdownText(prev => prev + cardSnippet);
  };

  const handleInsertColorCard = (hex: string, anim: string = cardAnim) => {
    const cardSnippet = `\n\n[CARD | bg: ${hex}; animate=${anim}]\n**Custom Card**\nCustom background color card.\n[END CARD]`;
    setMarkdownText(prev => prev + cardSnippet);
  };

  const markdownContent = cell.customMarkdown || node?.info || '';
  const renderedHtml = renderMarkdownToHtml(markdownContent);

  const alignStyle = cell.align ? `text-${cell.align}` : 'text-left';
  const fontStyle = cell.font
    ? { fontFamily: `var(--font-${cell.font})` }
    : undefined;
  const colorStyle = cell.color ? { color: `var(${cell.color})` } : undefined;

  const handleSaveEdit = async () => {
    let targetGraphId = cell.graphId || node?.graphId || activeGraphId;
    let targetSourceNodeId = cell.sourceNodeId || node?.sourceNodeId;

    if (!targetGraphId) {
      if (
        node?.id === 'node-intro-lydmora' ||
        node?.id === 'flexbox-cards-showcase' ||
        markdownText.includes('Lydmora') ||
        markdownText.includes('Knowledge Graph')
      ) {
        targetGraphId = '9e221c67-f00d-451f-a1e3-a5fb95f40107';
        targetSourceNodeId = node?.sourceNodeId || 'node-intro-lydmora';
      } else {
        const graphIdMatch = markdownText.match(/Graph\s+(?:ID|UUID):\s*([a-zA-Z0-9_-]+)/i);
        if (graphIdMatch) targetGraphId = graphIdMatch[1];
        const nodeIdMatch = markdownText.match(/Node\s+(?:ID|UUID):\s*([a-zA-Z0-9_-]+)/i);
        if (nodeIdMatch) targetSourceNodeId = nodeIdMatch[1];
      }
    }

    if (!targetSourceNodeId && cell.nodeId) {
      targetSourceNodeId = cell.nodeId;
    }

    setConfirmModalData({
      isOpen: true,
      title: 'Confirm Save Changes',
      message: targetGraphId && targetSourceNodeId
        ? `Are you sure you want to save changes and update Vegvisr graph node [${targetSourceNodeId.slice(0, 8)}]?`
        : `Are you sure you want to save changes to this card?`,
      details: targetGraphId && targetSourceNodeId
        ? `Graph ID: ${targetGraphId} | Node ID: ${targetSourceNodeId}`
        : `Local Card Content`,
      onConfirm: async () => {
        setConfirmModalData(null);
        onUpdateCell({ customMarkdown: markdownText });
        if (cell.nodeId && onUpdateNodeInfo) {
          onUpdateNodeInfo(cell.nodeId, markdownText);
        }
        setIsEditing(false);

        if (targetGraphId && targetSourceNodeId) {
          setIsPatching(true);
          setPatchStatus(null);
          try {
            const res = await patchVegvisrNode({
              graphId: targetGraphId,
              nodeId: targetSourceNodeId,
              info: markdownText,
              label: node?.label,
              expectedVersion: cell.expectedVersion || node?.expectedVersion,
              allSlots,
              allNodes,
              activeGraphTitle,
            });

            if (res.newVersion !== undefined) {
              onUpdateCell({
                graphId: targetGraphId,
                sourceNodeId: targetSourceNodeId,
                expectedVersion: res.newVersion,
              });
              if (cell.nodeId && onUpdateNodeInfo) {
                onUpdateNodeInfo(cell.nodeId, markdownText, res.newVersion);
              }
            }

            setPatchStatus({
              type: 'success',
              text: `Saved to Vegvisr node (${targetSourceNodeId.slice(0, 16)}) ${
                res.newVersion ? `v${res.newVersion}` : ''
              }`,
            });
            setTimeout(() => setPatchStatus(null), 6000);
          } catch (err: any) {
            console.error('Error executing patchNode:', err);
            setPatchStatus({
              type: 'error',
              text: `Failed writeback to Vegvisr: ${err.message || err}`,
            });
          } finally {
            setIsPatching(false);
          }
        }
      },
    });
  };

  const handleExplicitSaveNodeToVegvisr = async () => {
    const currentInfo = cell.customMarkdown || markdownText || node?.info || '';
    let targetGraphId = cell.graphId || node?.graphId || activeGraphId;
    let targetSourceNodeId = cell.sourceNodeId || node?.sourceNodeId;

    if (!targetGraphId) {
      if (
        node?.id === 'node-intro-lydmora' ||
        node?.id === 'flexbox-cards-showcase' ||
        currentInfo.includes('Lydmora') ||
        currentInfo.includes('Knowledge Graph')
      ) {
        targetGraphId = '9e221c67-f00d-451f-a1e3-a5fb95f40107';
        targetSourceNodeId = node?.sourceNodeId || 'node-intro-lydmora';
      } else {
        const graphIdMatch = currentInfo.match(/Graph\s+(?:ID|UUID):\s*([a-zA-Z0-9_-]+)/i);
        if (graphIdMatch) targetGraphId = graphIdMatch[1];
        const nodeIdMatch = currentInfo.match(/Node\s+(?:ID|UUID):\s*([a-zA-Z0-9_-]+)/i);
        if (nodeIdMatch) targetSourceNodeId = nodeIdMatch[1];
      }
    }

    if (!targetSourceNodeId && cell.nodeId) {
      targetSourceNodeId = cell.nodeId;
    }

    if (!targetGraphId || !targetSourceNodeId) {
      setPatchStatus({
        type: 'error',
        text: 'Cannot save to Vegvisr: Missing target Graph ID or Node ID.',
      });
      return;
    }

    setConfirmModalData({
      isOpen: true,
      title: 'Confirm Node Sync',
      message: `Are you sure you want to save changes for Node [${targetSourceNodeId.slice(0, 8)}] in Vegvisr Graph [${targetGraphId.slice(0, 8)}]?`,
      details: `Graph ID: ${targetGraphId} | Node ID: ${targetSourceNodeId}`,
      onConfirm: async () => {
        setConfirmModalData(null);
        setIsPatching(true);
        setPatchStatus(null);
        try {
          const res = await patchVegvisrNode({
            graphId: targetGraphId,
            nodeId: targetSourceNodeId,
            info: currentInfo,
            label: node?.label,
            expectedVersion: cell.expectedVersion || node?.expectedVersion,
            allSlots,
            allNodes,
            activeGraphTitle,
          });

          if (res.newVersion !== undefined) {
            onUpdateCell({
              graphId: targetGraphId,
              sourceNodeId: targetSourceNodeId,
              expectedVersion: res.newVersion,
            });
            if (cell.nodeId && onUpdateNodeInfo) {
              onUpdateNodeInfo(cell.nodeId, currentInfo, res.newVersion);
            }
          }

          setPatchStatus({
            type: 'success',
            text: `Patched back to Vegvisr node (${targetSourceNodeId.slice(0, 16)}) ${
              res.newVersion ? `v${res.newVersion}` : ''
            }`,
          });
          setTimeout(() => setPatchStatus(null), 6000);
        } catch (err: any) {
          console.error('Error executing patchNode:', err);
          setPatchStatus({
            type: 'error',
            text: `Failed writeback to Vegvisr: ${err.message || err}`,
          });
        } finally {
          setIsPatching(false);
        }
      },
    });
  };

  const handleAiPolish = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          blockType: node?.label || 'grid cell content',
        }),
      });
      const data = await res.json();
      if (data.result) {
        setMarkdownText(data.result);
        onUpdateCell({ customMarkdown: data.result });
        setShowAiInput(false);
        setAiPrompt('');
      } else {
        alert(data.error || 'Failed to generate content');
      }
    } catch (e: any) {
      alert('Error generating AI content: ' + e.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const renderContextMenu = () => {
    if (!contextMenu) return null;

    const THEME_OPTIONS = [
      { label: 'Theme Accent', variant: 'accent', bgToken: 'var(--accent)', desc: 'Primary Accent' },
      { label: 'Theme Accent 2', variant: 'accent2', bgToken: 'var(--accent2)', desc: 'Secondary Accent' },
      { label: 'Theme Primary', variant: 'primary', bgToken: 'var(--primary)', desc: 'Primary Tone' },
      { label: 'Brass', variant: 'brass', bgToken: 'var(--brass, #a28f39)', desc: 'Brass Accent' },
      { label: 'Copper Green', variant: 'copper-green', bgToken: 'var(--copper-green, #7fb3a0)', desc: 'Copper Green' },
      { label: 'Titanium Blue', variant: 'titanium-blue', bgToken: 'var(--titanium-blue, #a8d5e2)', desc: 'Titanium Blue' },
      { label: 'Linen Neutral', variant: 'linen', bgToken: 'var(--linen, #d9d0af)', desc: 'Linen Neutral' },
      { label: 'Deep Olive', variant: 'deep-olive', bgToken: 'var(--deep-olive, #2d2b16)', desc: 'Deep Olive' },
      { label: 'Soft Tint', variant: 'soft', bgToken: 'var(--soft)', desc: 'Soft Tint' },
      { label: 'Muted Tone', variant: 'muted', bgToken: 'var(--muted)', desc: 'Muted Background' },
      { label: 'Theme Gradient', variant: 'gradient', bgToken: 'linear-gradient(135deg, var(--accent), var(--card-bg))', desc: 'Glowing Gradient' },
      { label: 'Glassmorphic', variant: 'glass', bgToken: 'rgba(255,255,255,0.2)', desc: 'Translucent Glass' },
      { label: 'Outline Pulse', variant: 'outline', bgToken: 'transparent', desc: 'Accent Outline' },
      { label: 'Solid Accent Fill', variant: 'accent-fill', bgToken: 'var(--accent)', desc: 'Filled Accent' },
      { label: 'Solid Accent 2 Fill', variant: 'accent2-fill', bgToken: 'var(--accent2)', desc: 'Filled Accent 2' },
      { label: 'Solid Primary Fill', variant: 'primary-fill', bgToken: 'var(--primary)', desc: 'Filled Primary' },
    ];

    return createPortal(
      <div
        className="card-color-menu fixed z-[9999] w-64 p-3 rounded-xl border text-xs backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 shadow-2xl"
        style={{
          top: contextMenu.y,
          left: contextMenu.x,
          backgroundColor: 'color-mix(in srgb, var(--bg1, #0f172a) 95%, black 5%)',
          borderColor: 'var(--accent, #6366f1)',
          color: 'var(--text, #f8fafc)',
          boxShadow: '0 20px 35px rgba(0,0,0,0.65), 0 0 0 1px var(--card-border, rgba(255,255,255,0.15))',
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--accent)' }}>
            <Palette className="w-3.5 h-3.5" />
            <span>{(contextMenu.elementType || 'card').toUpperCase()} THEME COLOR</span>
          </div>
          <button
            onClick={() => setContextMenu(null)}
            className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[10px] opacity-75 mb-2 truncate font-medium">
          Target: <span className="font-semibold text-amber-400">"{contextMenu.cardTitle}"</span>
        </div>

        {/* Swatches Grid */}
        <div className="grid grid-cols-1 gap-1 max-h-56 overflow-y-auto pr-1">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.variant}
              onClick={() => handleApplyCardColor({ variant: opt.variant })}
              className="w-full px-2.5 py-1.5 rounded flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all text-left group cursor-pointer"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--card-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-2xs shrink-0"
                  style={{
                    background: opt.bgToken,
                  }}
                />
                <span className="font-medium text-[11px] group-hover:text-amber-300 transition-colors">
                  {opt.label}
                </span>
              </div>
              <span className="text-[9px] opacity-50 uppercase tracking-tight font-mono">
                {opt.variant}
              </span>
            </button>
          ))}
        </div>

        {/* Custom Hex Color Picker */}
        <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--card-border)' }}>
          <span className="opacity-70 font-medium">Custom Hex Color:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              defaultValue="#1e5f8d"
              onChange={(e) => handleApplyCardColor({ bg: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              title="Pick custom hex color"
            />
            <span className="text-[10px] opacity-60 font-mono">Select</span>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (mode === 'view') {
    if (!cell.nodeId) return null;
    return (
      <div
        className={`h-full w-full p-6 sm:p-8 flex flex-col justify-center transition-all relative overflow-hidden ${
          isSeamless ? 'seamless-container bg-transparent border-none shadow-none' : ''
        }`}
        style={{
          backgroundImage: cell.bgImage ? `url(${cell.bgImage})` : undefined,
          backgroundSize: cell.bgFit || 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: cell.bgFit === 'repeat' ? 'repeat' : 'no-repeat',
        }}
      >
        {cell.bgImage && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundColor: 'rgba(0,0,0,1)',
              opacity: cell.bgOverlay ?? 0.25,
            }}
          />
        )}
        <div
          className={`themed-content max-w-none relative z-1 ${alignStyle} ${
            isSeamless ? 'seamless-content' : ''
          }`}
          style={{ ...fontStyle, ...colorStyle }}
          onContextMenu={handleCardInteraction}
          onClick={handleCardInteraction}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
        {renderContextMenu()}
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
      </div>
    );
  }

  const handleCellDrop = async (e: React.DragEvent) => {
    const droppedImage = await extractImageFromDrop(e);
    if (droppedImage) {
      e.preventDefault();
      e.stopPropagation();
      onUpdateCell({ bgImage: droppedImage });
    }
  };

  // Editor Mode rendering
  if (!cell.nodeId) {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleCellDrop}
        className={`group flex flex-col items-center justify-center min-h-[110px] p-4 rounded-xl border-2 border-dashed transition-all ${
          isDragOver ? 'scale-[0.99]' : ''
        }`}
        style={{
          borderColor: isDragOver ? 'var(--accent)' : 'var(--card-border)',
          backgroundColor: isDragOver ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.02)',
          color: 'var(--text)',
        }}
      >
        <span className="text-xs font-medium opacity-60">Drop node or image here</span>
      </div>
    );
  }

  const targetGraphId = cell.graphId || node?.graphId;
  const targetSourceNodeId = cell.sourceNodeId || node?.sourceNodeId;
  const isImportedGraphNode = node?.category === 'Imported Graphs' || !!targetGraphId;

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCellDrop}
      className={`group relative transition-all overflow-hidden flex flex-col min-h-[140px] ${
        isSeamless
          ? 'bg-transparent border-none shadow-none seamless-container'
          : 'themed-tile'
      } ${
        isImportedGraphNode ? 'border-emerald-500/60' : ''
      } ${
        isDragOver ? 'ring-2' : ''
      }`}
      style={{
        borderRadius: isSeamless ? '0' : 'var(--radius, 12px)',
        backgroundColor: isSeamless ? 'transparent' : undefined,
        backgroundImage: cell.bgImage ? `url(${cell.bgImage})` : undefined,
        backgroundSize: cell.bgFit || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: cell.bgFit === 'repeat' ? 'repeat' : 'no-repeat',
      }}
    >
      {cell.bgImage && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: 'rgba(0,0,0,1)',
            opacity: cell.bgOverlay ?? 0.25,
          }}
        />
      )}
      {/* Patching or status toast notification bar */}
      {(isPatching || patchStatus) && (
        <div
          className={`px-3 py-1.5 text-[11px] font-semibold flex items-center justify-between gap-2 border-b transition-all ${
            patchStatus?.type === 'error'
              ? 'bg-rose-500 text-white border-rose-600'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {isPatching ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                <span>Syncing changes to Vegvisr graph node via patchNode...</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 shrink-0" />
                <span>{patchStatus?.text}</span>
              </>
            )}
          </div>
          {patchStatus && (
            <button
              onClick={() => setPatchStatus(null)}
              className="opacity-80 hover:opacity-100 p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Top Toolbar (Editor mode only) */}
      <div
        className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity border-b px-2 py-1 flex items-center gap-1.5 text-xs shrink-0 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          color: 'var(--text)',
        }}
      >
        {/* Drag grip — App.tsx picks this up via a global pointerdown listener
            and resolves the source cell from the surrounding data attributes. */}
        <button
          type="button"
          data-cell-drag-handle
          title="Drag this card into another cell"
          aria-label="Move this card"
          className="p-0.5 rounded shrink-0 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {isImportedGraphNode && (
          <div className="flex items-center gap-1">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 shrink-0 uppercase tracking-wider"
              title={`Graph ID: ${targetGraphId || 'Vegvisr'} | Node ID: ${targetSourceNodeId || 'N/A'}`}
            >
              GRAPH {targetSourceNodeId ? `[${targetSourceNodeId.slice(0, 8)}]` : ''}
            </span>
            <button
              onClick={handleExplicitSaveNodeToVegvisr}
              disabled={isPatching}
              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Save changes for this node to Vegvisr Graph"
            >
              {isPatching ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />}
              <span>Sync Node</span>
            </button>
          </div>
        )}
        {/* Alignment */}
        <div className="flex items-center rounded p-0.5 border" style={{ borderColor: 'var(--card-border)', backgroundColor: 'rgba(0,0,0,0.05)' }}>
          <button
            onClick={() => onUpdateCell({ align: 'left' })}
            className={`p-1 rounded ${
              cell.align === 'left' ? 'opacity-100 bg-black/10' : 'opacity-60 hover:opacity-100'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => onUpdateCell({ align: 'center' })}
            className={`p-1 rounded ${
              cell.align === 'center' ? 'opacity-100 bg-black/10' : 'opacity-60 hover:opacity-100'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            onClick={() => onUpdateCell({ align: 'right' })}
            className={`p-1 rounded ${
              cell.align === 'right' ? 'opacity-100 bg-black/10' : 'opacity-60 hover:opacity-100'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>
        </div>

        {/* Seamless / No Card BG Toggle */}
        <button
          onClick={() => onUpdateCell({ transparentBg: !cell.transparentBg })}
          className={`p-1 px-1.5 rounded flex items-center gap-1 text-[10px] font-medium transition-colors border ${
            cell.transparentBg
              ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/40'
              : 'opacity-60 hover:opacity-100 border-transparent hover:bg-black/10'
          }`}
          title={cell.transparentBg ? 'Seamless Card Active (No Card BG)' : 'Make Card Seamless (Remove Background & Border)'}
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden lg:inline">{cell.transparentBg ? 'Seamless Card' : 'No Card BG'}</span>
        </button>

        {/* Card Background Image Button */}
        <button
          onClick={() => setIsBgModalOpen(true)}
          className={`p-1 px-1.5 rounded flex items-center gap-1 text-[10px] font-medium transition-colors border ${
            cell.bgImage
              ? 'bg-indigo-500/20 text-indigo-300 font-bold border-indigo-500/40'
              : 'opacity-60 hover:opacity-100 border-transparent hover:bg-black/10'
          }`}
          title="Card Background Image (Drag & Drop or Pick)"
        >
          <ImageIcon className="w-3 h-3" />
          <span className="hidden lg:inline">{cell.bgImage ? 'Card BG Active' : 'Card BG'}</span>
        </button>


        <div className="flex-1" />

        {/* AI Polish */}
        <button
          onClick={() => setShowAiInput(!showAiInput)}
          className="p-1 rounded hover:opacity-100 opacity-70"
          style={{ color: 'var(--accent)' }}
          title="Polish or Generate with AI"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Save Changes / Sync to Graph Node */}
        <button
          onClick={handleExplicitSaveNodeToVegvisr}
          className="p-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-xs font-medium border border-emerald-500/30"
          title="Save Node Changes (prompts confirmation question)"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Save</span>
        </button>

        {/* Edit Markdown */}
        <button
          onClick={() => {
            setMarkdownText(markdownContent);
            setIsEditing(!isEditing);
          }}
          className={`p-1 rounded ${
            isEditing ? 'opacity-100 bg-black/10' : 'opacity-70 hover:opacity-100'
          }`}
          title="Edit Markdown Content"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {/* Clear Cell */}
        <button
          onClick={onClearCell}
          className="p-1 rounded hover:text-rose-500 opacity-60 hover:opacity-100"
          title="Clear Cell"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* AI Prompt Popover */}
      {showAiInput && (
        <div className="p-2.5 bg-slate-900/95 border-b border-amber-500/30 flex gap-2 items-center text-xs">
          <input
            type="text"
            placeholder="AI Prompt (e.g. Rewrite to sound urgent & punchy)..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiPolish()}
            className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-400 text-xs"
          />
          <button
            onClick={handleAiPolish}
            disabled={isAiGenerating || !aiPrompt.trim()}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            {isAiGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 fill-current" />
            )}
            Write
          </button>
        </div>
      )}

      {/* Cell Body Content or Markdown Editor */}
      <div className="p-4 flex-1 flex flex-col justify-center overflow-auto">
        {isEditing ? (
          <div className="space-y-3">
            {/* Visual Card Color Palette & Style Assistant */}
            <div className="p-2.5 rounded-lg border space-y-2 text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] opacity-75">
                  <Palette className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Card Color & Style Palette</span>
                </div>
                {/* Animation options */}
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="opacity-60">Hover FX:</span>
                  {(['lift', 'scale', 'glow', 'pulse'] as const).map(anim => (
                    <button
                      key={anim}
                      type="button"
                      onClick={() => setCardAnim(anim)}
                      className={`px-1.5 py-0.5 rounded capitalize border ${cardAnim === anim ? 'font-bold border-indigo-500' : 'opacity-60 hover:opacity-100'}`}
                      style={{
                        backgroundColor: cardAnim === anim ? 'rgba(99,102,241,0.2)' : 'transparent',
                        borderColor: cardAnim === anim ? 'var(--accent)' : 'var(--card-border)',
                      }}
                    >
                      {anim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Swatches & Color Picker Row */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] opacity-60">Theme Swatches:</span>
                {THEME_TOKEN_CARDS.map(item => (
                  <button
                    key={item.variant}
                    type="button"
                    onClick={() => handleInsertThemeCard(item.variant)}
                    className="px-2 py-0.5 rounded border text-[10px] font-semibold transition-all hover:scale-105 shadow-2xs flex items-center gap-1"
                    style={{
                      backgroundColor: item.variant === 'gradient' ? 'rgba(0,0,0,0.06)' : `color-mix(in srgb, ${item.token} 20%, var(--card-bg))`,
                      borderColor: `var(--card-border)`,
                      color: 'var(--text)',
                    }}
                    title={`Insert ${item.desc} Card (adapts to active theme)`}
                  >
                    <span className="w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: item.token.includes('linear') ? 'var(--accent)' : item.token }} />
                    <span>{item.label}</span>
                  </button>
                ))}

                {/* Custom Native Color Picker */}
                <div className="flex items-center gap-1 ml-1 pl-1 border-l" style={{ borderColor: 'var(--card-border)' }}>
                  <label className="text-[10px] opacity-60 cursor-pointer">Custom Hex:</label>
                  <input
                    type="color"
                    value={cardBgColor}
                    onChange={(e) => setCardBgColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    title="Choose custom hex background color"
                  />
                  <button
                    type="button"
                    onClick={() => handleInsertColorCard(cardBgColor)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white shadow-2xs hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: cardBgColor }}
                  >
                    + Custom Card
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Layout Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
              <span className="text-[10px] font-semibold opacity-60 uppercase tracking-wider">Quick Theme Grids:</span>
              <button
                type="button"
                onClick={() => setMarkdownText(prev => prev + (prev ? '\n\n' : '') + '[FLEXBOX-CARDS]\n[CARD | variant=accent; animate=lift]\n**Theme Accent**\nDynamically uses active theme accent.\n[END CARD]\n\n[CARD | variant=accent2; animate=glow]\n**Theme Accent 2**\nDynamically uses secondary theme accent.\n[END CARD]\n\n[CARD | variant=soft; animate=scale]\n**Theme Soft**\nSubtle soft background card.\n[END CARD]\n[END FLEXBOX]')}
                className="px-2 py-0.5 rounded border text-[10px] font-medium opacity-80 hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderColor: 'var(--card-border)' }}
                title="Insert Theme-Reactive Flexbox Cards Grid"
              >
                + Reactive Theme Grid
              </button>
              <button
                type="button"
                onClick={() => setMarkdownText(prev => prev + (prev ? '\n\n' : '') + '[CARD | variant=gradient; animate=glow]\n**Theme Gradient Card**\nGlowing gradient background using theme tokens.\n[END CARD]')}
                className="px-2 py-0.5 rounded border text-[10px] font-medium opacity-80 hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderColor: 'var(--card-border)' }}
                title="Insert Theme Gradient Card"
              >
                + Theme Gradient
              </button>
              <button
                type="button"
                onClick={() => setMarkdownText(prev => prev + (prev ? '\n\n' : '') + '[CARD | variant=glass; animate=lift]\n**Theme Glass Card**\nTranslucent glassmorphic card.\n[END CARD]')}
                className="px-2 py-0.5 rounded border text-[10px] font-medium opacity-80 hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderColor: 'var(--card-border)' }}
                title="Insert Theme Glass Card"
              >
                + Theme Glass
              </button>
            </div>

            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              className="w-full h-32 p-2.5 border rounded-lg font-mono text-xs focus:outline-none resize-y"
              style={{
                backgroundColor: 'var(--bg1)',
                borderColor: 'var(--accent)',
                color: 'var(--text)',
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs border rounded opacity-80 hover:opacity-100"
                style={{
                  borderColor: 'var(--card-border)',
                  color: 'var(--text)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-2.5 py-1 text-xs text-white rounded font-medium hover:opacity-90 flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--accent)',
                }}
              >
                <Check className="w-3 h-3" />
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`themed-content max-w-none text-xs sm:text-sm ${alignStyle} ${
              isSeamless ? 'seamless-content' : ''
            }`}
            style={{ ...fontStyle, ...colorStyle }}
            onContextMenu={handleCellContextMenu}
            onClick={handleCardInteraction}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}
        {renderContextMenu()}
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
            onApplyCardFont={handleApplyCardFont}
          />
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
        <BgImageModal
          isOpen={isBgModalOpen}
          title="Card / Node Background Image"
          bgImage={cell.bgImage}
          bgOverlay={cell.bgOverlay}
          bgFit={cell.bgFit}
          onClose={() => setIsBgModalOpen(false)}
          onSave={(config) => onUpdateCell(config)}
        />
      </div>
    </div>
  );
};
