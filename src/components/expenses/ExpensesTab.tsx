import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  Calendar,
  Building,
  Tag,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Expense, Business, BusinessMembership } from '../../types/index.js';
import { api } from '../../lib/api.js';

interface ExpensesTabProps {
  business: Business;
  membership: BusinessMembership;
  expenses: Expense[];
  onExpenseLogged: () => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  business,
  membership,
  expenses,
  onExpenseLogged,
}) => {
  const [isLogging, setIsLogging] = useState(false);
  const [category, setCategory] = useState('inventory');
  const [amount, setAmount] = useState<number>(0);
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer' | 'digital'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canLogExpenses = membership.role === 'owner' || membership.role === 'manager';

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !vendor.trim() || !description.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await api.recordExpense({
        category,
        amount: Number(amount),
        vendor: vendor.trim(),
        description: description.trim(),
        paymentMethod,
      });

      setFeedback(`Expense of ${business.currencySymbol}${Number(amount).toFixed(2)} recorded`);
      setAmount(0);
      setVendor('');
      setDescription('');
      setIsLogging(false);
      onExpenseLogged();
    } catch (err: any) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif font-bold text-xl text-stone-900">
            Operating Expenses Ledger
          </h1>
          <p className="text-xs text-stone-500">
            Track business operating costs, supplier orders, utilities, and store overhead.
          </p>
        </div>

        {canLogExpenses && (
          <button
            onClick={() => setIsLogging(!isLogging)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isLogging ? 'Close Form' : 'Log Operating Expense'}</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Expense Form Modal / Collapse */}
      {isLogging && (
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <h3 className="font-serif font-bold text-sm text-stone-900 mb-3">
            Record New Operating Expense
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                >
                  <option value="inventory">Inventory & Restock</option>
                  <option value="utilities">Utilities & Energy</option>
                  <option value="rent">Store Rent & Property</option>
                  <option value="supplies">Store Supplies & Packaging</option>
                  <option value="payroll">Staff Payroll & Contractors</option>
                  <option value="maintenance">Equipment Maintenance</option>
                  <option value="marketing">Marketing & Signs</option>
                  <option value="other">Other Operating Cost</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Amount ({business.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                >
                  <option value="card">Company Debit/Credit Card</option>
                  <option value="transfer">Bank Wire / Transfer</option>
                  <option value="cash">Petty Cash</option>
                  <option value="digital">Digital Wallet</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. City Power & Electric or Bakery Supply Co."
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description / Memo</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly refrigeration electricity bill"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsLogging(false)}
                className="px-3 py-2 text-stone-600 hover:text-stone-800 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || amount <= 0}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold"
              >
                {isSubmitting ? 'Logging...' : 'Save Expense Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Expenses Logged</span>
          <div className="mt-2 font-serif font-bold text-2xl text-stone-900">
            {business.currencySymbol}{totalExpenses.toFixed(2)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">{expenses.length} records on file</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs sm:col-span-2">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Breakdown by Category</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(categoryTotals).map(([cat, total]) => (
              <div key={cat} className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs flex items-center gap-1.5">
                <span className="capitalize text-stone-600 font-medium">{cat}:</span>
                <span className="font-mono font-bold text-stone-900">{business.currencySymbol}{total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-medium">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Logged By</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-stone-50/70">
                  <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-stone-900">
                    {exp.vendor}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-700 capitalize">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-stone-600 max-w-xs truncate">
                    {exp.description}
                  </td>
                  <td className="py-2.5 px-3 uppercase text-[10px] font-medium text-stone-500">
                    {exp.paymentMethod}
                  </td>
                  <td className="py-2.5 px-3 text-stone-600">
                    {exp.actorName || 'Manager'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                    {business.currencySymbol}{exp.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
