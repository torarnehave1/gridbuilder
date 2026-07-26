import React, { useState } from 'react';
import {
  Mail,
  X,
  ShieldCheck,
  UserCheck,
  LogOut,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { VegvisrUser } from '../types';
import { sendMagicLink } from '../utils/vegvisrAuth';
import { useStore } from '../store/useStore';

interface VegvisrAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: VegvisrUser | null;
  onUserUpdate?: (user: VegvisrUser | null) => void;
}

export const VegvisrAuthModal: React.FC<VegvisrAuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const { user: currentUser, logout } = useStore();

  if (!isOpen) return null;

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setFeedback({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    const res = await sendMagicLink(email.trim());

    setIsSending(false);

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setEmail('');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleLogout = () => {
    logout();
    setFeedback(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border p-6 shadow-2xl flex flex-col gap-5 text-slate-100"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--card-bg, #0f172a) 95%, black 5%)',
          borderColor: 'var(--card-border, rgba(255,255,255,0.15))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--card-border, rgba(255,255,255,0.1))' }}>
          <div className="flex items-center gap-3">
            <img
              src="https://favicons.vegvisr.org/favicons/1785059670935-1-1785059677880-512x512.png"
              alt="GRID BUILDER Logo"
              className="w-10 h-10 rounded-xl object-contain bg-slate-950 border border-slate-700/50 p-1 shrink-0 shadow-md"
            />
            <div>
              <h2 className="font-bold text-base tracking-tight flex items-center gap-2">
                <span>GRID BUILDER</span>
              </h2>
              <p className="text-xs opacity-60">Magic Link Passwordless Login</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-150 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{feedback.text}</span>
          </div>
        )}

        {/* Logged In View */}
        {currentUser ? (
          <div className="space-y-4">
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: 'var(--card-border, rgba(255,255,255,0.12))',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                  <UserCheck className="w-4 h-4" />
                  <span>Authenticated Session</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentUser.role || 'user'}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs opacity-60">Signed in as:</div>
                <div className="text-sm font-bold font-mono text-amber-300 break-all">
                  {currentUser.email}
                </div>
              </div>

              <div className="pt-2 border-t grid grid-cols-2 gap-2 text-[11px] opacity-75 font-mono" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div>
                  <span className="block opacity-50 text-[9px] uppercase">User ID</span>
                  <span className="truncate block" title={currentUser.user_id}>
                    {currentUser.user_id}
                  </span>
                </div>
                <div>
                  <span className="block opacity-50 text-[9px] uppercase">Verification Token</span>
                  <span className="truncate block" title={currentUser.emailVerificationToken}>
                    {currentUser.emailVerificationToken ? `${currentUser.emailVerificationToken.slice(0, 10)}...` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Session</span>
            </button>
          </div>
        ) : (
          /* Logged Out View - Send Magic Link */
          <div className="space-y-4">
            <form onSubmit={handleSendMagicLink} className="space-y-3">
              <label className="block text-xs font-medium opacity-80">
                Enter your email address to receive a magic sign-in link:
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type="email"
                  required
                  placeholder="your.email@vegvisr.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderColor: 'var(--card-border, rgba(255,255,255,0.2))',
                    color: 'var(--text, #fff)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Magic Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Magic Link</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
