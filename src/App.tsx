/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { ChatView } from './components/ChatView';
import { CameraView } from './components/CameraView';
import { GalleryView } from './components/GalleryView';
import { WallpaperModal } from './components/WallpaperModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { getSavedWallpaperPreference, chatService } from './lib/chat';
import { UserPreferences, Message } from './lib/supabase';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'chat' | 'camera' | 'gallery'>('chat');
  const [activeUser, setActiveUser] = useState<'muhaidar' | 'bayyan'>(() => {
    const saved = localStorage.getItem('bayyan_muhaidar_active_user');
    return saved === 'bayyan' ? 'bayyan' : 'muhaidar';
  });

  const [wallpaperPrefs, setWallpaperPrefs] = useState<UserPreferences>(() =>
    getSavedWallpaperPreference()
  );

  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Keep messages list synced for gallery view
  useEffect(() => {
    const unsub = chatService.subscribe((msgs) => setMessages(msgs));
    return () => unsub();
  }, []);

  const handleSwitchUser = () => {
    const nextUser = activeUser === 'muhaidar' ? 'bayyan' : 'muhaidar';
    setActiveUser(nextUser);
    localStorage.setItem('bayyan_muhaidar_active_user', nextUser);
  };

  const handleSetUser = (user: 'muhaidar' | 'bayyan') => {
    setActiveUser(user);
    localStorage.setItem('bayyan_muhaidar_active_user', user);
  };

  const handleSendMediaToChat = async (
    blob: Blob,
    mediaType: 'image' | 'video',
    caption?: string
  ) => {
    try {
      await chatService.sendMessage({
        senderId: activeUser,
        senderUsername: activeUser,
        content: caption || '',
        mediaBlob: blob,
        mediaType,
      });
      setCurrentTab('chat');
    } catch (err) {
      console.error('Error sending media to chat:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#120414] text-rose-50 flex flex-col font-sans select-none pb-14 md:pb-0 overflow-x-hidden">
      {/* Universal Top Bar */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        activeUser={activeUser}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {currentTab === 'chat' && (
          <ChatView
            activeUser={activeUser}
            wallpaperPrefs={wallpaperPrefs}
            onOpenCamera={() => setCurrentTab('camera')}
            onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)}
          />
        )}

        {currentTab === 'camera' && (
          <CameraView
            onSendMediaToChat={handleSendMediaToChat}
            onClose={() => setCurrentTab('chat')}
          />
        )}

        {currentTab === 'gallery' && (
          <GalleryView
            messages={messages}
            onOpenCamera={() => setCurrentTab('camera')}
          />
        )}
      </main>

      {/* Mobile Ergonomic Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* Wallpaper Picker Modal */}
      <WallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        currentPrefs={wallpaperPrefs}
        onSelectWallpaper={(prefs) => setWallpaperPrefs(prefs)}
      />

      {/* Supabase & Credentials Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        activeUser={activeUser}
        onSwitchUser={handleSetUser}
      />
    </div>
  );
}
