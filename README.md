# Bayyan ❤️ Muhaidar

A private, romantic one-to-one messaging and camera Progressive Web Application (PWA) designed exclusively for **Bayyan** and **Muhaidar**. Combines real-time chat, rich media sharing, voice notes, Snapchat-style camera filters, animated overlays, customizable romantic wallpapers, account recovery, and message activity indicators.

---

## 🌟 Key Features

1. **Private Romantic 1-to-1 Chat**
   - End-to-end messaging exclusively between authorized accounts (`muhaidar` and `bayyan`).
   - Edit sent messages and soft-delete messages with explicit author permission checks.
   - Message timestamps, sending, sent, delivered, and read/seen status indicators.
   - Live typing indicators via broadcast events that reset automatically when typing stops.
   - Read cursor receipts recorded only when the conversation is opened and viewed.

2. **Snapchat-Style Camera with Real Composited Effects**
   - Front and rear camera switching with live viewfinder preview.
   - Flashlight / torch toggle on supported mobile hardware and browsers.
   - Countdown timer options: Off, 3s, 5s, and 10s.
   - **10 Camera Filters**: Original, Golden Hour, Warm Glow, Pink Romance, Purple Dream, Cool Blue, Vintage, Cinematic, Black & White, and High Contrast.
   - **5 Animated Decorative Overlays**: Hearts ❤️, Sparkles ✨, Flowers 🌸, Sunglasses 🕶️, and Rainbow 🌈.
   - **Direct Media Compositing**: Selected filters and animated overlays are rendered and baked directly into the captured JPEG photo or recorded WebM/MP4 video file via HTML5 Canvas compositing.
   - Retake, preview, local download, and one-click "Send to Chat".
   - Import photos and videos from device gallery.

3. **Voice Notes**
   - Built-in audio recorder with elapsed recording timer and live soundwave feedback.
   - In-chat voice player with progress scrubber, waveform bars, playback speed control (1x, 1.5x, 2x), and download capability.

4. **Persistent Wallpapers & Romantic Theme**
   - Velvet dark-plum, rose, and wine red aesthetic with WCAG AA compliant text contrast.
   - Preset romantic wallpapers (Celestial Dark Plum, Romantic Rose Glow, Velvet Midnight Gradient).
   - Custom photo wallpaper upload directly from the device gallery.
   - Preferences persist across reloads and devices.

5. **Memories & Media Gallery**
   - Dedicated gallery screen to browse, filter, and relive photos, videos, and voice notes shared between Bayyan and Muhaidar.

6. **Installable Progressive Web App (PWA)**
   - Web App Manifest (`/public/manifest.webmanifest`) and custom vector icon (`/public/icons/app-icon.svg`).
   - Responsive layouts optimized for iPhone, Android, tablets, and desktop computers with mobile bottom navigation.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion.
- **Backend & Cloud Sync**: Supabase PostgreSQL, Authentication, Realtime channels, and private Storage.
- **Local-First & Preview Mode**: Works out of the box with persistent local storage and instant account switching between Muhaidar and Bayyan so all features can be tested before connecting a cloud Supabase project.

---

## 🚀 Setup & Local Development (Windows 11 / macOS / Linux)

### 1. Clone & Install Dependencies
Open your terminal (PowerShell on Windows 11):
```powershell
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
*(On macOS / Linux: `cp .env.example .env`)*

Edit `.env` and fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Initialize Supabase Database
1. Go to [supabase.com](https://supabase.com) and open your project.
2. Navigate to **SQL Editor**.
3. Open `supabase/schema.sql` from this repository, copy its contents, and click **Run**.
4. This script sets up:
   - `profiles` table with usernames constrained to `muhaidar` and `bayyan`.
   - `conversations`, `conversation_participants`, `messages`, `read_receipts`, and `user_preferences`.
   - Strict Row Level Security (RLS) policies.
   - Realtime publication for messages and read receipts.
   - Private `chat-media` Storage bucket and access policies.

### 4. Start Development Server
```powershell
npm run dev
```
Open the localhost URL printed by Vite in your browser.

---

## 📱 Testing Checklist

- [x] Both authorized users (`muhaidar` & `bayyan`) can toggle or sign in and view the conversation.
- [x] Messages persist and synchronize between sessions.
- [x] Edit and delete controls are only permitted for the author's messages.
- [x] Typing indicators broadcast and clear on pause.
- [x] Photos, videos, and voice notes can be recorded, played, and downloaded.
- [x] Camera filters (Golden Hour, Pink Romance, etc.) and animated overlays (Hearts, Sparkles, Flowers, etc.) are composited into captured files.
- [x] Camera streams cleanly terminate when navigating away from the camera screen.
- [x] Wallpaper preference persists after reload.
- [x] Production build passes without TypeScript or bundling errors.
