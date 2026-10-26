/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, ReadReceipt, UserPreferences, supabase, isSupabaseConfigured, uploadPrivateMedia } from './supabase';

export type { UserPreferences };

const LOCAL_STORAGE_MESSAGES_KEY = 'bayyan_muhaidar_chat_messages_v1';
const LOCAL_STORAGE_RECEIPTS_KEY = 'bayyan_muhaidar_read_receipts_v1';
const LOCAL_STORAGE_PREFS_KEY = 'bayyan_muhaidar_user_prefs_v1';

// Seed sample romantic conversation between Bayyan and Muhaidar
export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-seed-1',
    conversation_id: 'conv-main',
    sender_id: 'bayyan',
    sender_username: 'bayyan',
    content: 'Muhaidar, look at this sunset! Remember our rooftop coffee conversations?',
    status: 'read',
    is_edited: false,
    is_deleted: false,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'msg-seed-2',
    conversation_id: 'conv-main',
    sender_id: 'muhaidar',
    sender_username: 'muhaidar',
    content: 'Of course I do, Bayyan. Every single word and every laugh. I wouldn’t trade that evening for the world. ❤️',
    status: 'read',
    is_edited: false,
    is_deleted: false,
    created_at: new Date(Date.now() - 3600000 * 23).toISOString(),
  },
  {
    id: 'msg-seed-3',
    conversation_id: 'conv-main',
    sender_id: 'bayyan',
    sender_username: 'bayyan',
    content: 'I took some snaps with the Golden Hour filter earlier. The colors remind me of that night.',
    status: 'read',
    is_edited: false,
    is_deleted: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'msg-seed-4',
    conversation_id: 'conv-main',
    sender_id: 'muhaidar',
    sender_username: 'muhaidar',
    content: 'You look radiant with that filter on. Can’t wait until we catch the twilight together again.',
    status: 'read',
    is_edited: false,
    is_deleted: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

// Audio Voice Note Recording Manager
export class VoiceNoteRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime = 0;
  private stream: MediaStream | null = null;

  public async start(): Promise<void> {
    this.audioChunks = [];
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.startTime = Date.now();

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission was denied. Please allow microphone access in your browser to record voice notes.');
      }
      throw new Error(`Microphone error: ${error.message || 'Unable to access audio device.'}`);
    }
  }

  public stop(): Promise<{ blob: Blob; durationSec: number; url: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        return reject(new Error('Recorder is not active'));
      }

      const durationSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Stop media stream tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        resolve({ blob, durationSec, url });
      };

      this.mediaRecorder.stop();
    });
  }

  public cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}

