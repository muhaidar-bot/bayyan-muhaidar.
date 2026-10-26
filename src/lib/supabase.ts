/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.trim() !== '' &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Real Supabase client if configured, or a proxy/mock fallback
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export interface Profile {
  id: string;
  username: 'muhaidar' | 'bayyan' | string;
  display_name: string;
  avatar_url: string;
  role: 'partner' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'audio' | null;
  media_duration?: number | null; // For audio voice notes or video duration
  media_metadata?: Record<string, unknown> | null;
  is_edited: boolean;
  is_deleted: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  created_at: string;
  updated_at?: string;
}

export interface ReadReceipt {
  conversation_id: string;
  user_id: string;
  last_read_message_id: string;
  last_read_at: string;
}

export interface UserPreferences {
  user_id: string;
  wallpaper_url: string;
  wallpaper_type: 'preset' | 'custom' | 'gradient';
  theme_mode: 'plum' | 'dark' | 'rose';
  updated_at: string;
}

// Two Authorized Primary Accounts
export const AUTHORIZED_USERS: { [username: string]: { username: string; displayName: string; email: string; avatar: string; role: string } } = {
  muhaidar: {
    username: 'muhaidar',
    displayName: 'Muhaidar',
    email: 'muhaidar@bayyan-muhaidar.app',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    role: 'partner',
  },
  bayyan: {
    username: 'bayyan',
    displayName: 'Bayyan',
    email: 'bayyan@bayyan-muhaidar.app',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    role: 'partner',
  },
};

/**
 * Uploads media file to private Supabase Storage bucket 'chat-media'
 * or falls back to local object storage / data URL if offline/unconfigured.
 */
export async function uploadPrivateMedia(
  fileBlob: Blob,
  fileName: string,
  folder = 'chat-media'
): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    const filePath = `${folder}/${Date.now()}_${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, fileBlob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Create time-limited signed URL for private media (1 hour validity)
    const { data, error: signError } = await supabase.storage
      .from('chat-media')
      .createSignedUrl(filePath, 60 * 60);

    if (signError || !data?.signedUrl) {
      throw new Error(`Failed to generate signed URL: ${signError?.message}`);
    }

    return data.signedUrl;
  }

  // Local fallback: Convert Blob to Data URL or Object URL for offline testability
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(fileBlob);
  });
}
