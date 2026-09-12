import React from 'react';
import {
  Building2,
  ShieldCheck,
  Database,
  Users,
  ChevronDown,
  RotateCcw,
  Store,
  Layers
} from 'lucide-react';
import { User, Business, BusinessMembership, MembershipRole } from '../../types/index.js';

interface ShellHeaderProps {
  currentBusiness: Business;
  currentUser: User;
  currentMembership: BusinessMembership;
  accessibleBusinesses: { business: Business; role: MembershipRole }[];
  allUsers: { id: string; name: string; role: string; email: string }[];
  databaseEngine: 'supabase' | 'local_postgres_compatible';
  onSelectBusiness: (businessId: string) => void;
  onSelectUser: (userId: string) => void;
  onResetDemo: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({
  currentBusiness,
  currentUser,
  currentMembership,
  accessibleBusinesses,
  allUsers,
  databaseEngine,
  onSelectBusiness,
  onSelectUser,
  onResetDemo,
  activeTab,
  setActiveTab,
}) => {
  const getRoleBadge = (role: MembershipRole) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'staff':
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top Bar: Brand, Tenant Selector, User RBAC Selector, Database Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          {/* Logo & Business Brand */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-amber-50 shadow font-serif font-bold text-lg">
                M
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-semibold text-lg tracking-tight text-stone-100">
                    Mercato AI
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    Phase 1: Foundation
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">Multi-Tenant PostgreSQL Architecture</p>
              </div>
            </div>

            {/* Supabase status badge on mobile */}
            <div className="md:hidden flex items-center gap-1.5 text-xs text-stone-300 bg-stone-800 px-2 py-1 rounded">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{databaseEngine === 'supabase' ? 'Supabase' : 'Local Postgres'}</span>
            </div>
          </div>

          {/* Center/Right Controls: Business Switcher, User Switcher, DB pill */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Business (Tenant) Switcher */}
            <div className="flex items-center bg-stone-800 rounded-lg p-1 border border-stone-700">
              <Store className="w-3.5 h-3.5 text-stone-400 ml-2 mr-1.5" />
              <label htmlFor="business-select" className="sr-only">Active Business</label>
              <select
                id="business-select"
                value={currentBusiness.id}
                onChange={(e) => onSelectBusiness(e.target.value)}
                className="bg-transparent text-xs text-stone-200 font-medium pr-6 py-1 focus:outline-none cursor-pointer"
              >
                {accessibleBusinesses.map((item) => (
                  <option key={item.business.id} value={item.business.id} className="bg-stone-900 text-stone-100">
                    {item.business.name} ({item.role})
                  </option>
                ))}
              </select>
            </div>

            {/* User (RBAC Role) Switcher */}
            <div className="flex items-center bg-stone-800 rounded-lg p-1 border border-stone-700">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 ml-2 mr-1.5" />
              <label htmlFor="user-select" className="sr-only">Current User Role</label>
              <select
                id="user-select"
                value={currentUser.id}
                onChange={(e) => onSelectUser(e.target.value)}
                className="bg-transparent text-xs text-stone-200 font-medium pr-6 py-1 focus:outline-none cursor-pointer"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-stone-900 text-stone-100">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ml-1 ${getRoleBadge(currentMembership.role)}`}>
                {currentMembership.role}
              </span>
            </div>

            {/* Database Engine Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-stone-800/80 border border-stone-700 text-stone-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{databaseEngine === 'supabase' ? 'Supabase Live' : 'PostgreSQL Compatible'}</span>
            </div>

            {/* Reset Seed Data Button */}
            <button
              id="reset-demo-btn"
              onClick={onResetDemo}
              title="Reset sample seed database"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 border-t border-stone-800 pt-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'pos', label: 'Record Sale (POS)' },
            { id: 'inventory', label: 'Inventory & Movement Ledger' },
            { id: 'expenses', label: 'Operating Expenses' },
            { id: 'events', label: 'Business Events Log' },
            { id: 'team', label: 'Tenant & RBAC Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-500 font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
