import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Product } from '../../types/index.js';

interface ReceiptInputProps {
  products: Product[];
  onItemsParsed: (items: { productId: string; quantity: number }[]) => void;
}

export const ReceiptInput: React.FC<ReceiptInputProps> = ({ products, onItemsParsed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processReceipt = async (file: File) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch('/api/ai/receipt/extract', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process receipt');
      }

      const data = await response.json();
      
      if (data.lineItems && data.lineItems.length > 0) {
        const parsed = data.lineItems.map((item: any) => {
          // Attempt to match with catalog
          const matchedProduct = products.find(p => p.name.toLowerCase().includes(item.description.toLowerCase().split(' ')[0]));
          return {
            productId: matchedProduct ? matchedProduct.id : '',
            name: item.description,
            quantity: item.quantity,
            unitPrice: item.amount / Math.max(1, item.quantity)
          };
        }).filter((p: any) => p.productId);

        if (parsed.length > 0) {
          onItemsParsed(parsed);
        } else {
          alert('Receipt parsed, but items did not match catalog.');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error extracting receipt data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processReceipt(file);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex flex-col items-center justify-center space-y-3">
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
        className="w-16 h-16 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 flex items-center justify-center transition-all"
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <Camera className="w-8 h-8" />
        )}
      </button>
      
      <div className="text-center">
        <h4 className="text-sm font-bold text-stone-900">
          {isProcessing ? 'Analyzing Receipt...' : 'Scan Receipt'}
        </h4>
        <p className="text-xs text-stone-500 max-w-[200px] mt-1">
          Auto-extract items from handwritten or printed invoices.
        </p>
      </div>
    </div>
  );
};
