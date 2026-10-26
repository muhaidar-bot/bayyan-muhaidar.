/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, Key } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: 'muhaidar' | 'bayyan';
  onSwitchUser: (user: 'muhaidar' | 'bayyan') => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onSwitchUser,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEnv = () => {
    const envSnippet = `VITE_SUPABASE_URL="https://your-project.supabase.co"\nVITE_SUPABASE_ANON_KEY="your-anon-key"`;
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#1a0720] border border-rose-950/70 rounded-3xl p-6 shadow-2xl text-rose-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800/40 flex items-center justify-center text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-rose-100">
                Cloud Sync &amp; Identity
              </h2>
              <p className="text-xs text-rose-300/70">
                Supabase PostgreSQL, Realtime &amp; Authorized Accounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full flex items-center justify-center text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              isSupabaseConfigured
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
            }`}
          >
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-semibold text-rose-100">
                {isSupabaseConfigured
                  ? 'Supabase Backend Connected'
                  : 'Operating in Local-First & Dual-User Mode'}
              </p>
              <p className="text-rose-200/80 leading-relaxed">
                {isSupabaseConfigured
                  ? 'PostgreSQL RLS policies, Realtime presence, and private storage are synchronized with your Supabase cloud project.'
                  : 'No external Supabase project keys are set in .env yet. The app is fully interactive locally with instant switching between Muhaidar and Bayyan, camera filters, voice notes, and persistent storage.'}
              </p>
            </div>
          </div>

          {/* Switch Active Account (Muhaidar <-> Bayyan) */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-200 uppercase tracking-wider">
                Simulate Active Participant
              </span>
              <span className="text-[11px] text-rose-300/60">
                Test dual-user real-time chat
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onSwitchUser('muhaidar')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  activeUser === 'muhaidar'
                    ? 'border-rose-400 bg-rose-900/40 text-white ring-1 ring-rose-400/50 shadow-md'
                    : 'border-rose-950/60 bg-rose-950/20 text-rose-300 hover:border-rose-800'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-rose-700/50 border border-rose-500/40 flex items-center justify-center font-bold text-sm text-rose-100">
                  M
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-100">Muhaidar</div>
                  <div className="text-[10px] text-rose-300/70">Authorized Partner</div>
                </div>
              </button>

              <button
                onClick={() => onSwitchUser('bayyan')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  activeUser === 'bayyan'
                    ? 'border-rose-400 bg-rose-900/40 text-white ring-1 ring-rose-400/50 shadow-md'
                    : 'border-rose-950/60 bg-rose-950/20 text-rose-300 hover:border-rose-800'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-pink-700/50 border border-pink-500/40 flex items-center justify-center font-bold text-sm text-pink-100">
                  B
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-100">Bayyan</div>
                  <div className="text-[10px] text-rose-300/70">Authorized Partner</div>
                </div>
              </button>
            </div>
          </div>

          {/* Setup Instructions for Supabase */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-rose-200 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-rose-400" />
              How to Connect Your Supabase Cloud Project
            </h3>
            <ol className="text-xs text-rose-200/80 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                Create a project at <span className="text-rose-300 font-mono">supabase.com</span>.
              </li>
              <li>
                Run the SQL script from{' '}
                <span className="text-rose-300 font-mono">supabase/schema.sql</span> in your Supabase SQL Editor.
              </li>
              <li>
                Add your project keys to your local{' '}
                <span className="text-rose-300 font-mono">.env</span> file:
              </li>
            </ol>

            <div className="relative p-3 rounded-xl bg-black/60 border border-rose-950 font-mono text-[11px] text-rose-200/90 leading-relaxed overflow-x-auto">
              <div>VITE_SUPABASE_URL="https://your-project.supabase.co"</div>
              <div>VITE_SUPABASE_ANON_KEY="your-anon-key"</div>

              <button
                onClick={handleCopyEnv}
                aria-label="Copy environment variables"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-rose-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
