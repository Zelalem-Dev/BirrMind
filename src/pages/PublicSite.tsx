import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, LineChart, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/brand/Logo.js';

export function PublicSite() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-200">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 text-amber-600" />
              <span className="font-serif font-bold text-xl tracking-tight text-stone-900">BirrMind</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                Sign in
              </Link>
              <Link to="/auth" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all hover:shadow">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-serif font-bold tracking-tight text-stone-900 leading-tight">
            The AI that <span className="text-amber-600 relative inline-block">
              understands
              <svg className="absolute -bottom-2 w-full h-3 text-amber-200 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,10 Q50,20 100,10" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span> your business.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-600 leading-relaxed">
            Mercato AI is a proactive operating system for modern Ethiopian enterprises. We don't just record transactions—we actively analyze, predict, and guide your business to profitability.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" className="px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
              Start Free Trial <Zap className="w-5 h-5 text-amber-400" />
            </Link>
            <a href="#features" className="px-8 py-4 bg-white border border-stone-200 hover:border-amber-300 hover:bg-amber-50 text-stone-800 rounded-xl font-bold text-lg shadow-sm transition-all flex items-center justify-center">
              Explore Features
            </a>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div id="features" className="bg-white py-24 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-stone-900">Not another dashboard. An active partner.</h2>
            <p className="mt-4 text-stone-600 max-w-2xl mx-auto">BirrMind bridges the gap between raw data and actionable intelligence, tailored specifically for the dynamic Ethiopian market.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-stone-50 border border-stone-100 hover:border-amber-200 transition-colors group">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Multimodal AI Copilot</h3>
              <p className="text-stone-600">Speak naturally, snap receipt photos, or type. Mercato AI understands Amharic and English, automatically logging sales, expenses, and inventory movements.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-stone-50 border border-stone-100 hover:border-amber-200 transition-colors group">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LineChart className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Proactive Market Pulse</h3>
              <p className="text-stone-600">Get predictive insights on inventory shortages, optimal pricing adjustments, and local market trends before they impact your bottom line.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-stone-50 border border-stone-100 hover:border-amber-200 transition-colors group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Enterprise-Grade Core</h3>
              <p className="text-stone-600">Built on multi-tenant PostgreSQL with Row-Level Security, ensuring your financial data is isolated, encrypted, and strictly governed by role-based access.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6 text-stone-500" />
            <span className="font-serif font-bold text-lg text-stone-300">BirrMind</span>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} BirrMind Technologies. Crafted for Ethiopian Businesses.
          </div>
        </div>
      </footer>
    </div>
  );
}
