import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Check,
  Plus,
  Wand2,
  Copy,
} from 'lucide-react';
import { NodeItem } from '../types';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGeneratedNode: (node: NodeItem) => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onAddGeneratedNode,
}) => {
  const [prompt, setPrompt] = useState('');
  const [blockType, setBlockType] = useState<string>('Hero Header');
  const [styleHint, setStyleHint] = useState<string>('Modern & Punchy');
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');
  const [nodeTitle, setNodeTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setGeneratedMarkdown('');

    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          blockType,
          styleHint,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setGeneratedMarkdown(data.result);
        if (!nodeTitle) {
          setNodeTitle(`${blockType}: ${prompt.slice(0, 20)}...`);
        }
      } else {
        alert(data.error || 'Generation failed');
      }
    } catch (err: any) {
      alert('Error connecting to AI service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsNode = () => {
    if (!generatedMarkdown.trim()) return;
    const newNode: NodeItem = {
      id: `ai-node-${Date.now()}`,
      label: nodeTitle.trim() || `${blockType} AI Block`,
      category: 'Custom',
      info: generatedMarkdown,
    };

    onAddGeneratedNode(newNode);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                Gemini AI Magic Content Generator
              </h2>
              <p className="text-xs text-slate-400">
                Generate markdown web content blocks with AI
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

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Block Type
                </label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="Hero Header">Hero Header Section</option>
                  <option value="Feature Card">Feature Highlight Card</option>
                  <option value="Pricing Table">Pricing Card</option>
                  <option value="Testimonial">Testimonial Quote</option>
                  <option value="Call to Action">Call to Action (CTA)</option>
                  <option value="FAQ Block">FAQ Section</option>
                  <option value="Product Spec">Product Specification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tone & Style
                </label>
                <select
                  value={styleHint}
                  onChange={(e) => setStyleHint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="Modern & Punchy">Modern & Punchy</option>
                  <option value="Professional Corporate">Professional Corporate</option>
                  <option value="Bold & High Impact">Bold & High Impact</option>
                  <option value="Minimalist & Clean">Minimalist & Clean</option>
                  <option value="Friendly & Engaging">Friendly & Engaging</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Describe What You Want to Build
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A sleek hero section for a luxury electric bike brand highlighting fast charging and minimalist design..."
                rows={3}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Markdown with Gemini AI...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Markdown Block
                </>
              )}
            </button>
          </form>

          {/* Generated Result Output */}
          {generatedMarkdown && (
            <div className="mt-4 p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  Generated Markdown Preview
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <textarea
                value={generatedMarkdown}
                onChange={(e) => setGeneratedMarkdown(e.target.value)}
                rows={6}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400 resize-y"
              />

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Node Title (e.g. E-Bike Hero Section)"
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                />
                <button
                  onClick={handleSaveAsNode}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add to Node Library
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
