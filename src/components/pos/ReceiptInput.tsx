import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, Edit2, ShoppingBag } from 'lucide-react';
import { Product } from '../../types/index.js';
import { getApiContext } from '../../lib/api.js';
import { supabase } from '../../lib/supabaseClient.js';

interface ReceiptInputProps {
  products: Product[];
  onItemsParsed: (items: { productId: string; quantity: number }[]) => void;
}

interface DraftLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  matchedProductId: string;
  confidence?: number;
}

export const ReceiptInput: React.FC<ReceiptInputProps> = ({ products, onItemsParsed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<DraftLineItem[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processReceipt = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const ctx = getApiContext();
      const headers: Record<string, string> = {
        'x-user-id': ctx.userId,
        'x-business-id': ctx.businessId,
      };

      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.access_token) {
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
        }
      }

      const response = await fetch('/api/ai/receipt/extract', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: 'Extraction service unavailable' }));
        throw new Error(errJson.error || 'Failed to extract receipt items.');
      }

      const data = await response.json();

      if (data.lineItems && data.lineItems.length > 0) {
        const parsed: DraftLineItem[] = data.lineItems.map((item: any, idx: number) => {
          const words = (item.description || '').toLowerCase().split(' ');
          const matched = products.find(p => {
            const pName = p.name.toLowerCase();
            return words.some((w: string) => w.length > 2 && pName.includes(w));
          });

          return {
            id: `item_${idx}_${Date.now()}`,
            description: item.description || 'Item',
            quantity: Math.max(1, Number(item.quantity) || 1),
            unitPrice: Number(item.amount) > 0 ? Number(item.amount) / Math.max(1, Number(item.quantity) || 1) : 0,
            matchedProductId: matched ? matched.id : (products[0]?.id || ''),
            confidence: item.confidence || 0.85,
          };
        });

        setDraftItems(parsed);
      } else {
        setErrorMessage('No line items could be detected on the receipt. You can enter the sale manually.');
      }
    } catch (error: any) {
      console.warn('Receipt extraction error:', error);
      setErrorMessage(error.message || 'Error communicating with the vision extraction provider. Please enter manually.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processReceipt(file);
    }
  };

  const handleConfirmDraft = () => {
    if (!draftItems) return;
    const finalItems = draftItems
      .filter(item => item.matchedProductId && item.quantity > 0)
      .map(item => ({
        productId: item.matchedProductId,
        quantity: item.quantity,
      }));

    if (finalItems.length > 0) {
      onItemsParsed(finalItems);
      setDraftItems(null);
    } else {
      setErrorMessage('Please match at least one product before confirming.');
    }
  };

  const updateDraftItem = (id: string, updates: Partial<DraftLineItem>) => {
    setDraftItems(prev => prev ? prev.map(it => it.id === id ? { ...it, ...updates } : it) : null);
  };

  const removeDraftItem = (id: string) => {
    setDraftItems(prev => prev ? prev.filter(it => it.id !== id) : null);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex flex-col items-center justify-center space-y-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-16 h-16 rounded-full bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center transition-all border border-stone-200 hover:border-amber-300"
          title="Scan or upload a receipt"
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          ) : (
            <Camera className="w-8 h-8" />
          )}
        </button>

        <div className="text-center">
          <h4 className="text-sm font-bold text-stone-900">
            {isProcessing ? 'Analyzing Receipt...' : 'Scan Receipt'}
          </h4>
          <p className="text-xs text-stone-500 max-w-[200px] mt-1">
            Auto-extract items with editable confirmation before recording.
          </p>
        </div>

        {errorMessage && (
          <div className="p-2 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-center max-w-xs">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Editable Draft Candidate Modal per PART 11 */}
      {draftItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-amber-950">Review Extracted Receipt Items</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Verify or edit items before adding them to your sale. No records are created without confirmation.
                </p>
              </div>
              <button
                onClick={() => setDraftItems(null)}
                className="p-1 rounded-lg text-amber-800 hover:bg-amber-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[350px] overflow-y-auto space-y-3 divide-y divide-stone-100">
              {draftItems.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-900 truncate max-w-[220px]">
                      {item.description}
                    </span>
                    <button
                      onClick={() => removeDraftItem(item.id)}
                      className="text-[11px] text-rose-600 hover:text-rose-800"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="col-span-2">
                      <label className="text-[10px] text-stone-500 font-medium block mb-0.5">Matched Catalog Product</label>
                      <select
                        value={item.matchedProductId}
                        onChange={(e) => updateDraftItem(item.id, { matchedProductId: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 font-medium block mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateDraftItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <button
                onClick={() => setDraftItems(null)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDraft}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
