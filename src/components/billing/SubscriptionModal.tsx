import React from 'react';
import { X, Check, Crown, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { Business } from '../../types/index.js';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  business,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-br from-stone-900 to-stone-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 mb-3">
            <Crown className="w-3.5 h-3.5" />
            <span>BirrMind Growth Plan</span>
          </div>
          <h2 className="font-serif font-bold text-2xl">Upgrade {business.name}</h2>
          <p className="text-xs text-stone-300 mt-1">
            Unlock advanced predictive inventory forecasting, multi-branch intelligence, and unlimited Mercato AI voice assistant.
          </p>
        </div>

        {/* Plan Tiers */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50/40 relative">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">BirrMind Merchant Pro</h3>
                <span className="text-[11px] text-stone-500">For retail shops, mini markets & restaurants</span>
              </div>
              <div className="text-right">
                <span className="font-serif font-bold text-xl text-stone-900">799 ETB</span>
                <span className="text-[11px] text-stone-500"> / month</span>
              </div>
            </div>

            <ul className="space-y-2 mt-3 text-xs text-stone-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited Mercato AI conversational intelligence</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live Addis Market Pulse predictive commodity trends</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-staff Role-Based Access Control (Owner, Manager, Staff)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automated voice dictation and receipt extraction</span>
              </li>
            </ul>
          </div>

          {/* Honest Status Notice per Part 32 */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 space-y-1">
            <p className="font-semibold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Early Access Partner Program
            </p>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Automated mobile money (TeleBirr & CBE Birr) payment gateway integration is currently finalizing certification. All premium features remain complimentary and active for your workspace during our Ethiopian launch.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              alert('Thank you for your interest! Your workspace currently has all Pro features enabled during early access.');
              onClose();
            }}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Acknowledge Early Access
          </button>
        </div>
      </div>
    </div>
  );
};
