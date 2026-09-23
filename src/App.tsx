import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicSite } from './pages/PublicSite.js';
import { Auth } from './pages/Auth.js';
import { Dashboard } from './pages/Dashboard.js';
import { supabase, isSupabaseReady } from './lib/supabaseClient.js';

/** Resolves whichever comes first: the promise or the timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured at all, skip session check immediately.
    if (!supabase || !isSupabaseReady) {
      setLoading(false);
      return;
    }

    // Fetch the current session with a 5-second timeout.
    // If Render is cold-starting and Supabase responds slowly, we still
    // render the /auth page instead of hanging on "Loading..." forever.
    withTimeout(supabase.auth.getSession(), 5000)
      .then((result) => {
        if (result?.data?.session) {
          setSession(result.data.session);
        }
      })
      .catch((err) => {
        console.warn('[App] getSession failed, treating user as unauthenticated:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Keep session in sync with Supabase auth events (sign in, sign out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
        <p className="text-sm text-stone-500">Connecting…</p>
      </div>
    );
  }

  const [demoActive, setDemoActive] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('birrmind_demo_mode') === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      setDemoActive(localStorage.getItem('birrmind_demo_mode') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Authenticated if there is an active Supabase session or demo mode is active.
  const isAuthenticated = Boolean(session || demoActive);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to="/app" replace /> : <Auth />}
        />
        <Route
          path="/app/*"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
