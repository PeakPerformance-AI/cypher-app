# CYPHER - Hip Hop Beat Sharing & Rap Recording App

A TikTok-style app where producers upload beats and rappers record video cyphers over them.

## Tech Stack
- **Frontend**: Next.js 14 + React 18
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel (recommended)

---

## Setup Guide (30 minutes)

### Step 1: Create Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Name it `cypher-app`, set a database password, choose a region
4. Wait for it to finish setting up (~2 min)

### Step 2: Set Up Database (5 min)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Paste the entire contents of `supabase/migrations/001_schema.sql`
4. Click "Run" — this creates all your tables, views, and security policies

### Step 3: Set Up Storage Buckets (2 min)

1. Go to **Storage** in the Supabase dashboard
2. Create 3 buckets:
   - `beats` (set to Public)
   - `cyphers` (set to Public)
   - `avatars` (set to Public)

### Step 4: Get Your API Keys (1 min)

1. Go to **Settings > API** in Supabase
2. Copy your **Project URL** and **anon/public key**

### Step 5: Set Up Local Project (5 min)

```bash
# Clone or copy this project folder
cd cypher-app

# Install dependencies
npm install

# Create your env file
cp .env.local.example .env.local
```

Edit `.env.local` and paste your Supabase URL and anon key.

### Step 6: Run Locally (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 7: Deploy to Vercel (5 min)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com), sign in with GitHub
3. Click "Import Project" and select your repo
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click Deploy — you get a live URL!

---

## Project Structure

```
cypher-app/
  src/
    app/              ← Next.js pages (your UI lives here)
    components/       ← Reusable React components
    lib/
      supabase.js     ← All database/auth/storage functions
  supabase/
    migrations/
      001_schema.sql  ← Full database schema
  .env.local.example  ← Environment variables template
  package.json        ← Dependencies
  next.config.js      ← Next.js configuration
```

## Database Tables

| Table      | Purpose                               |
|------------|---------------------------------------|
| profiles   | User accounts (auto-created on signup)|
| beats      | Uploaded beats with audio files       |
| cyphers    | Video recordings over beats           |
| likes      | Star/like system                      |
| comments   | Comments on cyphers                   |
| follows    | Follower/following relationships      |
| feed (view)| Unified feed of beats + cyphers       |

## API Functions (src/lib/supabase.js)

**Auth:**
- `signUp(email, password, username)`
- `signIn(email, password)`
- `signOut()`
- `getUser()`

**Beats:**
- `uploadBeat(file, { title, bpm, key, mood })`
- `getBeats({ mood, search, limit })`

**Cyphers:**
- `uploadCypher(videoFile, { beat_id, title, caption })`

**Feed:**
- `getFeed({ limit, offset })`

**Social:**
- `toggleLike(cypher_id)` — returns true if liked, false if unliked
- `getComments(cypher_id)`
- `addComment(cypher_id, content)`
- `toggleFollow(target_id)`

## What to Build Next

Your current frontend (beat-cypher.jsx) has the full UI. To connect it:

1. **Replace mock data** with real Supabase calls using functions in `supabase.js`
2. **Add auth pages** — sign up / login screens
3. **Wire up uploads** — connect the upload modal to `uploadBeat()`
4. **Wire up recording** — change `DEMO_MODE = false`, use MediaRecorder API to capture video, upload with `uploadCypher()`
5. **Real feed** — replace FEED array with `getFeed()` calls
6. **Real-time** — add Supabase Realtime subscriptions for live like/comment updates

## Environment Variables

| Variable                       | Where to find it               |
|-------------------------------|--------------------------------|
| NEXT_PUBLIC_SUPABASE_URL      | Supabase > Settings > API      |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase > Settings > API      |

## Camera Recording (Production)

In `beat-cypher.jsx`, change:
```js
const DEMO_MODE = true;  // ← change to false
```

The app uses `navigator.mediaDevices.getUserMedia()` for camera access and the `MediaRecorder` API to capture video. This works on all modern mobile browsers when served over HTTPS.
