import React from 'react';
import { Palette, X, Check, Sparkles } from 'lucide-react';
import { THEMES } from '../data/themes';
import { Theme } from '../types';

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: Theme;
  onSelectTheme: (theme: Theme) => void;
}

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Theme & Token Catalog</h2>
              <p className="text-xs text-slate-400">
                Choose a visual theme with styled typography & CSS custom properties
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Cards Grid */}
        <div className="p-5 flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEMES.map((theme) => {
            const isActive = theme.id === activeTheme.id;
            
            // Collect all unique color values from theme variables
            const swatches: { key: string; color: string }[] = [];
            const seen = new Set<string>();
            
            Object.entries(theme.vars).forEach(([key, val]) => {
              if (
                key.startsWith('--') &&
                !key.includes('font') &&
                !key.includes('radius') &&
                !key.includes('import') &&
                typeof val === 'string' &&
                (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl'))
              ) {
                if (!seen.has(val)) {
                  seen.add(val);
                  swatches.push({ key, color: val });
                }
              }
            });

            return (
              <div
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme);
                  onClose();
                }}
                className={`group cursor-pointer rounded-xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  isActive
                    ? 'bg-slate-800/90 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-500 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      {theme.name}
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {theme.category}
                    </span>
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {swatches.map(({ key, color }, idx) => (
                    <div
                      key={idx}
                      className="w-5 h-5 rounded-md border border-white/20 shadow-inner"
                      style={{ backgroundColor: color }}
                      title={`${key}: ${color}`}
                    />
                  ))}
                </div>

                {/* Typography info */}
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                  <span>
                    Display: <strong className="text-slate-200">{theme.vars['--font-display']?.split(',')[0]}</strong>
                  </span>
                  <span className="text-amber-400 group-hover:translate-x-1 transition-transform">
                    Apply →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Themes configure `:root` CSS variables in real time.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 font-medium"
          >
            Close Catalog
          </button>
        </div>
      </div>
    </div>
  );
};
