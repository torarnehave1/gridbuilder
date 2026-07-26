import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Maximize2,
  Crop,
  Sliders,
  Sparkles,
  Check,
  RotateCw,
  Image as ImageIcon,
  Layers,
  Settings,
} from 'lucide-react';
import {
  isImgixUrl,
  parseImgixUrl,
  buildImgixUrl,
  parseCssStyles,
  buildCssStyleString,
  ImgixParams,
  StandardImageStyles,
} from '../utils/imageUtils';

interface ImageContextMenuProps {
  x: number;
  y: number;
  src: string;
  alt: string;
  pipeStyles?: string;
  onClose: () => void;
  onApply: (newUrl: string, newAlt: string, newPipeStyles: string) => void;
}

export const ImageContextMenu: React.FC<ImageContextMenuProps> = ({
  x,
  y,
  src,
  alt: initialAlt,
  pipeStyles: initialPipeStyles = '',
  onClose,
  onApply,
}) => {
  const isImgix = isImgixUrl(src);
  const { baseUrl, params: initialImgixParams } = parseImgixUrl(src);

  const [imgixParams, setImgixParams] = useState<ImgixParams>(() => ({
    fit: initialImgixParams.fit || 'clip',
    auto: initialImgixParams.auto || 'format,compress',
    q: initialImgixParams.q || '85',
    ...initialImgixParams,
  }));

  const [cssStyles, setCssStyles] = useState<StandardImageStyles>(() =>
    parseCssStyles(initialPipeStyles)
  );

  const [altText, setAltText] = useState(initialAlt || 'Image');
  const [activeTab, setActiveTab] = useState<'imgix' | 'css' | 'presets'>(
    isImgix ? 'imgix' : 'css'
  );

  // Keyboard and outside click handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.image-context-menu-portal')) return;
      onClose();
    };

    const timer = setTimeout(() => {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('click', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  const currentImgixUrl = buildImgixUrl(baseUrl, imgixParams);
  const currentPipeCss = buildCssStyleString(cssStyles);

  const handleApply = () => {
    onApply(currentImgixUrl, altText, currentPipeCss);
    onClose();
  };

  // Quick Preset Handlers
  const applyShowFullImage = () => {
    if (isImgix) {
      setImgixParams((prev) => ({
        ...prev,
        fit: 'clip',
        w: '800',
        h: undefined,
        crop: undefined,
      }));
    }
    setCssStyles((prev) => ({
      ...prev,
      objectFit: 'contain',
      width: '100%',
      height: 'auto',
    }));
  };

  const applyHeroCover = () => {
    if (isImgix) {
      setImgixParams((prev) => ({
        ...prev,
        fit: 'crop',
        crop: 'center',
        w: '1200',
        h: '450',
      }));
    }
    setCssStyles((prev) => ({
      ...prev,
      objectFit: 'cover',
      width: '100%',
      height: '350px',
    }));
  };

  const applySquareThumbnail = () => {
    if (isImgix) {
      setImgixParams((prev) => ({
        ...prev,
        fit: 'crop',
        crop: 'faces,center',
        w: '400',
        h: '400',
      }));
    }
    setCssStyles((prev) => ({
      ...prev,
      objectFit: 'cover',
      width: '250px',
      height: '250px',
      aspectRatio: '1/1',
      borderRadius: '12px',
    }));
  };

  const applyCompactCard = () => {
    if (isImgix) {
      setImgixParams((prev) => ({
        ...prev,
        fit: 'crop',
        crop: 'center',
        w: '500',
        h: '300',
      }));
    }
    setCssStyles((prev) => ({
      ...prev,
      objectFit: 'cover',
      width: '100%',
      height: '200px',
      borderRadius: '8px',
    }));
  };

  // Ensure window bounds for portal placement with realistic menu dimensions
  const menuWidth = 380;
  const menuEstimatedHeight = 540;

  const clampedX = Math.min(Math.max(12, x), Math.max(12, window.innerWidth - menuWidth - 12));
  
  // If clicking near the bottom of the screen, position above cursor or clamp top
  let targetY = y;
  if (y + menuEstimatedHeight > window.innerHeight - 12) {
    targetY = Math.max(12, y - menuEstimatedHeight);
  }
  const clampedY = Math.min(Math.max(12, targetY), Math.max(12, window.innerHeight - menuEstimatedHeight - 12));

  return createPortal(
    <div
      className="image-context-menu-portal fixed z-[99999] w-[360px] sm:w-[380px] max-h-[calc(100vh-24px)] overflow-y-auto p-3.5 rounded-2xl border text-xs backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col shrink-0"
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
        style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.1))' }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <span>Image Scaling & Crop</span>
              {isImgix ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  IMGIX ENGINE
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-700/60 text-slate-300 border border-slate-600">
                  STANDARD
                </span>
              )}
            </div>
            <div className="text-[10px] opacity-60 truncate max-w-[200px]" title={src}>
              {baseUrl.split('/').pop() || 'image'}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions Bar */}
      <div className="mb-3 space-y-1">
        <div className="text-[10px] uppercase font-bold tracking-wider opacity-60 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Scale Presets</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={applyShowFullImage}
            className="px-2 py-1.5 rounded-lg border text-left flex items-center gap-1.5 hover:bg-white/10 transition-all cursor-pointer group"
            style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-[11px] group-hover:text-emerald-300">
                Show Full Image
              </div>
              <div className="text-[9px] opacity-60">Fit Clip / No Crop</div>
            </div>
          </button>

          <button
            type="button"
            onClick={applyHeroCover}
            className="px-2 py-1.5 rounded-lg border text-left flex items-center gap-1.5 hover:bg-white/10 transition-all cursor-pointer group"
            style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}
          >
            <Crop className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div>
              <div className="font-semibold text-[11px] group-hover:text-sky-300">
                Hero Banner
              </div>
              <div className="text-[9px] opacity-60">1200x450 Crop</div>
            </div>
          </button>

          <button
            type="button"
            onClick={applySquareThumbnail}
            className="px-2 py-1.5 rounded-lg border text-left flex items-center gap-1.5 hover:bg-white/10 transition-all cursor-pointer group"
            style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <div>
              <div className="font-semibold text-[11px] group-hover:text-purple-300">
                Square 1:1
              </div>
              <div className="text-[9px] opacity-60">Smart Face Crop</div>
            </div>
          </button>

          <button
            type="button"
            onClick={applyCompactCard}
            className="px-2 py-1.5 rounded-lg border text-left flex items-center gap-1.5 hover:bg-white/10 transition-all cursor-pointer group"
            style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-[11px] group-hover:text-amber-300">
                Card Thumbnail
              </div>
              <div className="text-[9px] opacity-60">500x300 Balanced</div>
            </div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-3 text-[11px] font-medium" style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}>
        {isImgix && (
          <button
            type="button"
            onClick={() => setActiveTab('imgix')}
            className={`px-3 py-1.5 border-b-2 font-bold transition-all ${
              activeTab === 'imgix'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            Imgix API Controls
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('css')}
          className={`px-3 py-1.5 border-b-2 font-bold transition-all ${
            activeTab === 'css'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent opacity-60 hover:opacity-100'
          }`}
        >
          CSS Layout & Fit
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3">
        {activeTab === 'imgix' && isImgix && (
          <div className="space-y-2.5">
            {/* Fit Mode */}
            <div>
              <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                Imgix Fit Mode (`fit=`)
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'clip', label: 'Clip (Full)', desc: 'No crop / Full View' },
                  { id: 'crop', label: 'Crop Box', desc: 'Crop to dimension' },
                  { id: 'fill', label: 'Fill Pad', desc: 'Pad with color' },
                  { id: 'max', label: 'Max Fit', desc: 'Scale to max' },
                  { id: 'scale', label: 'Scale', desc: 'Stretch scale' },
                  { id: 'min', label: 'Min Fit', desc: 'Min bounds' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setImgixParams((prev) => ({
                        ...prev,
                        fit: item.id as any,
                      }))
                    }
                    className={`px-2 py-1.5 rounded border text-left transition-all ${
                      imgixParams.fit === item.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="text-[10px] font-bold">{item.label}</div>
                    <div className="text-[8px] opacity-60 truncate">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Crop Focus Area (if fit=crop) */}
            {imgixParams.fit === 'crop' && (
              <div>
                <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                  Crop Focal Point (`crop=`)
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'center', label: 'Center' },
                    { id: 'faces', label: 'AI Faces' },
                    { id: 'entropy', label: 'AI Entropy' },
                    { id: 'top', label: 'Top' },
                    { id: 'bottom', label: 'Bottom' },
                    { id: 'left', label: 'Left' },
                    { id: 'right', label: 'Right' },
                  ].map((focal) => (
                    <button
                      key={focal.id}
                      type="button"
                      onClick={() =>
                        setImgixParams((prev) => ({
                          ...prev,
                          crop: focal.id as any,
                        }))
                      }
                      className={`px-2 py-1 rounded text-[10px] border transition-all ${
                        imgixParams.crop === focal.id
                          ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200 font-bold'
                          : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {focal.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dimensions (Width & Height) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                  Width (`w=`)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={imgixParams.w || ''}
                    placeholder="e.g. 800 or Auto"
                    onChange={(e) =>
                      setImgixParams((prev) => ({
                        ...prev,
                        w: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-2 py-1 bg-black/30 border border-white/15 rounded text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setImgixParams((prev) => ({ ...prev, w: undefined }))}
                    className="px-1.5 py-1 bg-white/5 border border-white/10 rounded text-[9px] opacity-70 hover:opacity-100"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                  Height (`h=`)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={imgixParams.h || ''}
                    placeholder="e.g. 400 or Auto"
                    onChange={(e) =>
                      setImgixParams((prev) => ({
                        ...prev,
                        h: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-2 py-1 bg-black/30 border border-white/15 rounded text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setImgixParams((prev) => ({ ...prev, h: undefined }))}
                    className="px-1.5 py-1 bg-white/5 border border-white/10 rounded text-[9px] opacity-70 hover:opacity-100"
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            {/* Quality & DPR */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                  Quality (`q=`)
                </label>
                <select
                  value={imgixParams.q || '85'}
                  onChange={(e) =>
                    setImgixParams((prev) => ({ ...prev, q: e.target.value }))
                  }
                  className="w-full px-2 py-1 bg-black/30 border border-white/15 rounded text-xs font-mono"
                >
                  <option value="60" style={{ backgroundColor: '#0f172a' }}>60 (Fast)</option>
                  <option value="75" style={{ backgroundColor: '#0f172a' }}>75 (Standard)</option>
                  <option value="85" style={{ backgroundColor: '#0f172a' }}>85 (High Quality)</option>
                  <option value="100" style={{ backgroundColor: '#0f172a' }}>100 (Max HD)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                  DPR Retina (`dpr=`)
                </label>
                <div className="flex gap-1">
                  {['1', '2', '3'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setImgixParams((prev) => ({ ...prev, dpr: d }))
                      }
                      className={`flex-1 py-1 rounded text-[10px] border font-mono ${
                        imgixParams.dpr === d
                          ? 'bg-amber-500/20 border-amber-400 font-bold text-amber-300'
                          : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {d}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSS Tab */}
        {activeTab === 'css' && (
          <div className="space-y-2.5">
            {/* Object Fit */}
            <div>
              <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                CSS Object Fit (Scaling)
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'contain', label: 'Contain (Full)', desc: 'Show full image' },
                  { id: 'cover', label: 'Cover (Crop)', desc: 'Fill container' },
                  { id: 'fill', label: 'Fill Stretch', desc: 'Stretch dimensions' },
                  { id: 'scale-down', label: 'Scale Down', desc: 'Smaller of fit' },
                  { id: 'none', label: 'None', desc: 'Original size' },
                ].map((fit) => (
                  <button
                    key={fit.id}
                    type="button"
                    onClick={() =>
                      setCssStyles((prev) => ({
                        ...prev,
                        objectFit: fit.id as any,
                      }))
                    }
                    className={`px-2 py-1.5 rounded border text-left transition-all ${
                      cssStyles.objectFit === fit.id
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="text-[10px] font-bold">{fit.label}</div>
                    <div className="text-[8px] opacity-60 truncate">{fit.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* CSS Dimensions */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                  CSS Width
                </label>
                <input
                  type="text"
                  value={cssStyles.width || ''}
                  placeholder="e.g. 100%, 300px, auto"
                  onChange={(e) =>
                    setCssStyles((prev) => ({ ...prev, width: e.target.value }))
                  }
                  className="w-full px-2 py-1 bg-black/30 border border-white/15 rounded text-xs focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                  CSS Height
                </label>
                <input
                  type="text"
                  value={cssStyles.height || ''}
                  placeholder="e.g. auto, 200px, 350px"
                  onChange={(e) =>
                    setCssStyles((prev) => ({ ...prev, height: e.target.value }))
                  }
                  className="w-full px-2 py-1 bg-black/30 border border-white/15 rounded text-xs focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                Border Radius (Corners)
              </label>
              <div className="flex gap-1">
                {[
                  { id: '0px', label: 'Square' },
                  { id: '8px', label: 'Rounded' },
                  { id: '16px', label: 'Large' },
                  { id: '9999px', label: 'Circle/Pill' },
                ].map((rad) => (
                  <button
                    key={rad.id}
                    type="button"
                    onClick={() =>
                      setCssStyles((prev) => ({ ...prev, borderRadius: rad.id }))
                    }
                    className={`flex-1 py-1 rounded text-[10px] border ${
                      cssStyles.borderRadius === rad.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {rad.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alt Text Input */}
      <div className="mt-2.5 pt-2 border-t space-y-1" style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}>
        <label className="text-[10px] font-bold uppercase opacity-60">Alt / Caption Text:</label>
        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className="w-full px-2 py-1 bg-black/30 border border-white/15 rounded text-xs focus:outline-none focus:border-amber-400"
          placeholder="Image description..."
        />
      </div>

      {/* Footer Action Buttons */}
      <div className="mt-3 pt-2.5 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.15))' }}>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg border text-xs opacity-75 hover:opacity-100 transition-opacity"
          style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.2))' }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleApply}
          className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:brightness-110 shadow-lg flex items-center gap-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Apply Scaling</span>
        </button>
      </div>
    </div>,
    document.body
  );
};
