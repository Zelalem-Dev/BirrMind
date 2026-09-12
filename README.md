<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# BirrMind

**BirrMind** is the AI operating system and platform designed for Ethiopian small businesses.
**Mercato AI** is the AI business companion inside BirrMind, serving as the core intelligence engine for Copilot, analytics, and automation.

## Core Technology
- **Backend:** Node.js, Express, TypeScript
- **Frontend:** React, Vite, TailwindCSS
- **Database & Auth:** Supabase (PostgreSQL with RLS)
- **AI Integrations:** Gemini (Business Brain), Addis AI (Amharic & local STT/TTS), fal.ai (Receipt Vision), ElevenLabs (English TTS)

For full deployment and configuration instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Local Development

**Prerequisites:** Node.js


1. Install dependencies:
   `npm install`

2. Copy `.env.example` to `.env`:
   `cp .env.example .env`

3. Set up the environment variables in `.env`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key

# Required for AI Features
GEMINI_API_KEY=your_gemini_api_key

# Optional Integrations
ADDIS_API_KEY=your_addis_api_key
FAL_KEY=your_fal_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

4. Run the app:
   `npm run dev`
