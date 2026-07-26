import React, { useState } from 'react';
import {
  Code,
  Download,
  Copy,
  Check,
  X,
  FileJson,
  Upload,
  Sparkles,
} from 'lucide-react';
import { SlotData, Theme, NodeItem } from '../types';
import { generateStandaloneHtml } from '../utils/htmlExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: SlotData[];
  nodes: NodeItem[];
  activeTheme: Theme;
  onImportJson: (importedSlots: SlotData[]) => void;
  pageBgImage?: string;
  pageBgOverlay?: number;
  pageBgFit?: 'cover' | 'contain' | 'repeat';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  slots,
  nodes,
  activeTheme,
  onImportJson,
  pageBgImage,
  pageBgOverlay,
  pageBgFit,
}) => {
  const [tab, setTab] = useState<'html' | 'json'>('html');
  const [copied, setCopied] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const generatedHtml = generateStandaloneHtml(
    slots,
    nodes,
    activeTheme,
    {
      pageTitle: 'Grid Layout Page',
      pageBgImage,
      pageBgOverlay,
      pageBgFit,
    }
  );

  const jsonContent = JSON.stringify(
    {
      schema: 'grid-slot-layout-v1',
      themeId: activeTheme.id,
      slots,
    },
    null,
    2
  );

  const handleCopy = () => {
    const textToCopy = tab === 'html' ? generatedHtml : jsonContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob(
      [tab === 'html' ? generatedHtml : jsonContent],
      {
        type: tab === 'html' ? 'text/html' : 'application/json',
      }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      tab === 'html' ? 'grid-page.html' : 'grid-layout-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProcessImport = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importJsonText);
      const slotsData = parsed.slots || (Array.isArray(parsed) ? parsed : null);
      if (!slotsData || !Array.isArray(slotsData)) {
        throw new Error('Invalid JSON structure. Expected slots array.');
      }
      onImportJson(slotsData);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse layout JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Export & Code Generator</h2>
              <p className="text-xs text-slate-400">
                Get standalone zero-dependency HTML code or export/import JSON page layouts
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

        {/* Tab Selection */}
        <div className="px-5 pt-3 border-b border-slate-800 flex gap-4 bg-slate-900/50">
          <button
            onClick={() => setTab('html')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === 'html'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            Standalone HTML Code
          </button>
          <button
            onClick={() => setTab('json')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === 'json'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            Layout JSON (Import / Backup)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden p-5 flex flex-col">
          {tab === 'html' ? (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Self-contained HTML with embedded theme CSS variables</span>
                <span className="text-emerald-400 font-mono">
                  {generatedHtml.length} characters
                </span>
              </div>
              <textarea
                readOnly
                value={generatedHtml}
                className="flex-1 w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs focus:outline-none resize-none"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
                {/* Export JSON */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-indigo-400" />
                    Current Layout JSON Schema
                  </label>
                  <textarea
                    readOnly
                    value={jsonContent}
                    className="flex-1 w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs focus:outline-none resize-none"
                  />
                </div>

                {/* Import JSON */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    Import Layout JSON
                  </label>
                  <textarea
                    placeholder="Paste layout JSON schema here..."
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    className="flex-1 w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  {importError && (
                    <div className="text-rose-400 text-xs font-medium">
                      {importError}
                    </div>
                  )}
                  <button
                    onClick={handleProcessImport}
                    disabled={!importJsonText.trim()}
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Apply Imported Layout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            HTML code includes responsive grid media queries (@media max-width 640px).
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download {tab === 'html' ? '.html File' : '.json File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
