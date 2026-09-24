# BirrMind Deployment Guide

## Local Development
To run the BirrMind Mercato AI locally:
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your keys.
3. Start the dev server: `npm run dev`

## Environment Variables
Create a `.env` file from `.env.example`. The following keys are expected:

| Variable | Where used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend (browser) | Must start with `https://` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend (browser) | Anon/publishable key (starts with `eyJ`) |
| `SUPABASE_URL` | Backend (server) | Same URL as above |
| `SUPABASE_SECRET_KEY` | Backend (server) | Service role key — NEVER exposed to browser |
| `GEMINI_API_KEY` | Backend (server) | Your Google Gemini API key |
| `ADDIS_API_KEY` | Backend (server) | Optional |
| `FAL_KEY` | Backend (server) | Optional |
| `ELEVENLABS_API_KEY` | Backend (server) | Optional |
| `ELEVENLABS_VOICE_ID` | Backend (server) | Optional |
| `PORT` | Backend (server) | Automatically set by Render to `10000` |

> **Important:** Vite bakes `VITE_*` variables into the frontend bundle **at build time**.
> This means they must be set in Render's Environment Variables tab **before** the build runs.

## GitHub
- Repository: Push to the `main` branch.
- `.env` is in `.gitignore` — secrets are never committed.

## Render Deployment

### Step 1: Create a Web Service
1. Go to [Render](https://render.com/) → **New → Web Service**.
2. Connect your GitHub repository.

### Step 2: Configure Build & Start
Set these **exactly** in the Render dashboard:

| Setting | Value |
|---|---|
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Publish Directory** | *(leave blank — not applicable for Web Services, only Static Sites)* |

> **Note:** "Publish Directory" is only for Render **Static Sites**. This app is a **Web Service**
> (Node.js server). The `npm run start` command runs `node dist/server.cjs` which serves
> the built `dist/` folder automatically. Do NOT use the "Static Site" deploy type.

### Step 3: Set Environment Variables in Render
In the Render dashboard → your service → **Environment** tab, add:

```
NODE_ENV=production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...your anon key...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=eyJ...your service role key...
GEMINI_API_KEY=your-gemini-key
```

### Step 4: Deploy
Click **"Manual Deploy" → "Clear build cache & deploy"** to ensure a fresh build with the new env vars.

## Supabase Auth Configuration
Once the Render URL is live (e.g., `https://birrmind.onrender.com`):
1. Go to Supabase Dashboard → **Authentication → URL Configuration**.
2. Set **Site URL** to `https://birrmind.onrender.com`.
3. Add `https://birrmind.onrender.com/**` to the **Redirect URLs** list.

## Verifying the Deployment
1. Visit `https://birrmind.onrender.com/api/health` — should return `{"status":"ok"}`.
2. Open browser DevTools → **Console** tab — should show no red errors.
3. Open browser DevTools → **Network** tab — `index-*.js` and `index-*.css` should return **200 OK**.
