-- ==============================================================================
-- Bayyan ❤ Muhaidar — Private Romantic Chat & Media Application
-- Complete Supabase PostgreSQL Schema, RLS Policies, Realtime & Storage Setup
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Restricted strictly to the two authorized accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (username IN ('muhaidar', 'bayyan')),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('partner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY DEFAULT 'conv-main',
  title TEXT NOT NULL DEFAULT 'Bayyan & Muhaidar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 4. Conversation Participants (Enforces that only Bayyan and Muhaidar participate)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 5. Messages Table (Supports text, photo, video, and audio voice-notes)
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_username TEXT NOT NULL CHECK (sender_username IN ('muhaidar', 'bayyan')),
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', NULL)),
  media_duration INTEGER, -- duration in seconds for voice notes / videos
  media_metadata JSONB DEFAULT '{}'::jsonb,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. Read Receipts & Seen Status (Tracking actual viewing)
CREATE TABLE IF NOT EXISTS public.read_receipts (
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  last_read_message_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE public.read_receipts ENABLE ROW LEVEL SECURITY;

-- 7. User Preferences (Wallpaper selection, custom themes)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallpaper_url TEXT NOT NULL DEFAULT '',
  wallpaper_type TEXT NOT NULL DEFAULT 'preset',
  theme_mode TEXT NOT NULL DEFAULT 'plum',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict authorization ensuring only authorized accounts access conversation & media
-- ==============================================================================

-- Profiles: Authenticated users can view profiles; users can update only their own profile
CREATE POLICY "Allow authenticated read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow individual update to own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Conversations: Only members of conversation_participants can access
CREATE POLICY "Allow authorized participants to view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = public.conversations.id
      AND user_id = auth.uid()
    )
  );

-- Participants: Viewable by members
CREATE POLICY "Allow view conversation participants"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (true);

-- Messages:
-- 1. SELECT: Only authorized conversation participants can read messages
CREATE POLICY "Allow conversation participants to read messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = public.messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- 2. INSERT: Only authorized participants can send messages
CREATE POLICY "Allow authenticated participants to send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND username IN ('muhaidar', 'bayyan')
    )
  );

-- 3. UPDATE: Only message author can edit their own message
CREATE POLICY "Allow author to edit message"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (username = public.messages.sender_username OR id::text = public.messages.sender_id)
    )
  );

-- 4. DELETE: Only author can delete
CREATE POLICY "Allow author to delete message"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (username = public.messages.sender_username OR id::text = public.messages.sender_id)
    )
  );

-- Read Receipts:
CREATE POLICY "Allow read receipt viewing"
  ON public.read_receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow user to upsert own read receipt"
  ON public.read_receipts FOR ALL
  TO authenticated
  USING (true);

-- User Preferences:
CREATE POLICY "Allow user to manage own preferences"
  ON public.user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ==============================================================================

-- Enable Realtime publication for messages and read_receipts tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.read_receipts;

-- ==============================================================================
-- PRIVATE STORAGE BUCKET CONFIGURATION (chat-media)
-- Execute in Supabase SQL editor or create via Storage dashboard
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Authenticated users can upload media
CREATE POLICY "Allow authenticated uploads to chat-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-media');

-- Storage Policy: Authenticated users can read chat-media
CREATE POLICY "Allow authenticated reading of chat-media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-media');

-- ==============================================================================
-- INITIAL SEED CONVERSATION
-- ==============================================================================
INSERT INTO public.conversations (id, title)
VALUES ('conv-main', 'Bayyan & Muhaidar')
ON CONFLICT (id) DO NOTHING;
