import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Mail, Sparkles, ArrowRight, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { sendMagicLink } from '../utils/vegvisrAuth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { devBypass, authError } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    setErrorMsg(null);

    const res = await sendMagicLink(email.trim());

    setIsSending(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 bg-slate-950 border border-slate-800 rounded-2xl mb-1 shadow-lg">
            <img
              src="https://favicons.vegvisr.org/favicons/1785059670935-1-1785059677880-512x512.png"
              alt="GRID BUILDER Logo"
              className="w-16 h-16 object-contain rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 uppercase">
            GRID BUILDER
          </h1>
          <p className="text-slate-400 text-xs pt-1">
            Enter your email to receive a magic link for secure login.
          </p>
        </div>

        {(authError || errorMsg) && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg || authError}</span>
          </div>
        )}

        {submitted ? (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center space-y-2">
            <Mail className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
            <h3 className="text-slate-200 font-medium">Check your email</h3>
            <p className="text-xs text-slate-400">
              We've sent a magic link to <span className="text-slate-200">{email}</span>. Please check your inbox and click the link to verify.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 text-xs text-indigo-400 hover:underline cursor-pointer"
            >
              Send to a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending magic link...</span>
                </>
              ) : (
                <>
                  <span>Send magic link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500 font-medium">
              Development Only
            </span>
          </div>
        </div>

        <button
          onClick={devBypass}
          type="button"
          className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 font-medium py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Bypass Login (Dev)</span>
        </button>

        <p className="text-center text-[10px] text-slate-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
