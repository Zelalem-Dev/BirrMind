import React, { useState } from 'react';
import {
  Package,
  Layers,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Truck,
  AlertTriangle,
  CheckCircle,
  X,
  History,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Product, InventoryMovement, Business, BusinessMembership } from '../../types/index.js';
import { api } from '../../lib/api.js';

interface InventoryLedgerTabProps {
  business: Business;
  membership: BusinessMembership;
  products: Product[];
  movements: InventoryMovement[];
  onDataChanged: () => void;
}

export const InventoryLedgerTab: React.FC<InventoryLedgerTabProps> = ({
  business,
  membership,
  products,
  movements,
  onDataChanged,
}) => {
  const [activeSubView, setActiveSubView] = useState<'catalog' | 'ledger'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Physical stock count discrepancy');
  const [adjustType, setAdjustType] = useState<'adjustment' | 'damage' | 'return' | 'internal_use'>('adjustment');

  const [restockModalProduct, setRestockModalProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(10);
  const [restockCostPrice, setRestockCostPrice] = useState<number>(0);
  const [restockVendor, setRestockVendor] = useState<string>('');
  const [recordExpense, setRecordExpense] = useState<boolean>(true);

  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Pantry');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCostPrice, setNewProdCostPrice] = useState<number>(5.0);
  const [newProdSellingPrice, setNewProdSellingPrice] = useState<number>(9.5);
  const [newProdInitialStock, setNewProdInitialStock] = useState<number>(20);
  const [newProdReorderPoint, setNewProdReorderPoint] = useState<number>(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canManageInventory = membership.role === 'owner' || membership.role === 'manager';

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct || adjustDelta === 0) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await api.adjustStock({
        productId: adjustModalProduct.id,
        quantityDelta: adjustDelta,
        type: adjustType,
        reason: adjustReason.trim(),
      });
      setFeedback({ type: 'success', message: `Adjusted stock for ${adjustModalProduct.name}` });
      setAdjustModalProduct(null);
      setAdjustDelta(0);
      onDataChanged();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Stock adjustment failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalProduct || restockQuantity <= 0) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await api.restockProduct({
        productId: restockModalProduct.id,
        quantity: restockQuantity,
        costPrice: restockCostPrice,
        vendor: restockVendor.trim() || undefined,
        recordExpense,
      });
      setFeedback({ type: 'success', message: `Restocked ${restockQuantity} units of ${restockModalProduct.name}` });
      setRestockModalProduct(null);
      onDataChanged();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Restock failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await api.createProduct({
        name: newProdName.trim(),
        category: newProdCategory,
        sku: newProdSku.trim() || undefined,
        unit: 'unit',
        costPrice: Number(newProdCostPrice),
        sellingPrice: Number(newProdSellingPrice),
        currentStock: Number(newProdInitialStock),
        reorderPoint: Number(newProdReorderPoint),
        reorderQuantity: 10,
      });
      setFeedback({ type: 'success', message: `Created product: ${newProdName}` });
      setIsNewProductModalOpen(false);
      setNewProdName('');
      onDataChanged();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'restock':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'adjustment':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'damage':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-view Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif font-bold text-xl text-stone-900">
            Inventory & Movement Ledger
          </h1>
          <p className="text-xs text-stone-500">
            Atomic stock updates backed by an immutable ledger of every inventory change.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subview pills */}
          <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
            <button
              onClick={() => setActiveSubView('catalog')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubView === 'catalog'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Product Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveSubView('ledger')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubView === 'ledger'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Movement Ledger ({movements.length})
            </button>
          </div>

          {canManageInventory && (
            <button
              id="new-product-btn"
              onClick={() => setIsNewProductModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Product</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="p-0.5 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeSubView === 'catalog' ? (
        /* ================== CATALOG VIEW ================== */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg text-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">SKU / Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Cost Price</th>
                    <th className="py-2.5 px-3 text-right">Selling Price</th>
                    <th className="py-2.5 px-3 text-right">Margin</th>
                    <th className="py-2.5 px-3 text-center">Stock Level</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => {
                    const margin = p.sellingPrice > 0
                      ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                      : 0;
                    const isLow = p.currentStock <= p.reorderPoint;
                    const isOut = p.currentStock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-stone-900">{p.name}</p>
                          <p className="text-[11px] font-mono text-stone-400">{p.sku || 'NO-SKU'}</p>
                        </td>
                        <td className="py-3 px-3 text-stone-600">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-stone-600">
                          {business.currencySymbol}{p.costPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-stone-900">
                          {business.currencySymbol}{p.sellingPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                          {margin}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-flex items-center gap-1 ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {isLow && <AlertTriangle className="w-3 h-3" />}
                            {p.currentStock} {p.unit}s
                          </span>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Reorder @ {p.reorderPoint}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          {canManageInventory ? (
                            <>
                              <button
                                onClick={() => {
                                  setRestockModalProduct(p);
                                  setRestockCostPrice(p.costPrice);
                                  setRestockVendor(p.supplier || '');
                                }}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-200 text-[11px] font-medium"
                              >
                                Restock
                              </button>
                              <button
                                onClick={() => {
                                  setAdjustModalProduct(p);
                                  setAdjustDelta(0);
                                }}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-200 text-[11px] font-medium"
                              >
                                Adjust
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">Read-only (Staff)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================== MOVEMENT LEDGER VIEW ================== */
        <div className="space-y-4">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-700" />
            <span>
              This immutable ledger tracks every inventory change: sales, supplier deliveries, returns, damages, and audit adjustments.
            </span>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Movement Type</th>
                    <th className="py-2.5 px-3 text-right">Delta</th>
                    <th className="py-2.5 px-3 text-right">Resulting Stock</th>
                    <th className="py-2.5 px-3">Reason / Ref</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-stone-900">
                        {m.productName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${getMovementBadge(m.type)}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${m.quantityDelta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-stone-800">
                        {m.resultingStock}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 max-w-xs truncate">
                        {m.reason}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">
                        {m.actorName || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Adjust Inventory: {adjustModalProduct.name}
              </h3>
              <button onClick={() => setAdjustModalProduct(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex justify-between">
                <span>Current Stock on Record:</span>
                <span className="font-mono font-bold text-stone-900">
                  {adjustModalProduct.currentStock} {adjustModalProduct.unit}s
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                >
                  <option value="adjustment">Audit Count Discrepancy</option>
                  <option value="damage">Spillage / Damage</option>
                  <option value="return">Customer Return</option>
                  <option value="internal_use">Kitchen / Internal Use</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Quantity Delta (+ or -)</label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                  placeholder="e.g. -2 or 5"
                  required
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  New Resulting Stock: <strong className="font-mono">{adjustModalProduct.currentStock + adjustDelta}</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Mandatory Audit Reason</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  rows={2}
                  placeholder="Explain why this adjustment is being recorded..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-3 py-2 text-stone-600 hover:text-stone-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || adjustDelta === 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold"
                >
                  {isSubmitting ? 'Recording...' : 'Save & Append to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Restock: {restockModalProduct.name}
              </h3>
              <button onClick={() => setRestockModalProduct(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Units Received</label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Cost Price Per Unit ({business.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  value={restockCostPrice}
                  onChange={(e) => setRestockCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Supplier / Vendor</label>
                <input
                  type="text"
                  value={restockVendor}
                  onChange={(e) => setRestockVendor(e.target.value)}
                  placeholder="e.g. Parma Imports Ltd"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <label className="flex items-center gap-2 font-semibold text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordExpense}
                    onChange={(e) => setRecordExpense(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Automatically log {business.currencySymbol}{(restockQuantity * restockCostPrice).toFixed(2)} as Operating Expense</span>
                </label>
                <p className="text-[11px] text-stone-500 pl-5">
                  Appends directly to the business expenses ledger under category "inventory".
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRestockModalProduct(null)}
                  className="px-3 py-2 text-stone-600 hover:text-stone-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || restockQuantity <= 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold"
                >
                  {isSubmitting ? 'Restocking...' : 'Confirm Delivery & Update Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Add Catalog Product
              </h3>
              <button onClick={() => setIsNewProductModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. San Marzano Tomatoes 800g"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="e.g. PAN-TOM-01"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Cost Price ({business.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdCostPrice}
                    onChange={(e) => setNewProdCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Selling Price ({business.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdSellingPrice}
                    onChange={(e) => setNewProdSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newProdInitialStock}
                    onChange={(e) => setNewProdInitialStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    value={newProdReorderPoint}
                    onChange={(e) => setNewProdReorderPoint(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-3 py-2 text-stone-600 hover:text-stone-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newProdName.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Record Initial Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
