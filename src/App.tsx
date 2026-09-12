import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Database,
  Building2,
  ShieldCheck,
  RotateCcw
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
} from './types/index.js';
import { api, setApiContext } from './lib/api.js';
import { ShellHeader } from './components/layout/ShellHeader.js';
import { OverviewTab } from './components/dashboard/OverviewTab.js';
import { RecordSaleTab } from './components/pos/RecordSaleTab.js';
import { InventoryLedgerTab } from './components/inventory/InventoryLedgerTab.js';
import { ExpensesTab } from './components/expenses/ExpensesTab.js';
import { EventsAuditTab } from './components/events/EventsAuditTab.js';
import { TeamTab } from './components/team/TeamTab.js';

// Pre-seeded multi-tenant demo users for switching RBAC roles
const DEMO_USERS = [
  { id: 'user_marco', name: 'Marco Rossi', role: 'Owner', email: 'marco@mercatopantry.com' },
  { id: 'user_elena', name: 'Elena Bianchi', role: 'Manager', email: 'elena@mercatopantry.com' },
  { id: 'user_matteo', name: 'Matteo Conti', role: 'Staff', email: 'matteo@mercatopantry.com' },
];

export default function App() {
  const [currentUserId, setCurrentUserId] = useState<string>('user_marco');
  const [currentBusinessId, setCurrentBusinessId] = useState<string>('biz_mercato_pantry');
  const [state, setState] = useState<BusinessStateSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = async (userId = currentUserId, businessId = currentBusinessId) => {
    try {
      setError(null);
      setApiContext(userId, businessId);
      const snapshot = await api.getState(userId, businessId);
      setState(snapshot);
    } catch (err: any) {
      console.error('Failed to load state:', err);
      setError(err.message || 'Unable to connect to Mercato server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentUserId, currentBusinessId);
  }, [currentUserId, currentBusinessId]);

  const handleSelectBusiness = (newBizId: string) => {
    setCurrentBusinessId(newBizId);
    showToast(`Switched active business to ${newBizId}`);
  };

  const handleSelectUser = (newUserId: string) => {
    setCurrentUserId(newUserId);
    const user = DEMO_USERS.find(u => u.id === newUserId);
    showToast(`Switched user context to ${user?.name || newUserId} (${user?.role})`);
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
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center text-white font-serif font-bold text-2xl shadow-md mb-4 animate-pulse">
          M
        </div>
        <p className="font-serif font-bold text-lg text-stone-800">Initializing Mercato AI Foundation...</p>
        <p className="text-xs text-stone-500 mt-1">Connecting to Multi-Tenant PostgreSQL Repository</p>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-rose-200 p-6 max-w-md w-full shadow-lg text-center">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="font-serif font-bold text-lg text-stone-900">Connection Error</h2>
          <p className="text-xs text-stone-600 mt-2">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Retry Connection
          </button>
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
            onRefresh={() => loadData()}
          />
        )}

        {activeTab === 'pos' && (
          <RecordSaleTab
            business={state.business}
            products={state.products}
            transactions={state.transactions}
            onSaleCompleted={() => {
              loadData();
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
              loadData();
              showToast('Inventory updated');
            }}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            business={state.business}
            membership={state.membership}
            expenses={state.expenses}
            onExpenseLogged={() => {
              loadData();
              showToast('Expense recorded in ledger');
            }}
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
              loadData();
              showToast('Team membership granted');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-800">Mercato AI</span>
            <span>• Phase 1 Multi-Tenant PostgreSQL Foundation</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Database: {state.databaseEngine}</span>
            <span>RLS: Enabled</span>
            <span>Tenant: {state.business.id}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
