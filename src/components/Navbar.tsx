import React from 'react';
import {
  Layout,
  Eye,
  Edit3,
  Plus,
  Palette,
  Download,
  Sparkles,
  RotateCcw,
  Code,
  FileText,
  Sun,
  Moon,
  Network,
  Save,
  X,
  Loader2,
  UserCheck,
  User,
  Undo,
  Redo,
  Image as ImageIcon,
} from 'lucide-react';
import { AppMode, Theme, ActiveGraphContext, VegvisrUser } from '../types';

interface NavbarProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  activeTheme: Theme;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenThemePicker: () => void;
  onAddSlot: () => void;
  onOpenAiGenerator: () => void;
  onOpenVegvisrModal?: () => void;
  onOpenExportModal: () => void;
  onResetLayout: () => void;
  slotCount: number;
  activeGraph?: ActiveGraphContext | null;
  onClearActiveGraph?: () => void;
  onQuickSaveGraph?: () => void;
  isSavingQuickGraph?: boolean;
  currentUser?: VegvisrUser | null;
  onOpenAuthModal?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onLoadDemoGraph?: () => void;
  onOpenPageBgModal?: () => void;
  hasPageBg?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  setMode,
  activeTheme,
  isDarkMode,
  onToggleDarkMode,
  onOpenThemePicker,
  onAddSlot,
  onOpenAiGenerator,
  onOpenVegvisrModal,
  onOpenExportModal,
  onResetLayout,
  slotCount,
  activeGraph,
  onClearActiveGraph,
  onQuickSaveGraph,
  isSavingQuickGraph,
  currentUser,
  onOpenAuthModal,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onLoadDemoGraph,
  onOpenPageBgModal,
  hasPageBg,
}) => {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b shadow-xs transition-colors duration-300"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        color: 'var(--text)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand & Active Graph Badge */}
        <div className="flex items-center gap-3">
          <img
            src="https://favicons.vegvisr.org/favicons/1785059670935-1-1785059677880-512x512.png"
            alt="GRID BUILDER Logo"
            className="h-10 w-10 object-contain rounded-lg bg-slate-900/10 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/50 p-0.5 shrink-0 shadow-xs"
          />
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className="font-black text-base tracking-tight hidden xs:inline"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              GRID BUILDER
            </span>

            {/* Active Graph Context Indicator */}
            {activeGraph ? (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-xs">
                <Network className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex flex-col min-w-0 justify-center">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span
                      className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 truncate max-w-[180px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[550px]"
                      title={activeGraph.title}
                    >
                      {activeGraph.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-700/90 dark:text-emerald-300/80 font-mono leading-none mt-0.5">
                    <span className="truncate max-w-[150px] sm:max-w-[280px]" title={`UUID: ${activeGraph.id}`}>
                      UUID: {activeGraph.id}
                    </span>
                    {activeGraph.version !== undefined && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono font-bold text-[9px] shrink-0 shadow-2xs">
                        v{activeGraph.version}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-1 shrink-0">
                  {onQuickSaveGraph && (
                    <button
                      onClick={onQuickSaveGraph}
                      disabled={isSavingQuickGraph}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-colors cursor-pointer"
                      title="Save Layout (New or Update Current Graph)"
                    >
                      {isSavingQuickGraph ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  {onClearActiveGraph && (
                    <button
                      onClick={onClearActiveGraph}
                      className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      title="Clear Active Graph Context (Start Fresh)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded border opacity-75 hidden sm:inline"
                style={{
                  borderColor: 'var(--card-border)',
                  color: 'var(--text)',
                }}
              >
                v2.4
              </span>
            )}
          </div>
        </div>

        {/* Center: Mode Switcher */}
        <div
          className="flex items-center p-1 rounded border"
          style={{
            borderColor: 'var(--card-border)',
            backgroundColor: 'rgba(0,0,0,0.06)',
          }}
        >
          <button
            onClick={() => setMode('editor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
              mode === 'editor'
                ? 'shadow-xs border'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={
              mode === 'editor'
                ? {
                    backgroundColor: 'var(--text)',
                    color: 'var(--bg1)',
                    borderColor: 'var(--card-border)',
                  }
                : { color: 'var(--text)' }
            }
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor</span> Mode
          </button>
          <button
            onClick={() => setMode('portfolio')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
              mode === 'portfolio'
                ? 'shadow-xs'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={
              mode === 'portfolio'
                ? {
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                  }
                : { color: 'var(--text)' }
            }
          >
            <Network className="w-3.5 h-3.5" />
            <span>Portfolio</span>
          </button>
          <button
            onClick={() => setMode('view')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
              mode === 'view'
                ? 'shadow-xs'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={
              mode === 'view'
                ? {
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                  }
                : { color: 'var(--text)' }
            }
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span> Site
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Mode Quick Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded border border-slate-200 transition-all shadow-2xs cursor-pointer select-none"
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme Dark/Light"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                <span className="hidden sm:inline text-slate-700">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600/20" />
                <span className="hidden sm:inline text-slate-700">Dark</span>
              </>
            )}
          </button>

          {/* Theme Palette Modal Button */}
          <button
            onClick={onOpenThemePicker}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Change Theme & Design Tokens"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline font-semibold">{activeTheme.name}</span>
          </button>

          {/* Page Background Image Button */}
          {onOpenPageBgModal && (
            <button
              onClick={onOpenPageBgModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                hasPageBg
                  ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 font-bold'
                  : 'text-slate-600 bg-white hover:bg-slate-50 border-slate-200'
              }`}
              title="Page Background Image (Drag & Drop image onto page or click to choose)"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">{hasPageBg ? 'Page BG Active' : 'Page BG'}</span>
            </button>
          )}

          {/* Vegvisr Auth Button */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                currentUser
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title={currentUser ? `Signed in as ${currentUser.email}` : 'Sign In with Vegvisr Magic Link'}
            >
              {currentUser ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline truncate max-w-[100px]">{currentUser.email.split('@')[0]}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Sign In</span>
                </>
              )}
            </button>
          )}

          {mode === 'editor' && (
            <>
              {/* Undo & Redo Controls */}
              {onUndo && (
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                  <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-1.5 rounded transition-all ${
                      canUndo
                        ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs cursor-pointer'
                        : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                    title="Undo last action (Ctrl + Z)"
                    aria-label="Undo"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-1.5 rounded transition-all ${
                      canRedo
                        ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs cursor-pointer'
                        : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                    title="Redo action (Ctrl + Y or Ctrl + Shift + Z)"
                    aria-label="Redo"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Add Slot Button */}
              <button
                onClick={onAddSlot}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Add Slot</span>
              </button>

              {/* AI Magic Write Button */}
              <button
                onClick={onOpenAiGenerator}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                title="Generate Content with Gemini AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-current" />
                <span className="hidden lg:inline">AI Magic Write</span>
              </button>

              {/* Demo Playground Sandbox Graph Button */}
              {onLoadDemoGraph && (
                <button
                  onClick={onLoadDemoGraph}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-700/50 transition-colors cursor-pointer"
                  title="Load Demo Sandbox Playground Graph to test overlays, markdown & writebacks"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 fill-current" />
                  <span className="hidden xl:inline">Demo Sandbox</span>
                </button>
              )}

              {/* Vegvisr Knowledge Graphs Button */}
              {onOpenVegvisrModal && (
                <button
                  onClick={onOpenVegvisrModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                  title="Browse Vegvisr Knowledge Graphs API"
                >
                  <Network className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden xl:inline">Vegvisr Graphs</span>
                </button>
              )}
            </>
          )}

          {/* Code Export Modal Trigger */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm shadow-indigo-100 transition-colors"
            title="Publish & Export Code"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Publish / Code</span>
          </button>

          {mode === 'editor' && (
            <button
              onClick={onResetLayout}
              className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Reset Layout"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
