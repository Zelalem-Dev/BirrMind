import React from 'react';
import {
  DollarSign,
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  ArrowUpRight,
  ShoppingCart,
  Receipt,
  RotateCw,
  Clock,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { Business, BusinessHealth, BusinessEvent, User, BusinessMembership } from '../../types/index.js';

interface OverviewTabProps {
  business: Business;
  user: User;
  membership: BusinessMembership;
  health: BusinessHealth;
  events: BusinessEvent[];
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  business,
  user,
  membership,
  health,
  events,
  onNavigateTab,
  onRefresh,
}) => {
  const getVerdictBadge = (verdict: BusinessHealth['verdict']) => {
    switch (verdict) {
      case 'thriving':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Thriving Pace' };
      case 'stable':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Stable Operations' };
      case 'attention_needed':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Attention Advised' };
      case 'at_risk':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Action Required' };
    }
  };

  const getEventSeverityColor = (severity: string) => {
    switch (severity) {
      case 'positive':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'critical':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      default:
        return 'text-stone-600 bg-stone-50 border-stone-200';
    }
  };

  const verdictBadge = getVerdictBadge(health.verdict);

  return (
    <div className="space-y-6">
      {/* Active Tenant Context Header */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Active Tenant
            </span>
            <span className="text-xs text-stone-500 font-mono">ID: {business.id}</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 mt-1">
            {business.name}
          </h1>
          <p className="text-sm text-stone-600 mt-0.5">
            Operating as <span className="font-semibold text-stone-800">{user.fullName}</span> ({membership.role.toUpperCase()}) • Target: {business.currencySymbol}{business.targetDailyRevenue}/day
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="quick-pos-btn"
            onClick={() => onNavigateTab('pos')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>
          <button
            id="quick-inventory-btn"
            onClick={() => onNavigateTab('inventory')}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Inventory Ledger</span>
          </button>
          <button
            id="refresh-overview-btn"
            onClick={onRefresh}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
            title="Refresh telemetry"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deterministic KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Today's Revenue */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Today's Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {business.currencySymbol}{health.todayRevenue.toFixed(2)}
            </span>
            <span className="text-xs text-stone-500 font-medium">
              ({health.todaySalesCount} sales)
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex justify-between text-[11px] text-stone-500 mb-1">
              <span>Goal: {business.currencySymbol}{business.targetDailyRevenue}</span>
              <span className="font-semibold text-stone-700">{health.revenueTargetProgress}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, health.revenueTargetProgress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Today's Net Profit */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Net Profit Today</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${health.todayNetProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-serif font-bold ${health.todayNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {business.currencySymbol}{health.todayNetProfit.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-2">
            Expenses logged: {business.currencySymbol}{health.todayExpenses.toFixed(2)}
          </p>
        </div>

        {/* KPI 3: Inventory Reorder Alerts */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${health.lowStockItemsCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-stone-50 text-stone-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-serif font-bold ${health.lowStockItemsCount > 0 ? 'text-amber-700' : 'text-stone-800'}`}>
              {health.lowStockItemsCount}
            </span>
            <span className="text-xs text-stone-500">
              {health.lowStockItemsCount === 1 ? 'item below reorder' : 'items below reorder'}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 mt-2 transition-colors"
          >
            <span>Review catalog inventory</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* KPI 4: Operations Health Score */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Operations Health</span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${verdictBadge.bg}`}>
              {verdictBadge.label}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {health.score}/100
            </span>
            <span className="text-xs text-stone-500">
              ({health.inventoryHealthPercentage}% in-stock rate)
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-2">
            Computed deterministically from sales velocity, profit, and stock health.
          </p>
        </div>
      </div>

      {/* Main Grid: Business Events Audit Log & Tenant Architecture Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Business Events Audit Log */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="font-serif font-bold text-base text-stone-900">
                Business Activity Ledger
              </h2>
              <p className="text-xs text-stone-500">
                Immutable record of all sales, stock adjustments, and expenses.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 transition-colors"
            >
              <span>View Full Audit Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100 mt-2">
            {events.length === 0 ? (
              <p className="text-sm text-stone-400 py-6 text-center">No business events recorded yet.</p>
            ) : (
              events.slice(0, 6).map((evt) => (
                <div key={evt.id} className="py-3 flex items-start gap-3">
                  <div className={`p-1.5 rounded-md border text-xs font-mono font-bold mt-0.5 ${getEventSeverityColor(evt.severity)}`}>
                    {evt.type.replace('_', ' ')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-stone-900 truncate">
                        {evt.title}
                      </p>
                      <span className="text-[11px] text-stone-400 font-mono whitespace-nowrap ml-2">
                        {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                      {evt.detail}
                    </p>
                    {evt.actorName && (
                      <p className="text-[10px] text-stone-400 mt-1">
                        Actor: {evt.actorName}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Multi-Tenant Architecture & Data Rules */}
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-5 space-y-4">
          <div>
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-700" />
              <span>Phase 1 Architecture</span>
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Engineered with strict tenant isolation, deterministic business calculations, and an immutable inventory ledger.
            </p>
          </div>

          <div className="space-y-2.5 text-xs text-stone-700">
            <div className="p-3 bg-white rounded-lg border border-stone-200">
              <p className="font-semibold text-stone-900">Tenant-Scoped Queries</p>
              <p className="text-stone-500 mt-0.5">
                Every request requires a verified <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">BusinessMembership</code>. Client-submitted IDs are never trusted blindly.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-stone-200">
              <p className="font-semibold text-stone-900">Inventory Movement Ledger</p>
              <p className="text-stone-500 mt-0.5">
                Every stock delta creates an <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">InventoryMovement</code> recording previous stock, delta, resulting stock, and reason.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-stone-200">
              <p className="font-semibold text-stone-900">Deterministic Financials</p>
              <p className="text-stone-500 mt-0.5">
                Calculations for margins, profit, subtotals, and totals are computed strictly on the backend server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
