/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Camera,
  Mic,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Trash2,
  Edit2,
  X,
  Play,
  Pause,
  Download,
  AlertCircle,
  Heart,
  Volume2,
  Square,
} from 'lucide-react';
import { Message, UserPreferences } from '../lib/supabase';
import { chatService, VoiceNoteRecorder } from '../lib/chat';

interface ChatViewProps {
  activeUser: 'muhaidar' | 'bayyan';
  wallpaperPrefs: UserPreferences;
  onOpenCamera: () => void;
  onOpenWallpaperModal: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  activeUser,
  wallpaperPrefs,
  onOpenCamera,
  onOpenWallpaperModal,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // Voice note recording states
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordDuration, setAudioRecordDuration] = useState(0);
  const recorderRef = useRef<VoiceNoteRecorder | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Image / File input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox preview for full images/videos
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  // Chat scroll container
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat messages
  useEffect(() => {
    const unsubscribeMessages = chatService.subscribe((msgs) => {
      setMessages(msgs);
    });

    const unsubscribeTyping = chatService.subscribeTyping((user) => {
      // Don't show typing for self
      if (user && user !== activeUser) {
        setTypingUser(user);
      } else {
        setTypingUser(null);
      }
    });

    chatService.initRealtime('conv-main');

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [activeUser]);

  // Mark messages as read when viewing conversation
  const markVisibleAsRead = useCallback(() => {
    chatService.markAsRead(activeUser, 'conv-main');
  }, [activeUser]);

  useEffect(() => {
    markVisibleAsRead();
  }, [messages.length, markVisibleAsRead]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUser]);

  // Input change with typing broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim().length > 0) {
      chatService.broadcastTyping(activeUser);
    }
  };

  // Send text message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText;
    setInputText('');

    try {
      await chatService.sendMessage({
        senderId: activeUser,
        senderUsername: activeUser,
        content,
      });
    } catch (err) {
      console.error('Failed to send text:', err);
    }
  };

  // Send quick romantic heart reaction
  const handleSendHeart = async () => {
    try {
      await chatService.sendMessage({
        senderId: activeUser,
        senderUsername: activeUser,
        content: '❤️',
      });
    } catch (err) {
      console.error('Failed sending heart reaction:', err);
    }
  };

  // Start Audio Recording
  const startAudioRecording = async () => {
    try {
      const recorder = new VoiceNoteRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setIsRecordingAudio(true);
      setAudioRecordDuration(0);

      recordIntervalRef.current = setInterval(() => {
        setAudioRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Microphone error');
    }
  };

  // Stop and send audio recording
  const stopAndSendAudioRecording = async () => {
    if (!recorderRef.current) return;
    setIsRecordingAudio(false);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);

    try {
      const { blob, durationSec } = await recorderRef.current.stop();
      recorderRef.current = null;

      await chatService.sendMessage({
        senderId: activeUser,
        senderUsername: activeUser,
        content: `Voice Note (${Math.floor(durationSec / 60)}:${(durationSec % 60)
          .toString()
          .padStart(2, '0')})`,
        mediaBlob: blob,
        mediaType: 'audio',
        mediaDuration: durationSec,
      });
    } catch (err) {
      console.error('Failed sending voice note:', err);
    }
  };

  // Cancel audio recording
  const cancelAudioRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    setIsRecordingAudio(false);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setAudioRecordDuration(0);
  };

  // Upload attachment from file input
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    if (!isImage && !isVideo && !isAudio) {
      alert('Only images, videos, and audio files are allowed.');
      return;
    }

    try {
      await chatService.sendMessage({
        senderId: activeUser,
        senderUsername: activeUser,
        content: '',
        mediaBlob: file,
        mediaType: isImage ? 'image' : isVideo ? 'video' : 'audio',
        fileName: file.name,
      });
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Edit Message
  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;
    try {
      await chatService.editMessage(editingMessageId, editContent, activeUser);
      setEditingMessageId(null);
      setEditContent('');
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    }
  };

  // Handle Delete Message
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await chatService.deleteMessage(msgId, activeUser);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    }
  };

  const otherUser = activeUser === 'muhaidar' ? 'bayyan' : 'muhaidar';
  const otherUserDisplayName = activeUser === 'muhaidar' ? 'Bayyan' : 'Muhaidar';

  return (
    <div className="relative flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto md:border-x md:border-rose-950/60 overflow-hidden">
      {/* Dynamic Romantic Wallpaper Layer */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-700"
        style={{
          background:
            wallpaperPrefs.wallpaper_type === 'gradient'
              ? wallpaperPrefs.wallpaper_url
              : `url(${wallpaperPrefs.wallpaper_url}) center/cover no-repeat`,
        }}
      >
        {/* Soft atmospheric plum scrim to guarantee WCAG contrast */}
        <div className="absolute inset-0 bg-[#140417]/80 backdrop-blur-[1px]" />
      </div>

      {/* Chat Messages Region */}
      <div
        ref={chatContainerRef}
        onScroll={markVisibleAsRead}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scroll-smooth"
      >
        {/* Conversation Header Card */}
        <div className="text-center py-4 px-2">
          <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-full bg-rose-950/70 border border-rose-800/40 text-xs text-rose-200">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
            <span>Private &amp; Encrypted for Bayyan &amp; Muhaidar</span>
          </div>
          <p className="text-[11px] text-rose-300/50 mt-1.5">
            Real-time messages, Snapchat filters, and shared memories
          </p>
        </div>

        {/* Message Bubble Feed */}
        {messages.map((msg) => {
          const isMe = msg.sender_id === activeUser;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
            >
              {/* Sender label in quiet text */}
              <div className="text-[10px] text-rose-300/60 px-2 mb-0.5 capitalize">
                {isMe ? 'You' : msg.sender_username}
              </div>

              {/* Message Bubble Container */}
              <div className="relative max-w-[85%] md:max-w-[70%]">
                <div
                  className={`p-3.5 rounded-2xl text-sm transition-all shadow-lg ${
                    msg.is_deleted
                      ? 'bg-rose-950/40 border border-rose-900/30 text-rose-300/50 italic'
                      : isMe
                      ? 'bg-gradient-to-r from-rose-600 via-rose-700 to-pink-700 text-white rounded-br-xs shadow-rose-950/40'
                      : 'bg-[#250b28]/90 border border-rose-900/40 text-rose-50 rounded-bl-xs shadow-black/30'
                  }`}
                >
                  {/* Editing form */}
                  {editingMessageId === msg.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full py-1.5 px-3 rounded-lg bg-black/50 border border-white/20 text-white text-xs focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 text-white/70"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 rounded bg-rose-500 hover:bg-rose-400 text-white font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Media: Image Attachment */}
                      {msg.media_url && msg.media_type === 'image' && (
                        <div
                          onClick={() => setLightboxMedia({ url: msg.media_url!, type: 'image' })}
                          className="cursor-pointer mb-2 rounded-xl overflow-hidden border border-white/10 max-h-72"
                        >
                          <img
                            src={msg.media_url}
                            alt="Shared photo"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover hover:scale-102 transition-transform duration-200"
                          />
                        </div>
                      )}

                      {/* Media: Video Attachment */}
                      {msg.media_url && msg.media_type === 'video' && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-white/10 max-h-72">
                          <video
                            src={msg.media_url}
                            controls
                            playsInline
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                      )}

                      {/* Media: Audio Voice Note */}
                      {msg.media_url && msg.media_type === 'audio' && (
                        <AudioVoicePlayer
                          audioUrl={msg.media_url}
                          durationSec={msg.media_duration || 0}
                          isMe={isMe}
                        />
                      )}

                      {/* Text content */}
                      {msg.content && (
                        <p className="leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}
                    </>
                  )}

                  {/* Metadata Row: Timestamp, Edited tag, Status */}
                  <div
                    className={`flex items-center justify-end gap-1.5 text-[10px] mt-1.5 ${
                      isMe ? 'text-rose-200/80' : 'text-rose-300/60'
                    }`}
                  >
                    {msg.is_edited && <span>(edited)</span>}
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {/* Status checkmarks for author */}
                    {isMe && !msg.is_deleted && (
                      <span title={`Status: ${msg.status}`}>
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-pink-300 inline" />
                        ) : msg.status === 'sent' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-rose-300/70 inline" />
                        ) : msg.status === 'error' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-300 inline" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-rose-300/60 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Author message actions (Hover menu on desktop / visible affordance) */}
                {isMe && !msg.is_deleted && editingMessageId !== msg.id && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-2 flex items-center gap-1 bg-[#1c0722] border border-rose-900/60 rounded-full px-2 py-0.5 shadow-md">
                    {msg.content && !msg.media_url && (
                      <button
                        onClick={() => handleStartEdit(msg)}
                        title="Edit message"
                        className="p-1 text-rose-300 hover:text-white"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      title="Delete message"
                      className="p-1 text-rose-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Typing Indicator */}
        {typingUser && (
          <div className="flex items-center gap-2 text-xs text-rose-300/80 px-2 py-1 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span className="font-medium capitalize">{typingUser}</span> is typing a love note...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Audio Voice Note Recording Floating Bar */}
      {isRecordingAudio && (
        <div className="relative z-20 p-4 bg-[#1b0620] border-t border-rose-900/60 flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-ping" />
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono font-bold text-rose-200">
                {Math.floor(audioRecordDuration / 60)}:
                {(audioRecordDuration % 60).toString().padStart(2, '0')}
              </span>
              <div className="flex items-center gap-0.5 ml-2">
                <span className="w-1 h-3 bg-rose-400 rounded-full animate-soundwave" />
                <span className="w-1 h-5 bg-rose-400 rounded-full animate-soundwave delay-75" />
                <span className="w-1 h-2 bg-rose-400 rounded-full animate-soundwave delay-150" />
                <span className="w-1 h-4 bg-rose-400 rounded-full animate-soundwave delay-200" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cancelAudioRecording}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={stopAndSendAudioRecording}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-rose-900/50 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Voice Note</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Input Bar */}
      {!isRecordingAudio && (
        <div className="relative z-20 p-3 md:p-4 bg-[#18051b]/95 backdrop-blur-md border-t border-rose-950/70">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            {/* Camera Launcher Button */}
            <button
              type="button"
              onClick={onOpenCamera}
              aria-label="Open Camera"
              title="Open Camera & Filters"
              className="min-h-[44px] min-w-[44px] rounded-full bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
            >
              <Camera className="w-5 h-5 text-rose-300" />
            </button>

            {/* Gallery File Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={handleAttachmentUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach photo or media"
              title="Attach media from device"
              className="min-h-[44px] min-w-[44px] rounded-full bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
            >
              <ImageIcon className="w-4 h-4 text-rose-300" />
            </button>

            {/* Text input container */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={`Message ${otherUserDisplayName}...`}
                className="w-full py-3 pl-4 pr-10 rounded-2xl bg-[#230927] border border-rose-900/50 text-sm text-rose-100 placeholder-rose-300/40 focus:outline-none focus:border-rose-500 transition-colors"
              />
              {/* Quick Heart Reaction button inside input */}
              <button
                type="button"
                onClick={handleSendHeart}
                aria-label="Send romantic heart"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-400 hover:text-rose-300 hover:scale-110 active:scale-95 transition-all"
                title="Send Heart"
              >
                <Heart className="w-4 h-4 fill-rose-500/80 text-rose-400" />
              </button>
            </div>

            {/* Voice Note Record or Send Button */}
            {inputText.trim().length > 0 ? (
              <button
                type="submit"
                aria-label="Send message"
                className="min-h-[44px] min-w-[44px] rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 transition-all active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startAudioRecording}
                aria-label="Record voice note"
                title="Record voice note"
                className="min-h-[44px] min-w-[44px] rounded-full bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-rose-100 flex items-center justify-center transition-colors shrink-0 shadow-sm"
              >
                <Mic className="w-5 h-5 text-rose-300" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Lightbox Media Modal */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-3xl max-h-[85vh]">
            {lightboxMedia.type === 'image' ? (
              <img
                src={lightboxMedia.url}
                alt="Enlarged media"
                referrerPolicy="no-referrer"
                className="max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                className="max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline Audio Voice Note Player Component
const AudioVoicePlayer: React.FC<{ audioUrl: string; durationSec: number; isMe: boolean }> = ({
  audioUrl,
  durationSec,
  isMe,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  return (
    <div className="flex flex-col gap-2 p-2 rounded-xl bg-black/20 border border-white/10 my-1 min-w-[200px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play voice note'}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0 transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Audio scrub waveform simulation */}
        <div className="flex-1 flex items-center gap-0.5 h-6">
          {[4, 8, 14, 6, 12, 18, 10, 16, 7, 13, 20, 11, 8, 15, 6, 12].map((h, i) => {
            const barProgress = (i / 16) * (durationSec || 1);
            const isPlayed = currentTime >= barProgress;
            return (
              <span
                key={i}
                style={{ height: `${h}px` }}
                className={`flex-1 rounded-full transition-colors ${
                  isPlayed ? 'bg-white' : 'bg-white/30'
                }`}
              />
            );
          })}
        </div>

        {/* Speed toggle */}
        <button
          onClick={toggleSpeed}
          title="Playback speed"
          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white shrink-0"
        >
          {playbackRate}x
        </button>

        {/* Download voice note */}
        <a
          href={audioUrl}
          download={`voice_note_${Date.now()}.webm`}
          title="Download audio"
          className="text-white/70 hover:text-white p-1"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex justify-between text-[10px] text-white/70 px-1 font-mono">
        <span>
          {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')}
        </span>
        <span>
          {Math.floor(durationSec / 60)}:{(durationSec % 60).toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