// Chat Storage & Realtime Synchronization Class
export class ChatService {
  private messages: Message[] = [];
  private listeners: Array<(messages: Message[]) => void> = [];
  private typingListeners: Array<(typingUser: string | null) => void> = [];
  private activeTypingTimeout: NodeJS.Timeout | null = null;
  private currentTypingUser: string | null = null;
  private realtimeChannel: any = null;

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
      if (stored) {
        this.messages = JSON.parse(stored);
      } else {
        this.messages = [...INITIAL_MESSAGES];
        this.saveToLocalStorage();
      }
    } catch (e) {
      console.warn('Error reading local messages:', e);
      this.messages = [...INITIAL_MESSAGES];
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(this.messages));
    } catch (e) {
      console.warn('Failed saving messages to localStorage:', e);
    }
  }

  public getMessages(): Message[] {
    return [...this.messages];
  }

  public subscribe(callback: (messages: Message[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.getMessages());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public subscribeTyping(callback: (typingUser: string | null) => void): () => void {
    this.typingListeners.push(callback);
    callback(this.currentTypingUser);
    return () => {
      this.typingListeners = this.typingListeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.saveToLocalStorage();
    const current = this.getMessages();
    this.listeners.forEach((cb) => cb(current));
  }

  private notifyTyping(user: string | null) {
    this.currentTypingUser = user;
    this.typingListeners.forEach((cb) => cb(user));
  }

  // Send a text or media message
  public async sendMessage(params: {
    senderId: string;
    senderUsername: string;
    content: string;
    mediaBlob?: Blob;
    mediaType?: 'image' | 'video' | 'audio';
    mediaDuration?: number;
    fileName?: string;
  }): Promise<Message> {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let mediaUrl: string | undefined;

    // Validate size (< 50MB) and mime type
    if (params.mediaBlob) {
      const maxSizeBytes = 50 * 1024 * 1024;
      if (params.mediaBlob.size > maxSizeBytes) {
        throw new Error('File size exceeds the 50MB private storage limit.');
      }

      try {
        mediaUrl = await uploadPrivateMedia(
          params.mediaBlob,
          params.fileName || `${params.mediaType || 'file'}_${Date.now()}.${params.mediaType === 'image' ? 'jpg' : params.mediaType === 'video' ? 'webm' : 'webm'}`
        );
      } catch (err) {
        console.error('Failed to upload media:', err);
        throw new Error('Media upload failed. Please check network connection and try again.');
      }
    }

    const newMessage: Message = {
      id: messageId,
      conversation_id: 'conv-main',
      sender_id: params.senderId,
      sender_username: params.senderUsername,
      content: params.content.trim(),
      media_url: mediaUrl,
      media_type: params.mediaType,
      media_duration: params.mediaDuration,
      is_edited: false,
      is_deleted: false,
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    // If Supabase is configured, push to database
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('messages').insert({
          id: newMessage.id,
          conversation_id: newMessage.conversation_id,
          sender_id: newMessage.sender_id,
          sender_username: newMessage.sender_username,
          content: newMessage.content,
          media_url: newMessage.media_url,
          media_type: newMessage.media_type,
          media_duration: newMessage.media_duration,
          is_edited: false,
          is_deleted: false,
          created_at: newMessage.created_at,
        });
        if (error) {
          console.warn('Supabase message insert error:', error);
          newMessage.status = 'error';
        }
      } catch (err) {
        console.warn('Supabase network error on sendMessage:', err);
      }
    }

    this.messages.push(newMessage);
    this.notify();
    return newMessage;
  }

  // Edit sent message (only permitted by original sender)
  public async editMessage(messageId: string, newContent: string, currentUserId: string): Promise<void> {
    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    if (msg.sender_id !== currentUserId) {
      throw new Error('Only the author can edit this message');
    }

    msg.content = newContent.trim();
    msg.is_edited = true;
    msg.updated_at = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('messages')
          .update({
            content: msg.content,
            is_edited: true,
            updated_at: msg.updated_at,
          })
          .eq('id', messageId);
      } catch (e) {
        console.warn('Supabase edit error:', e);
      }
    }

    this.notify();
  }

  // Delete message (soft delete)
  public async deleteMessage(messageId: string, currentUserId: string): Promise<void> {
    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    if (msg.sender_id !== currentUserId) {
      throw new Error('Only the author can delete this message');
    }

    msg.is_deleted = true;
    msg.content = 'This message was deleted';
    msg.media_url = undefined;
    msg.updated_at = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('messages')
          .update({
            is_deleted: true,
            content: msg.content,
            media_url: null,
            updated_at: msg.updated_at,
          })
          .eq('id', messageId);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }

    this.notify();
  }

  // Mark messages as read by current viewer
  public markAsRead(currentUserId: string, conversationId = 'conv-main'): void {
    let hasChanges = false;
    for (const msg of this.messages) {
      if (msg.sender_id !== currentUserId && msg.status !== 'read' && !msg.is_deleted) {
        msg.status = 'read';
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.notify();
      // Record read receipt
      try {
        const receipt: ReadReceipt = {
          conversation_id: conversationId,
          user_id: currentUserId,
          last_read_message_id: this.messages[this.messages.length - 1]?.id || '',
          last_read_at: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_STORAGE_RECEIPTS_KEY, JSON.stringify(receipt));

        if (isSupabaseConfigured && supabase) {
          supabase.from('read_receipts').upsert(receipt).then();
        }
      } catch (e) {
        console.warn('Error recording read receipt:', e);
      }
    }
  }

  // Broadcast typing indicator
  public broadcastTyping(username: string): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { username },
      });
    }

    // Also trigger local listener for simulated 2-user demo
    this.notifyTyping(username);
    if (this.activeTypingTimeout) {
      clearTimeout(this.activeTypingTimeout);
    }
    this.activeTypingTimeout = setTimeout(() => {
      this.notifyTyping(null);
    }, 2800);
  }

  // Initialize Realtime listeners if Supabase is configured
  public initRealtime(conversationId = 'conv-main') {
    if (!isSupabaseConfigured || !supabase) return;

    this.realtimeChannel = supabase.channel(`room:${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    this.realtimeChannel
      .on('broadcast', { event: 'typing' }, (payload: { payload: { username: string } }) => {
        const username = payload.payload.username;
        this.notifyTyping(username);
        if (this.activeTypingTimeout) clearTimeout(this.activeTypingTimeout);
        this.activeTypingTimeout = setTimeout(() => {
          this.notifyTyping(null);
        }, 2800);
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as Message;
            if (!this.messages.some((m) => m.id === newRow.id)) {
              this.messages.push(newRow);
              this.notify();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as Message;
            const index = this.messages.findIndex((m) => m.id === updatedRow.id);
            if (index !== -1) {
              this.messages[index] = { ...this.messages[index], ...updatedRow };
              this.notify();
            }
          }
        }
      )
      .subscribe();
  }

  public cleanup() {
    if (this.realtimeChannel && supabase) {
      supabase.removeChannel(this.realtimeChannel);
    }
    if (this.activeTypingTimeout) {
      clearTimeout(this.activeTypingTimeout);
    }
  }
}

export const chatService = new ChatService();

// Wallpaper preference storage
export function getSavedWallpaperPreference(): UserPreferences {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed getting wallpaper preferences:', e);
  }

  return {
    user_id: 'default',
    wallpaper_url: '/src/assets/images/wallpaper_dark_plum_1793031400874.jpg',
    wallpaper_type: 'preset',
    theme_mode: 'plum',
    updated_at: new Date().toISOString(),
  };
}

export function saveWallpaperPreference(pref: UserPreferences): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(pref));
  } catch (e) {
    console.warn('Failed saving wallpaper preferences:', e);
  }
}
