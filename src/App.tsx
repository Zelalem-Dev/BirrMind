import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { PublicSite } from './pages/PublicSite.js';
import { Auth } from './pages/Auth.js';
import { Dashboard } from './pages/Dashboard.js';
import { Onboarding } from './pages/Onboarding.js';
import { supabase, isSupabaseReady } from './lib/supabaseClient.js';
import { api, setAuthToken } from './lib/api.js';

/** Resolves whichever comes first: the promise or the timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/** Protected route wrapper that checks if business onboarding is needed */
function AuthenticatedGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('birrmind_demo_mode') === 'true';
    if (isDemo) {
      setHasBusiness(true);
      setChecking(false);
      return;
    }

    api.getMe()
      .then((res) => {
        if (!isMounted) return;
        if (res?.accessibleBusinesses && res.accessibleBusinesses.length > 0) {
          setHasBusiness(true);
        } else {
          setHasBusiness(false);
        }
      })
      .catch((err) => {
        console.warn('[AuthenticatedGate] could not fetch businesses:', err);
        // If error, don't trap the user in limbo
        setHasBusiness(true);
      })
      .finally(() => {
        if (isMounted) setChecking(false);
      });

    return () => { isMounted = false; };
  }, [location.pathname]);

  if (checking) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
        <p className="text-xs font-medium text-stone-500">Loading your workspace...</p>
      </div>
    );
  }

  // If user has no business and is trying to access /app, send to /onboarding
  if (!hasBusiness && location.pathname.startsWith('/app')) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user already has a business and visits /onboarding, send to /app
  if (hasBusiness && location.pathname === '/onboarding') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [demoActive, setDemoActive] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('birrmind_demo_mode') === 'true';
  });

  useEffect(() => {
    if (!supabase || !isSupabaseReady) {
      setLoading(false);
      return;
    }

    withTimeout(supabase.auth.getSession(), 5000)
      .then((result) => {
        if (result?.data?.session) {
          setSession(result.data.session);
          setAuthToken(result.data.session.access_token);
        }
      })
      .catch((err) => {
        console.warn('[App] getSession failed, treating user as unauthenticated:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthToken(newSession?.access_token || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setDemoActive(localStorage.getItem('birrmind_demo_mode') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
        <p className="text-sm text-stone-500">Connecting…</p>
      </div>
    );
  }

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
          path="/onboarding"
          element={
            isAuthenticated ? (
              <AuthenticatedGate>
                <Onboarding />
              </AuthenticatedGate>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/app/*"
          element={
            isAuthenticated ? (
              <AuthenticatedGate>
                <Dashboard />
              </AuthenticatedGate>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
