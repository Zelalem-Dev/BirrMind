import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Store,
  Sparkles,
  Bot
} from 'lucide-react';
import {
  Business,
  User,
  BusinessMembership,
  Product,
  Transaction,
  Expense,
  InventoryMovement,
  BusinessEvent,
  BusinessHealth,
  BusinessStateSnapshot,
  MembershipRole
} from '../types/index.js';
import { api, setApiContext } from '../lib/api.js';
import { ShellHeader } from '../components/layout/ShellHeader.js';
import { OverviewTab } from '../components/dashboard/OverviewTab.js';
import { RecordSaleTab } from '../components/pos/RecordSaleTab.js';
import { InventoryLedgerTab } from '../components/inventory/InventoryLedgerTab.js';
import { ExpensesTab } from '../components/expenses/ExpensesTab.js';
import { EventsAuditTab } from '../components/events/EventsAuditTab.js';
import { TeamTab } from '../components/team/TeamTab.js';
import { MarketPulseTab } from '../components/dashboard/MarketPulseTab.js';
import { MercatoAITab } from '../components/dashboard/MercatoAITab.js';
import { CopilotDrawer } from '../components/copilot/CopilotDrawer.js';
import { SubscriptionModal } from '../components/billing/SubscriptionModal.js';
import { Logo } from '../components/brand/Logo.js';

// Pre-seeded multi-tenant demo users for switching RBAC roles in development demo mode
export const DEMO_USERS = [
  { id: 'user_marco', name: 'Marco Rossi', role: 'Owner', email: 'marco@mercatopantry.com' },
  { id: 'user_elena', name: 'Elena Bianchi', role: 'Manager', email: 'elena@mercatopantry.com' },
  { id: 'user_matteo', name: 'Matteo Conti', role: 'Staff', email: 'matteo@mercatopantry.com' },
];

