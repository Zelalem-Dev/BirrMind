import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicSite } from './pages/PublicSite.js';
import { Auth } from './pages/Auth.js';
import { Dashboard } from './pages/Dashboard.js';
import { supabase } from './lib/supabaseClient.js';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-stone-100 flex items-center justify-center">Loading...</div>;
  }

  // If supabase isn't configured, we allow access to everything for the local sandbox
  const isAuthenticated = !supabase || !!session;

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
