/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, MessageSquare, Image as ImageIcon, SlidersHorizontal, Sparkles } from 'lucide-react';

interface TopBarProps {
  currentTab: 'chat' | 'camera' | 'gallery';
  onSelectTab: (tab: 'chat' | 'camera' | 'gallery') => void;
  onOpenWallpaperModal: () => void;
  onOpenConfigModal: () => void;
  activeUser: 'muhaidar' | 'bayyan';
  onSwitchUser: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenWallpaperModal,
  onOpenConfigModal,
  activeUser,
  onSwitchUser,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#18051b]/90 backdrop-blur-md border-b border-rose-950/60 px-4 md:px-8 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-serif text-lg md:text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-pink-300 to-rose-400 whitespace-nowrap">
            Bayyan ❤️ Muhaidar
          </span>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-rose-200/80">
          <button
            onClick={() => onSelectTab('chat')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'chat'
                ? 'text-rose-300 font-semibold border-b-2 border-rose-500 pb-0.5'
                : 'hover:text-rose-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onSelectTab('camera')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'camera'
                ? 'text-rose-300 font-semibold border-b-2 border-rose-500 pb-0.5'
                : 'hover:text-rose-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            onClick={() => onSelectTab('gallery')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'gallery'
                ? 'text-rose-300 font-semibold border-b-2 border-rose-500 pb-0.5'
                : 'hover:text-rose-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Memories</span>
          </button>

          <button
            onClick={onOpenWallpaperModal}
            className="flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 text-rose-300/70 hover:text-rose-100"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wallpaper</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action & user switch */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick User Switcher */}
          <button
            onClick={onSwitchUser}
            title={`Logged in as ${activeUser === 'muhaidar' ? 'Muhaidar' : 'Bayyan'}. Click to switch participant.`}
            className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/40 text-xs text-rose-200 transition-colors"
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                activeUser === 'muhaidar' ? 'bg-rose-600' : 'bg-pink-600'
              }`}
            >
              {activeUser === 'muhaidar' ? 'M' : 'B'}
            </div>
            <span className="font-medium capitalize text-[11px] hidden sm:inline">
              {activeUser}
            </span>
          </button>

          {/* Settings / Cloud Status */}
          <button
            onClick={onOpenConfigModal}
            aria-label="Settings and Cloud Sync"
            className="w-8 h-8 rounded-full flex items-center justify-center text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-950 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
