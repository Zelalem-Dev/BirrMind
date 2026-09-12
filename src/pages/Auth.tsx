import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from '../components/brand/Logo.js';
import { supabase } from '../lib/supabaseClient.js';
// Fallback for development if Supabase isn't configured
import { DEMO_USERS } from './Dashboard.js';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        // Fallback for local sandbox without Supabase keys
        console.warn('Supabase not configured, falling back to local demo login');
        // Just navigate to app (which defaults to marco)
        navigate('/app');
        return;
      }

      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        // Proceed to app or show confirmation
        navigate('/app');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo className="w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-center text-3xl font-serif font-bold tracking-tight text-stone-900">
          Welcome to BirrMind
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          {mode === 'signin' ? 'Sign in to your business' : 'Register your business'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-stone-200">
          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-stone-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 p-2.5 border bg-stone-50"
                  placeholder="admin@mercatopantry.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 p-2.5 border bg-stone-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-stone-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="w-full inline-flex justify-center py-2 px-4 border border-stone-300 rounded-lg shadow-sm bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                {mode === 'signin' ? 'Create a new account' : 'Sign in to existing account'}
              </button>
            </div>
            
            {!supabase && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-center">
                <strong>Demo Mode Active:</strong> Supabase keys not found in environment. Any login will bypass authentication.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
