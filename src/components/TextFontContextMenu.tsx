import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Type,
  X,
  Sparkles,
  Palette,
  Check,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Code,
  Highlighter,
  Eraser,
  LayoutGrid,
} from 'lucide-react';
import {
  getThemeFontOptions,
  getThemeColorOptions,
  ThemeFontOption,
  ThemeColorOption,
} from '../utils/fontUtils';

interface TextFontContextMenuProps {
  x: number;
  y: number;
  selectedText: string;
  onClose: () => void;
  onApplyStyle: (
    styleType: 'font' | 'color' | 'bold' | 'italic' | 'code' | 'highlight' | 'h1' | 'h2' | 'h3' | 'script-embellish' | 'overlay' | 'clear',
    value?: string
  ) => void;
  onApplyCardFont?: (fontToken: 'display' | 'sans' | 'script' | 'mono') => void;
}

export const TextFontContextMenu: React.FC<TextFontContextMenuProps> = ({
  x,
  y,
  selectedText,
  onClose,
  onApplyStyle,
  onApplyCardFont,
}) => {
  const [fontOptions, setFontOptions] = useState<ThemeFontOption[]>([]);
  const [colorOptions, setColorOptions] = useState<ThemeColorOption[]>([]);
  const [activeTab, setActiveTab] = useState<'fonts' | 'colors' | 'formatting'>('fonts');

  useEffect(() => {
    setFontOptions(getThemeFontOptions());
    setColorOptions(getThemeColorOptions());
  }, []);

  // Keyboard Escape and Outside Click Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.text-font-menu-portal')) return;
      onClose();
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
  }, [onClose]);

  // Window boundary calculations
  const menuWidth = 360;
  const menuEstimatedHeight = 440;

  const clampedX = Math.min(Math.max(12, x), Math.max(12, window.innerWidth - menuWidth - 12));

  let targetY = y;
  if (y + menuEstimatedHeight > window.innerHeight - 12) {
    targetY = Math.max(12, y - menuEstimatedHeight);
  }
  const clampedY = Math.min(Math.max(12, targetY), Math.max(12, window.innerHeight - menuEstimatedHeight - 12));

  const truncatedSelection =
    selectedText.length > 40 ? `${selectedText.slice(0, 40)}...` : selectedText;

  return createPortal(
    <div
      className="text-font-menu-portal fixed z-[99999] w-[340px] sm:w-[360px] max-h-[calc(100vh-24px)] overflow-y-auto p-3.5 rounded-2xl border text-xs backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col shrink-0"
      style={{
        top: clampedY,
        left: clampedX,
        backgroundColor: 'color-mix(in srgb, var(--bg1, #0f172a) 96%, black 4%)',
        borderColor: 'var(--accent, #6366f1)',
        color: 'var(--text, #f8fafc)',
        boxShadow:
          '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px var(--card-border, rgba(255,255,255,0.2))',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Menu Header */}
      <div
        className="flex items-center justify-between pb-2.5 mb-2.5 border-b"
        style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <span>Theme Font & Styling</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                CSS THEME
              </span>
            </div>
            <div className="text-[10px] opacity-60 truncate max-w-[200px]" title={selectedText}>
              Selection: “{truncatedSelection}”
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b mb-3 text-[11px] font-medium"
        style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('fonts')}
          className={`flex-1 py-1.5 border-b-2 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'fonts'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent opacity-60 hover:opacity-100'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Theme Fonts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-1.5 border-b-2 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'colors'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent opacity-60 hover:opacity-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Theme Colors</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('formatting')}
          className={`flex-1 py-1.5 border-b-2 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'formatting'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent opacity-60 hover:opacity-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Styles</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="max-h-[260px] overflow-y-auto pr-1 space-y-2.5">
        {/* TAB 1: Theme Fonts */}
        {activeTab === 'fonts' && (
          <div className="space-y-2">
            {/* Featured Maya Knight Script Overlay Embellishment */}
            <div className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Maya Knight Script Overlay</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  -6° Angled
                </span>
              </div>
              <p className="text-[10px] opacity-75 leading-tight">
                Superimposes handwritten script text with an angled tilt over headings or text.
              </p>
              <button
                type="button"
                onClick={() => {
                  onApplyStyle('script-embellish');
                  onClose();
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/50 font-bold text-xs flex items-center justify-between cursor-pointer text-amber-100 transition-colors shadow-xs"
              >
                <span className="text-[10px] uppercase font-mono opacity-80">Apply to Selection:</span>
                <span style={{ fontFamily: 'var(--font-script)', display: 'inline-block', transform: 'rotate(-6deg)', fontSize: '15px', color: 'var(--accent, #f59e0b)' }}>
                  {selectedText.slice(0, 18) || 'Script Accent'}
                </span>
              </button>
            </div>

            {/* Featured Image Overlay Block */}
            <div className="p-2.5 rounded-xl border border-purple-500/40 bg-purple-500/10 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-purple-300 text-[11px]">
                  <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
                  <span>Title Superimposed Over Image</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-400/20 text-purple-200 border border-purple-400/30">
                  [OVERLAY]
                </span>
              </div>
              <p className="text-[10px] opacity-75 leading-tight">
                Places selected title and image inside an overlay card with text over image.
              </p>
              <button
                type="button"
                onClick={() => {
                  onApplyStyle('overlay');
                  onClose();
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-purple-500/25 hover:bg-purple-500/40 border border-purple-500/50 font-bold text-xs flex items-center justify-between cursor-pointer text-purple-100 transition-colors shadow-xs"
              >
                <span className="text-[10px] uppercase font-mono opacity-80">Wrap Selected in:</span>
                <span className="font-bold text-purple-200 text-xs">
                  [OVERLAY] ... [END OVERLAY]
                </span>
              </button>
            </div>

            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60 flex items-center justify-between pt-1">
              <span>Apply Font to Selected Text</span>
              <span className="text-[9px] font-mono opacity-80">CSS Variables</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {fontOptions.map((font) => (
                <div
                  key={font.id}
                  className="group relative flex items-center justify-between p-2 rounded-xl border hover:bg-white/10 transition-all border-white/10"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onApplyStyle('font', font.cssVar);
                      onClose();
                    }}
                    className="flex-1 text-left flex flex-col gap-0.5 cursor-pointer pr-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[11px] text-amber-300">{font.label}</span>
                      <span className="text-[9px] font-mono opacity-60 px-1 py-0.2 rounded bg-black/30 border border-white/10">
                        {font.cssVar}
                      </span>
                    </div>
                    {/* Live Font Sample Preview */}
                    <div
                      className="text-sm font-semibold truncate mt-0.5"
                      style={{ fontFamily: font.cssVar, color: 'var(--text)' }}
                    >
                      {font.fontFamilyName} — {selectedText.slice(0, 22) || 'Sample Text'}
                    </div>
                  </button>

                  {/* Option to also set as entire card font */}
                  {onApplyCardFont && (
                    <button
                      type="button"
                      title="Apply as entire card font"
                      onClick={() => {
                        onApplyCardFont(font.id);
                        onClose();
                      }}
                      className="px-2 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-amber-500/20 hover:border-amber-400 text-[9px] font-medium opacity-70 hover:opacity-100 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <LayoutGrid className="w-3 h-3 text-amber-400" />
                      <span>Card Font</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Theme Colors */}
        {activeTab === 'colors' && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">
              Apply Theme Color to Text
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {colorOptions.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => {
                    onApplyStyle('color', col.cssVar);
                    onClose();
                  }}
                  className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between text-left cursor-pointer group"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                      style={{ backgroundColor: col.cssVar }}
                    />
                    <div>
                      <div className="font-semibold text-xs group-hover:text-amber-300">
                        {col.label}
                      </div>
                      <div className="text-[9px] font-mono opacity-60">{col.cssVar}</div>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ color: col.cssVar }}
                  >
                    Text Preview
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Markdown Formatting */}
        {activeTab === 'formatting' && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">
              Structure & Formatting
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onApplyStyle('h1');
                  onClose();
                }}
                className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-left flex items-center gap-2 cursor-pointer"
              >
                <Heading1 className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">H1 Title</div>
                  <div className="text-[9px] opacity-60">Main Header</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyStyle('h2');
                  onClose();
                }}
                className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-left flex items-center gap-2 cursor-pointer"
              >
                <Heading2 className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">H2 Subtitle</div>
                  <div className="text-[9px] opacity-60">Subheading</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyStyle('bold');
                  onClose();
                }}
                className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-left flex items-center gap-2 cursor-pointer"
              >
                <Bold className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Bold</div>
                  <div className="text-[9px] opacity-60">**Emphasis**</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyStyle('italic');
                  onClose();
                }}
                className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-left flex items-center gap-2 cursor-pointer"
              >
                <Italic className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Italic</div>
                  <div className="text-[9px] opacity-60">*Slanted*</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyStyle('highlight');
                  onClose();
                }}
                className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-left flex items-center gap-2 cursor-pointer"
              >
                <Highlighter className="w-4 h-4 text-yellow-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Highlight</div>
                  <div className="text-[9px] opacity-60">Mark Badge</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyStyle('script-embellish');
                  onClose();
                }}
                className="p-2 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-left flex items-center gap-2 cursor-pointer col-span-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-amber-200 flex items-center justify-between">
                    <span>Angled Script Overlay</span>
                    <span className="text-[9px] font-mono opacity-80">-6° Tilt</span>
                  </div>
                  <div className="text-[9px] opacity-75 truncate" style={{ fontFamily: 'var(--font-script)' }}>
                    {selectedText || 'Handwritten Script Embellish'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyStyle('code');
                  onClose();
                }}
                className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-left flex items-center gap-2 cursor-pointer"
              >
                <Code className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Inline Code</div>
                  <div className="text-[9px] opacity-60">`Code`</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Clear Formatting Action */}
      <div
        className="mt-3 pt-2.5 border-t flex items-center justify-between gap-2"
        style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}
      >
        <button
          type="button"
          onClick={() => {
            onApplyStyle('clear');
            onClose();
          }}
          className="px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Clear Text Formatting</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg border text-xs opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.2))' }}
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
};
