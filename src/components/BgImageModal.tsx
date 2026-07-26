import React, { useState, useEffect, useRef } from 'react';
import { Image, Upload, Trash2, X, Sliders, Check, Sparkles } from 'lucide-react';
import { extractImageFromDrop } from '../utils/imageDropUtils';

interface BgImageModalProps {
  isOpen: boolean;
  title: string; // e.g. "Page Background", "Section Background", "Grid Background", "Card/Cell Background"
  bgImage?: string;
  bgOverlay?: number;
  bgFit?: 'cover' | 'contain' | 'repeat';
  onClose: () => void;
  onSave: (config: {
    bgImage?: string;
    bgOverlay?: number;
    bgFit?: 'cover' | 'contain' | 'repeat';
  }) => void;
}

const PRESET_IMAGES = [
  {
    name: 'Soft Mesh Gradient',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Dark Geometric Lines',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Warm Abstract Studio',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Cosmic Nebula Accent',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Minimal Noise Texture',
    url: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=1200&q=80',
  },
];

export const BgImageModal: React.FC<BgImageModalProps> = ({
  isOpen,
  title,
  bgImage,
  bgOverlay = 0.25,
  bgFit = 'cover',
  onClose,
  onSave,
}) => {
  const [url, setUrl] = useState(bgImage || '');
  const [overlay, setOverlay] = useState(bgOverlay ?? 0.25);
  const [fit, setFit] = useState<'cover' | 'contain' | 'repeat'>(bgFit || 'cover');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(bgImage || '');
    setOverlay(bgOverlay ?? 0.25);
    setFit(bgFit || 'cover');
  }, [bgImage, bgOverlay, bgFit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const imgData = await extractImageFromDrop(e);
    if (imgData) {
      setUrl(imgData);
    }
  };

  const handleApply = () => {
    onSave({
      bgImage: url.trim() ? url.trim() : undefined,
      bgOverlay: overlay,
      bgFit: fit,
    });
    onClose();
  };

  const handleRemove = () => {
    setUrl('');
    onSave({
      bgImage: undefined,
      bgOverlay: 0,
      bgFit: 'cover',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-white">{title}</h3>
              <p className="text-xs text-slate-400">Set, drag & drop, or customize background styling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop / Upload Area & Options (Scrollable Body) */}
        <div className="my-4 space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden group ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-500/20 scale-[0.99]'
                : url
                ? 'border-slate-700 bg-slate-950/60'
                : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {url ? (
              <div className="w-full relative h-28 sm:h-32 rounded-lg overflow-hidden border border-slate-700">
                <div
                  className="absolute inset-0 bg-no-repeat"
                  style={{
                    backgroundImage: `url(${url})`,
                    backgroundSize: fit,
                    backgroundPosition: 'center',
                  }}
                />
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: overlay }}
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-slate-950/80 backdrop-blur-md rounded text-[10px] text-slate-200 border border-slate-700">
                  Preview Active
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-medium text-slate-300">
                  Drag & drop an image here from your device or web browser
                </p>
                <p className="text-[11px] text-slate-500">Or click to select an image file</p>
              </>
            )}
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Image URL / Data URI
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or paste image URL"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Texture Presets
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setUrl(preset.url)}
                  className={`h-11 rounded-lg border overflow-hidden relative group/preset transition-all ${
                    url === preset.url ? 'ring-2 ring-indigo-400 border-indigo-400' : 'border-slate-700 hover:border-slate-500'
                  }`}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 group-hover/preset:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Customization Options: Overlay & Fit */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Text Contrast Dark Overlay
              </label>
              <span className="text-xs font-mono text-indigo-300">{Math.round(overlay * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.85"
              step="0.05"
              value={overlay}
              onChange={(e) => setOverlay(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300">Image Fit Mode</label>
              <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                {(['cover', 'contain', 'repeat'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFit(mode)}
                    className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-colors ${
                      fit === mode
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 sm:pt-4 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handleRemove}
            className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove Image
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Background
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
