# BirrMind Deployment Guide

## Local Development
To run the BirrMind Mercato AI locally:
1. `npm install`
2. Ensure you have the required environment variables in your `.env` file (see below).
3. Start the dev server: `npm run dev`

## Environment Variables
Create a `.env` file from `.env.example`. The following keys are expected:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `GEMINI_API_KEY`
- `ADDIS_API_KEY` (Optional)
- `FAL_KEY` (Optional)
- `ELEVENLABS_API_KEY` (Optional)
- `ELEVENLABS_VOICE_ID` (Optional)
- `PORT` (Provided automatically by Render)

## GitHub
- Repository: Make sure to push to the primary branch `main`.
- NO SECRETS should ever be committed to the codebase. Ensure `.env` is listed in `.gitignore`.

## Render Deployment
1. Go to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
4. Add all environment variables from your local `.env` into the Render Environment Variables tab.

## Supabase Auth Configuration
Once the Render URL is generated (e.g., `https://birrmind.onrender.com`):
1. Go to your Supabase Dashboard -> Authentication -> URL Configuration.
2. Set your **Site URL** to your Render URL.
3. Add the Render URL to the **Redirect URLs** list.

## Production Verification
- The production server serves the frontend statically from the `dist/` directory and exposes the API on the same port.
- Health Check: Verify `GET /api/health` returns `{"status":"ok"}`.
- Authentication should require actual login in production, falling back to demo users is strictly disabled.