export function Dashboard() {
  const isDemo = typeof window !== 'undefined' && localStorage.getItem('birrmind_demo_mode') === 'true';

  const [currentUserId, setCurrentUserId] = useState<string>(isDemo ? 'user_marco' : '');
  const [currentBusinessId, setCurrentBusinessId] = useState<string>(isDemo ? 'biz_mercato_pantry' : '');
  const [state, setState] = useState<BusinessStateSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);
  const [isCopilotDrawerOpen, setIsCopilotDrawerOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = async (userId: string, businessId: string) => {
    if (!userId || !businessId) return;
    try {
      setError(null);
      setApiContext(userId, businessId);
      const snapshot = await api.getState(userId, businessId);
      setState(snapshot);
    } catch (err: any) {
      console.error('Failed to load state:', err);
      setState(null);
      setError(err.message || 'Unable to connect to BirrMind workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initWorkspace = async () => {
      try {
        const isDemoActive = typeof window !== 'undefined' && localStorage.getItem('birrmind_demo_mode') === 'true';

        if (!isDemoActive) {
          const me = await api.getMe();
          if (!isMounted) return;

          if (me.user?.id) {
            setCurrentUserId(me.user.id);
          }

          if (me.accessibleBusinesses && me.accessibleBusinesses.length > 0) {
            const targetBiz = me.defaultBusinessId || me.accessibleBusinesses[0].business.id;
            setCurrentBusinessId(targetBiz);
            loadData(me.user.id, targetBiz);
            return;
          }
        }

        // Demo mode or fallback
        const demoUid = currentUserId || 'user_marco';
        const demoBizId = currentBusinessId || 'biz_mercato_pantry';
        setCurrentUserId(demoUid);
        setCurrentBusinessId(demoBizId);
        loadData(demoUid, demoBizId);
      } catch (err: any) {
        console.warn('Workspace initialization note:', err);
        const fallbackUid = currentUserId || 'user_marco';
        const fallbackBizId = currentBusinessId || 'biz_mercato_pantry';
        loadData(fallbackUid, fallbackBizId);
      }
    };

    initWorkspace();
    return () => { isMounted = false; };
  }, []);

  const handleSelectBusiness = (newBizId: string) => {
    setCurrentBusinessId(newBizId);
    loadData(currentUserId, newBizId);
    showToast(`Switched workspace to ${newBizId}`);
  };

  const handleSelectUser = async (newUserId: string) => {
    setCurrentUserId(newUserId);
    const demoUser = DEMO_USERS.find(u => u.id === newUserId);
    try {
      const me = await api.getMe(newUserId);
      const hasAccess = me.accessibleBusinesses.some(b => b.business.id === currentBusinessId);
      if (!hasAccess && me.accessibleBusinesses.length > 0) {
        const fallbackBizId = me.defaultBusinessId || me.accessibleBusinesses[0].business.id;
        setCurrentBusinessId(fallbackBizId);
        loadData(newUserId, fallbackBizId);
        showToast(`Switched to ${demoUser?.name || newUserId} (${demoUser?.role})`);
        return;
      }
    } catch {
      // Fall through
    }
    loadData(newUserId, currentBusinessId);
    showToast(`Switched user context to ${demoUser?.name || newUserId} (${demoUser?.role})`);
  };

  const handleResetDemo = async () => {
    try {
      setLoading(true);
      await api.resetDemoData(currentUserId, currentBusinessId);
      await loadData(currentUserId, currentBusinessId);
      showToast('Sample demo database reset successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset demo data', 'alert');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !state) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <img
          src="/assets/logo-icon.png"
          alt="BirrMind Logo"
          className="h-16 w-auto object-contain mb-4 animate-pulse"
          style={{ aspectRatio: '153 / 177' }}
        />
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="font-serif font-bold text-xl text-stone-900">BirrMind</span>
          <span className="font-sans font-bold text-xs uppercase tracking-wider text-amber-600">MERCATO AI</span>
        </div>
        <p className="text-xs text-stone-500">Connecting to your business workspace</p>
      </div>
    );
  }

  if (error && !state) {
    const isTenantDenied = error.includes('Forbidden') || error.includes('TENANT_ACCESS_DENIED') || error.includes('not an authorized member');
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-md w-full shadow-lg text-center">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h2 className="font-serif font-bold text-lg text-stone-900">
            {isTenantDenied ? 'Workspace Access Protected' : 'Connection Notice'}
          </h2>
          <p className="text-xs text-stone-600 mt-2 leading-relaxed">{error}</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
            {isTenantDenied ? (
              <button
                onClick={() => {
                  if (state?.accessibleBusinesses && state.accessibleBusinesses.length > 0) {
                    handleSelectBusiness(state.accessibleBusinesses[0].business.id);
                  } else {
                    window.location.href = '/onboarding';
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Go to My Business
              </button>
            ) : (
              <button
                onClick={() => loadData(currentUserId, currentBusinessId)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!state) return null;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-stone-900 text-stone-100 border-stone-800'
                : 'bg-rose-900 text-rose-100 border-rose-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Multi-Tenant Shell Header */}
      <ShellHeader
        currentBusiness={state.business}
        currentUser={state.user}
        currentMembership={state.membership}
        accessibleBusinesses={state.accessibleBusinesses}
        allUsers={DEMO_USERS}
        databaseEngine={state.databaseEngine}
        onSelectBusiness={handleSelectBusiness}
        onSelectUser={handleSelectUser}
        onResetDemo={handleResetDemo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
        onOpenSettings={() => setActiveTab('team')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            business={state.business}
            user={state.user}
            membership={state.membership}
            health={state.health}
            events={state.events}
            onNavigateTab={setActiveTab}
            onRefresh={() => loadData(currentUserId, currentBusinessId)}
          />
        )}

        {activeTab === 'pos' && (
          <RecordSaleTab
            business={state.business}
            products={state.products}
            transactions={state.transactions}
            onSaleCompleted={() => {
              loadData(currentUserId, currentBusinessId);
              showToast('Sale successfully processed and inventory updated');
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryLedgerTab
            business={state.business}
            membership={state.membership}
            products={state.products}
            movements={state.movements}
            onDataChanged={() => {
              loadData(currentUserId, currentBusinessId);
              showToast('Inventory updated');
            }}
          />
        )}

        {activeTab === 'market-pulse' && (
          <MarketPulseTab business={state.business} />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            business={state.business}
            membership={state.membership}
            expenses={state.expenses}
            onExpenseLogged={() => {
              loadData(currentUserId, currentBusinessId);
              showToast('Expense recorded in ledger');
            }}
          />
        )}

        {activeTab === 'copilot' && (
          <MercatoAITab
            business={state.business}
            user={state.user}
            health={state.health}
            products={state.products}
            onNavigateTab={setActiveTab}
            onRefreshData={() => loadData(currentUserId, currentBusinessId)}
          />
        )}

        {activeTab === 'events' && (
          <EventsAuditTab
            business={state.business}
            events={state.events}
          />
        )}

        {activeTab === 'team' && (
          <TeamTab
            business={state.business}
            currentUser={state.user}
            currentMembership={state.membership}
            memberships={state.memberships}
            databaseEngine={state.databaseEngine}
            onMemberAdded={() => {
              loadData(currentUserId, currentBusinessId);
              showToast('Team membership granted');
            }}
          />
        )}
      </main>

      {/* Floating Mercato AI Quick Assistant Button */}
      {activeTab !== 'copilot' && (
        <button
          id="floating-mercato-ai-btn"
          onClick={() => setIsCopilotDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full shadow-2xl flex items-center gap-2.5 border border-stone-700 transition-all hover:scale-105 active:scale-95 group"
          title="Ask Mercato AI anytime"
        >
          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            M
          </div>
          <span className="text-xs font-bold tracking-tight">Ask Mercato AI</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Globally Accessible Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotDrawerOpen}
        onClose={() => setIsCopilotDrawerOpen(false)}
        business={state.business}
        user={state.user}
      />

      {/* Subscription & Upgrade Modal */}
      <SubscriptionModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        business={state.business}
      />

      {/* Clean User-Facing SaaS Footer (No Developer Jargon) */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center">
            <Logo size="sm" variant="dark" layout="inline" />
          </div>
          <div className="text-[11px] text-stone-400">
            Intelligent operating companion for Ethiopian small businesses • © 2026 BirrMind
          </div>
        </div>
      </footer>
    </div>
  );
}
