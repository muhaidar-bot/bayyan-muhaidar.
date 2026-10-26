/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Message } from '../lib/supabase';
import { Camera, Download, Heart, Play, Mic, Image as ImageIcon, Video } from 'lucide-react';

interface GalleryViewProps {
  messages: Message[];
  onOpenCamera: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ messages, onOpenCamera }) => {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [selectedItem, setSelectedItem] = useState<Message | null>(null);

  // Extract all media messages
  const mediaMessages = messages.filter((m) => m.media_url && !m.is_deleted);
  const filteredMedia = mediaMessages.filter((m) => {
    if (filterType === 'all') return true;
    return m.media_type === filterType;
  });

  return (
    <div className="relative flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 py-6 overflow-y-auto">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-rose-950/60">
        <div>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-rose-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            Romantic Memories &amp; Media
          </h1>
          <p className="text-xs text-rose-300/70 mt-1">
            Every snap, video clip, and voice note shared between Bayyan &amp; Muhaidar
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-rose-950/50 rounded-xl border border-rose-900/40">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-300 hover:text-white'
            }`}
          >
            All ({mediaMessages.length})
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'image'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-300 hover:text-white'
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'video'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-300 hover:text-white'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'audio'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-300 hover:text-white'
            }`}
          >
            Voice Notes
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredMedia.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-3xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h2 className="text-base font-serif font-bold text-rose-100">
            No memories yet in this category
          </h2>
          <p className="text-xs text-rose-300/60 max-w-sm mt-1 leading-relaxed">
            Open the Snapchat-style camera to snap photos with romantic filters, record sweet videos, or send a voice note.
          </p>
          <button
            onClick={onOpenCamera}
            className="mt-5 py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-rose-950 transition-all"
          >
            Open Camera &amp; Filters
          </button>
        </div>
      ) : (
        /* Media Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-6">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative aspect-square rounded-2xl overflow-hidden border border-rose-950/60 bg-rose-950/20 cursor-pointer shadow-md hover:border-rose-700 transition-all"
            >
              {item.media_type === 'image' && (
                <img
                  src={item.media_url!}
                  alt="Captured memory"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}

              {item.media_type === 'video' && (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    src={item.media_url!}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-10 h-10 rounded-full bg-rose-600/80 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 ml-0.5 fill-white" />
                    </div>
                  </div>
                </div>
              )}

              {item.media_type === 'audio' && (
                <div className="w-full h-full bg-gradient-to-br from-[#2a0b2d] to-[#15041a] p-4 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-full bg-rose-600/30 flex items-center justify-center text-rose-300">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-300/80 font-mono block">
                      Voice Note
                    </span>
                    <span className="text-xs text-rose-100 font-semibold">
                      {item.media_duration ? `${item.media_duration}s` : 'Audio'}
                    </span>
                  </div>
                </div>
              )}

              {/* Hover overlay with sender & timestamp */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                <span className="text-[10px] font-semibold text-rose-100 capitalize">
                  {item.sender_username}
                </span>
                <span className="text-[9px] text-rose-300/70">
                  {new Date(item.created_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Lightbox Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#1c0822] border border-rose-950 rounded-3xl overflow-hidden shadow-2xl p-4 text-rose-50"
          >
            <div className="flex items-center justify-between pb-3 border-b border-rose-950/60 mb-3">
              <div>
                <span className="text-xs font-semibold text-rose-200 capitalize">
                  By {selectedItem.sender_username}
                </span>
                <span className="text-[10px] text-rose-300/60 block">
                  {new Date(selectedItem.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedItem.media_url!}
                  download={`memory_${selectedItem.id}`}
                  className="p-2 rounded-xl bg-rose-950/80 text-rose-200 hover:text-white transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-xl bg-rose-950/80 text-rose-200 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center max-h-[65vh] overflow-hidden rounded-2xl bg-black">
              {selectedItem.media_type === 'image' && (
                <img
                  src={selectedItem.media_url!}
                  alt="Full memory preview"
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] object-contain"
                />
              )}
              {selectedItem.media_type === 'video' && (
                <video
                  src={selectedItem.media_url!}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[60vh] object-contain"
                />
              )}
              {selectedItem.media_type === 'audio' && (
                <div className="p-8 w-full flex flex-col items-center">
                  <Mic className="w-12 h-12 text-rose-400 mb-4 animate-pulse" />
                  <audio src={selectedItem.media_url!} controls className="w-full max-w-md" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
