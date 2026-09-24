# BIRRMIND & MERCATO AI — MANUAL ACTIONS REQUIRED
**Audience:** Platform Administrator / Project Owner  
**Date:** September 2026  

> [!IMPORTANT]
> **Zero Secrets in Chat:** Do NOT paste private API keys, passwords, or secret service tokens into this AI chat. All configuration must be performed directly in your external provider dashboards as described below.

The application codebase and database schema are fully built and compiled. To bring the live Render production environment into full operational readiness, complete the following manual configuration steps.

---

## 1. Render Dashboard Environment Variables

Navigate to: **[Render Dashboard](https://dashboard.render.com/)** → Select your Web Service (`birrmind` or `mercato-ai`) → **Environment** tab.

Ensure the following environment variables are configured:

| Variable Name | Required Value / Source | Description |
|---|---|---|
| `PORT` | `3000` | Port for the Express backend server. |
| `NODE_ENV` | `production` | Enables production optimizations and disables debug mocks. |
| `VITE_SUPABASE_URL` | `https://ruleyybocwlliqornkcq.supabase.co` | Your Supabase Project URL (Client-facing). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | *(Your Supabase `anon` / `public` Key)* | Found in Supabase Settings → API Keys → `anon public`. |
| `SUPABASE_URL` | `https://ruleyybocwlliqornkcq.supabase.co` | Supabase Project URL for the backend server. |
| `SUPABASE_SECRET_KEY` | *(Your Supabase `service_role` or secret Key)* | Found in Supabase Settings → API Keys → `service_role secret`. Needed for backend queries bypassing RLS. |
| `GEMINI_API_KEY` | *(Your Google AI Studio API Key)* | Generated from [Google AI Studio](https://aistudio.google.com/). Powers Mercato AI & Receipt Vision. |
| `ELEVENLABS_API_KEY` | *(Optional - ElevenLabs API Key)* | Generated from [ElevenLabs Dashboard](https://elevenlabs.io/). Powers natural audio voice responses. |
| `ADDIS_AI_API_KEY` | *(Optional - Addis AI Key)* | External provider for Ethiopian regional NLP models. |

> [!TIP]
> After saving changes in the Render Environment tab, Render will automatically trigger a new deployment.

---

## 2. Render Build & Service Configuration Settings

In your Render Service Settings:
- **Build Command:** `npm run build`
- **Start Command:** `node dist/server.cjs`
- **Auto-Deploy:** `Yes` (Triggered on git push to the `main` branch).

---

## 3. Supabase Dashboard Authentication Settings

Navigate to: **[Supabase Dashboard](https://supabase.com/dashboard/project/ruleyybocwlliqornkcq)** → **Authentication** → **URL Configuration**.

1. **Site URL:**
   - Set to: `https://birrmind.onrender.com`
2. **Redirect URLs:**
   - Add: `https://birrmind.onrender.com`
   - Add: `https://birrmind.onrender.com/`
   - Add: `https://birrmind.onrender.com/app`
   - Add: `https://birrmind.onrender.com/onboarding`
   - Add: `http://localhost:5173` (for local development)
   - Add: `http://localhost:3000` (for local production test)
3. **Email Auth Provider:**
   - Under **Authentication** → **Providers** → **Email**:
   - Ensure **Enable Email provider** is toggled ON.
   - For frictionless testing of new accounts, you may temporarily toggle **Confirm email** OFF (or leave ON if using production SMTP).

---

## 4. Supabase Storage Bucket Verification

Navigate to: **[Supabase Dashboard](https://supabase.com/dashboard/project/ruleyybocwlliqornkcq)** → **Storage**.

1. Verify that the following two buckets exist:
   - `receipts` (Used for customer receipt scans)
   - `products` (Used for catalog images)
2. If they do not exist:
   - Click **"New Bucket"**.
   - Name: `receipts` → Toggle **Public bucket** ON (or configure authenticated RLS access) → Click **Save**.
   - Name: `products` → Toggle **Public bucket** ON → Click **Save**.

---

## 5. Git Commit & Push to Trigger Live Deployment

To deploy all the latest architectural fixes, onboarding wizards, voice modules, and clean navigation to the live Render site:

Run the following commands in your local terminal:
```bash
git add .
git commit -m "feat: complete BirrMind master audit fixes, onboarding wizard, Mercato AI tab, and clean navigation"
git push origin main
```

Once pushed, Render will detect the commit, run `npm run build`, and launch the updated application at `https://birrmind.onrender.com`.

---

## 6. Live Verification Checklist (Post-Deployment)

Once Render finishes deploying:
1. Open `https://birrmind.onrender.com/api/health` in your browser.
   - Verify it returns: `{"status": "ok", "database": {"engine": "supabase_postgresql", "configured": true}}`.
2. Visit `https://birrmind.onrender.com/` in an incognito window.
3. Click **"Get Started"** and sign up with a new email address.
4. Verify that you are taken directly to the **Onboarding Wizard** (`/onboarding`).
5. Complete the 7-step wizard and verify you land on your personalized dashboard with your business name and ETB currency displayed.
6. Record a test sale and test a voice input sale to confirm end-to-end functionality.
