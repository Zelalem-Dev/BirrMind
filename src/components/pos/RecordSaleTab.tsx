import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  Receipt,
  Search
} from 'lucide-react';
import { Product, Business, Transaction } from '../../types/index.js';
import { api } from '../../lib/api.js';
import { VoiceSaleInput } from './VoiceSaleInput.js';
import { ReceiptInput } from './ReceiptInput.js';

interface RecordSaleTabProps {
  business: Business;
  products: Product[];
  transactions: Transaction[];
  onSaleCompleted: () => void;
}

interface CartItem {
  productId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  currentStock?: number;
}

export const RecordSaleTab: React.FC<RecordSaleTabProps> = ({
  business,
  products,
  transactions,
  onSaleCompleted,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer' | 'digital'>('card');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{
    transaction: Transaction;
    movementsCount: number;
  } | null>(null);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.sellingPrice,
          quantity: 1,
          currentStock: product.currentStock,
        },
      ];
    });
    setLastSuccess(null);
  };

  const updateQuantity = (productId: string | undefined, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string | undefined) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleItemsParsed = (items: { productId: string; quantity: number }[]) => {
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        setCart(prev => {
          const existing = prev.find(i => i.productId === product.id);
          if (existing) {
            return prev.map(i =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          }
          return [
            ...prev,
            {
              productId: product.id,
              name: product.name,
              unitPrice: product.sellingPrice,
              quantity: item.quantity,
              currentStock: product.currentStock,
            },
          ];
        });
      }
    });
    setLastSuccess(null);
  };

  // Client-side visual preview calculation (Server strictly recalculates and validates)
  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmitSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      const result = await api.recordSale(payload);
      setLastSuccess({
        transaction: result.transaction,
        movementsCount: result.movements.length,
      });
      setCart([]);
      setNotes('');
      onSaleCompleted();
    } catch (err: any) {
      setError(err.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif font-bold text-xl text-stone-900">
            Point of Sale & Transaction Recorder
          </h1>
          <p className="text-xs text-stone-500">
            Records transactions with deterministic server-side totals and atomic inventory movement logging.
          </p>
        </div>
        <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded border border-stone-200 self-start sm:self-auto">
          Currency: {business.currency} ({business.currencySymbol})
        </span>
      </div>

      {lastSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm text-emerald-900">
              Transaction Successfully Processed & Ledger Updated
            </p>
            <p className="mt-0.5">
              Recorded Transaction #{lastSuccess.transaction.id.slice(-8)} for {business.currencySymbol}{lastSuccess.transaction.totalAmount.toFixed(2)} via {lastSuccess.transaction.paymentMethod.toUpperCase()}.
            </p>
            <p className="text-emerald-700 mt-1 font-mono">
              ✓ {lastSuccess.movementsCount} Inventory Movements appended to audit ledger • Stock levels updated atomically.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Transaction Failed</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Multimodal Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <VoiceSaleInput products={products} onItemsParsed={handleItemsParsed} />
        <ReceiptInput products={products} onItemsParsed={handleItemsParsed} />
      </div>

      {/* 2-Column POS Layout: Left = Product Catalog, Right = Active Checkout Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Catalog): 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
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

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-stone-400 text-xs">
                No catalog items found matching "{searchQuery}".
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isLow = product.currentStock <= product.reorderPoint;
                const isOut = product.currentStock <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOut && addToCart(product)}
                    className={`p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between ${isOut ? 'opacity-50 cursor-not-allowed bg-stone-50' : ''}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] uppercase font-mono text-stone-400">{product.sku || product.category}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isOut ? 'bg-rose-100 text-rose-700' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>
                          {product.currentStock} {product.unit}s left
                        </span>
                      </div>
                      <h4 className="font-medium text-xs text-stone-900 mt-1 line-clamp-2">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-stone-900">
                        {business.currencySymbol}{product.sellingPrice.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        disabled={isOut}
                        className="p-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (Cart & Checkout): 5 Cols */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-700" />
                <h3 className="font-serif font-bold text-sm text-stone-900">Active Sale Ticket</h3>
              </div>
              <span className="text-xs text-stone-500">{cart.length} line item(s)</span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  Click any product on the left to add it to this sale ticket.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId || item.name} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-stone-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-stone-500">
                        {business.currencySymbol}{item.unitPrice.toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-stone-300 rounded-md bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 text-stone-500 hover:text-stone-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-stone-800 text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 text-stone-500 hover:text-stone-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-stone-900 w-16 text-right">
                        {business.currencySymbol}{(item.quantity * item.unitPrice).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-stone-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="pt-3 border-t border-stone-100">
              <label className="block text-xs font-semibold text-stone-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'digital', label: 'Digital', icon: Smartphone },
                  { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 font-medium transition-colors ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transaction Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Receipt Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Table 4, wholesale discount, special cut..."
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Subtotal & Action */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <div className="flex justify-between text-xs text-stone-500">
                <span>Subtotal</span>
                <span className="font-mono">{business.currencySymbol}{cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-500">
                <span>Tax</span>
                <span className="font-mono">{business.currencySymbol}0.00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-900 pt-1 border-t border-stone-100">
                <span>Total Due</span>
                <span className="font-serif font-bold text-lg text-amber-800">
                  {business.currencySymbol}{cartSubtotal.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                id="complete-sale-btn"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleSubmitSale}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold tracking-wide uppercase shadow-xs transition-colors mt-2"
              >
                {isSubmitting ? 'Recording Transaction...' : 'Complete & Record Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
        <h3 className="font-serif font-bold text-sm text-stone-900">
          Recent Completed Sales
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-y border-stone-200 font-medium">
              <tr>
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Recorded At</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.slice(0, 8).map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50/60">
                  <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-stone-700">
                    #{tx.id.slice(-8)}
                  </td>
                  <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 text-stone-700 max-w-xs truncate">
                    {tx.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                  <td className="py-2.5 px-3 uppercase text-[10px] font-medium text-stone-600">
                    {tx.paymentMethod}
                  </td>
                  <td className="py-2.5 px-3 text-stone-600">
                    {tx.actorName || 'Staff'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-serif font-bold text-stone-900 whitespace-nowrap">
                    {business.currencySymbol}{tx.totalAmount.toFixed(2)}
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
