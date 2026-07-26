import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  details,
  confirmLabel = 'Yes, Save',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-save-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={onCancel}
    >
      <div
        id="confirm-save-modal-card"
        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 pr-6">
            <h3 id="confirm-modal-title" className="text-lg font-bold text-slate-100">
              {title}
            </h3>
            <p id="confirm-modal-message" className="text-sm text-slate-300 leading-relaxed">
              {message}
            </p>
            {details && (
              <div
                id="confirm-modal-details"
                className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 break-all whitespace-pre-line leading-relaxed shadow-inner"
              >
                {details}
              </div>
            )}
          </div>
          <button
            id="btn-close-confirm-modal"
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            id="btn-cancel-save"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            id="btn-confirm-save"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
