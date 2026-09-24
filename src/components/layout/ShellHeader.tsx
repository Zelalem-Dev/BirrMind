import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Store,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Crown,
  LogOut,
  User as UserIcon,
  Settings,
  HelpCircle,
  TrendingUp,
  ShoppingCart,
  Package,
  CreditCard,
  Bot,
  Activity,
  Users
} from 'lucide-react';
import { User, Business, BusinessMembership, MembershipRole } from '../../types/index.js';
import { Logo } from '../brand/Logo.js';
import { supabase } from '../../lib/supabaseClient.js';

interface ShellHeaderProps {
  currentBusiness: Business;
  currentUser: User;
  currentMembership?: BusinessMembership | null;
  accessibleBusinesses: { business: Business; role: MembershipRole }[];
  allUsers: { id: string; name: string; role: string; email: string }[];
  databaseEngine: 'supabase' | 'local_postgres_compatible';
  onSelectBusiness: (businessId: string) => void;
  onSelectUser: (userId: string) => void;
  onResetDemo: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpgrade?: () => void;
  onOpenSettings?: () => void;
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
  onOpenUpgrade,
  onOpenSettings,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDemo = typeof window !== 'undefined' && localStorage.getItem('birrmind_demo_mode') === 'true';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('birrmind_demo_mode');
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    window.location.href = '/';
  };

  const getRoleBadge = (role?: MembershipRole) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'staff':
        return 'bg-stone-100 text-stone-700 border-stone-300';
      default:
        return 'bg-stone-800 text-stone-400 border-stone-700';
    }
  };

  const userInitials = (currentUser.fullName || 'User')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navTabs = [
    { id: 'overview', label: 'Home', icon: Store },
    { id: 'pos', label: 'Sales', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'market-pulse', label: 'Market Pulse', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: CreditCard },
    { id: 'copilot', label: 'Mercato AI', icon: Bot },
    { id: 'events', label: 'Activity Log', icon: Activity },
    { id: 'team', label: 'Team & Settings', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 gap-3">
          {/* Brand & Business Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
              <Logo size="sm" variant="light" showText={false} />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-serif font-bold text-base tracking-tight text-white">
                    BirrMind
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                    Mercato AI
                  </span>
                </div>
              </div>
            </div>

            {/* Business Selector (only if multiple accessible businesses) */}
            {accessibleBusinesses.length > 1 ? (
              <div className="flex items-center bg-stone-800 rounded-lg p-1 border border-stone-700">
                <Store className="w-3.5 h-3.5 text-stone-400 ml-1.5 mr-1" />
                <select
                  id="business-select"
                  value={currentBusiness.id}
                  onChange={(e) => onSelectBusiness(e.target.value)}
                  className="bg-transparent text-xs text-stone-200 font-medium pr-5 py-0.5 focus:outline-none cursor-pointer"
                >
                  {accessibleBusinesses.map((item) => (
                    <option key={item.business.id} value={item.business.id} className="bg-stone-900 text-stone-100">
                      {item.business.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-stone-800/80 rounded-lg border border-stone-700/80 text-xs text-stone-300">
                <Store className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium truncate max-w-[140px]">{currentBusiness.name}</span>
              </div>
            )}
          </div>

          {/* Right Controls: Upgrade button, Demo Switcher (if demo), User Avatar */}
          <div className="flex items-center gap-2.5">
            {/* Demo User Switcher (only shown in development demo mode) */}
            {isDemo && (
              <div className="hidden md:flex items-center bg-stone-800 rounded-lg p-1 border border-amber-500/40">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-1" />
                <select
                  id="user-select"
                  value={currentUser.id}
                  onChange={(e) => onSelectUser(e.target.value)}
                  className="bg-transparent text-xs text-amber-200 font-medium pr-4 py-0.5 focus:outline-none cursor-pointer"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-stone-900 text-stone-100">
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                <button
                  onClick={onResetDemo}
                  title="Reset demo seed database"
                  className="p-1 hover:bg-stone-700 rounded text-stone-400 hover:text-stone-200 ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Upgrade Subscription CTA */}
            <button
              id="upgrade-subscription-btn"
              onClick={onOpenUpgrade}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-100" />
              <span>Upgrade</span>
            </button>

            {/* User Profile Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-profile-menu-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-stone-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center border border-amber-500 shadow-xs">
                    {userInitials}
                  </div>
                )}
                <ChevronDown className="w-3 h-3 text-stone-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-stone-900 rounded-xl shadow-xl border border-stone-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-stone-100">
                    <p className="text-xs font-bold text-stone-900 truncate">{currentUser.fullName}</p>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">{currentUser.email}</p>
                    <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border mt-2 ${getRoleBadge(currentMembership?.role)}`}>
                      {currentMembership?.role || 'Member'}
                    </span>
                  </div>

                  <div className="py-1 text-xs">
                    <button
                      onClick={() => { setProfileOpen(false); setActiveTab('team'); }}
                      className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2.5 text-stone-700"
                    >
                      <Settings className="w-3.5 h-3.5 text-stone-500" />
                      <span>Business Settings</span>
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); onOpenUpgrade?.(); }}
                      className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2.5 text-stone-700"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>Subscription & Plan</span>
                    </button>
                  </div>

                  <div className="border-t border-stone-100 py-1 text-xs">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 border-t border-stone-800 pt-1 overflow-x-auto scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-500 font-semibold'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
