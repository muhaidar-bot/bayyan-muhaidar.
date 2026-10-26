/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MessageSquare, Camera, Sparkles, SlidersHorizontal } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'chat' | 'camera' | 'gallery';
  onSelectTab: (tab: 'chat' | 'camera' | 'gallery') => void;
  onOpenWallpaperModal: () => void;
  onOpenConfigModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenWallpaperModal,
  onOpenConfigModal,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#16041a]/95 backdrop-blur-lg border-t border-rose-950/70 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4 items-center h-14 max-w-md mx-auto px-2">
        {/* Chat tab */}
        <button
          onClick={() => onSelectTab('chat')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-colors ${
            currentTab === 'chat' ? 'text-rose-400 font-semibold' : 'text-rose-300/60 hover:text-rose-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Chat</span>
        </button>

        {/* Camera tab */}
        <button
          onClick={() => onSelectTab('camera')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-colors ${
            currentTab === 'camera' ? 'text-rose-400 font-semibold' : 'text-rose-300/60 hover:text-rose-200'
          }`}
        >
          <div className="relative">
            <Camera className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-75" />
          </div>
          <span className="text-[10px] mt-0.5">Camera</span>
        </button>

        {/* Wallpaper */}
        <button
          onClick={onOpenWallpaperModal}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-rose-300/60 hover:text-rose-200 transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Wallpaper</span>
        </button>

        {/* Settings / Cloud */}
        <button
          onClick={onOpenConfigModal}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-rose-300/60 hover:text-rose-200 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Settings</span>
        </button>
      </div>
    </nav>
  );
};
