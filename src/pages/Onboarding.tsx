import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, CheckCircle2,
  Store, MapPin, Users, ShoppingBag, Languages, Target, Eye, Loader2, Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';
import { Logo } from '../components/brand/Logo.js';

interface OnboardingData {
  businessName: string;
  businessType: string;
  industry: string;
  description: string;
  country: string;
  region: string;
  city: string;
  neighborhood: string;
  employeeCount: string;
  locationCount: string;
  isPrimaryBusiness: boolean;
  mainProducts: string;
  paymentMethods: string[];
  orderChannels: string[];
  preferredLanguage: string;
  currency: string;
  currencySymbol: string;
  businessGoals: string[];
}

const BUSINESS_TYPES = [
  'Mini Market / Kiosk','Grocery Store','Restaurant / Cafe','Clothing & Apparel',
  'Electronics','Pharmacy / Health','Beauty & Cosmetics','Wholesale / Distribution','Services','Other',
];
const INDUSTRIES = [
  'Food & Beverage','Retail - General','Retail - Fashion','Retail - Electronics',
  'Health & Wellness','Hospitality','Professional Services','Agriculture','Manufacturing','Other',
];
const ETHIOPIAN_CITIES = [
  'Addis Ababa','Dire Dawa','Adama (Nazret)','Hawassa','Bahir Dar','Mekelle',
  'Jimma','Gondar','Dessie','Jijiga','Shashamane','Bishoftu (Debre Zeit)','Arba Minch','Harar','Other',
];
const PAYMENT_METHODS = ['Cash','Mobile Money (TeleBirr)','Bank Transfer','Credit/Debit Card'];
const ORDER_CHANNELS = ['In-Person / Walk-in','Phone / Call','Telegram','Facebook / Social Media','Other'];
const GOALS = ['Increase sales','Reduce waste','Manage inventory','Understand profit','Control expenses','Find opportunities','Understand customers','Grow the business'];
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic (Amharic)' },
  { code: 'om', label: 'Afaan Oromo' },
];
const CURRENCIES = [
  { code: 'ETB', symbol: 'ETB', label: 'Ethiopian Birr (ETB)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: 'EUR', label: 'Euro (EUR)' },
];
const STEPS = [
  { id: 1, label: 'Your Business', icon: Store },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Business Size', icon: Users },
  { id: 4, label: 'How You Operate', icon: ShoppingBag },
  { id: 5, label: 'Language & Currency', icon: Languages },
  { id: 6, label: 'Your Goals', icon: Target },
  { id: 7, label: 'Review', icon: Eye },
];

function MultiSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selected.includes(opt) ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    businessName: '', businessType: '', industry: '', description: '',
    country: 'Ethiopia', region: '', city: '', neighborhood: '',
    employeeCount: '1-5', locationCount: '1', isPrimaryBusiness: true,
    mainProducts: '', paymentMethods: ['Cash'], orderChannels: ['In-Person / Walk-in'],
    preferredLanguage: 'en', currency: 'ETB', currencySymbol: 'ETB', businessGoals: [],
  });

  const set = (field: keyof OnboardingData, value: any) => setData((prev) => ({ ...prev, [field]: value }));

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return data.businessName.trim().length >= 2 && !!data.businessType && !!data.industry;
      case 2: return !!data.city;
      case 3: return !!data.employeeCount;
      case 4: return data.paymentMethods.length > 0;
      case 5: return !!data.preferredLanguage && !!data.currency;
      case 6: return data.businessGoals.length > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let token: string | null = null;
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || null;
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST', headers, body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Onboarding failed' }));
        throw new Error(err.error || 'Failed to create your business');
      }
      localStorage.removeItem('birrmind_demo_mode');
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Business Name <span className="text-rose-500">*</span></label>
            <input type="text" value={data.businessName} onChange={(e) => set('businessName', e.target.value)}
              placeholder="e.g. Selam Mini Market"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Business Type <span className="text-rose-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => set('businessType', t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${data.businessType === t ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Industry / Sector <span className="text-rose-500">*</span></label>
            <select value={data.industry} onChange={(e) => set('industry', e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50">
              <option value="">Select industry...</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Brief description <span className="text-stone-400 font-normal">(optional)</span></label>
            <textarea value={data.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Tell us a bit about what you sell or offer..." rows={3}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 resize-none" />
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Country</label>
            <input type="text" value={data.country} onChange={(e) => set('country', e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">City <span className="text-rose-500">*</span></label>
            <div className="flex flex-wrap gap-2 mb-3">
              {ETHIOPIAN_CITIES.map((c) => (
                <button key={c} type="button" onClick={() => set('city', c === 'Other' ? '' : c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${(data.city === c || (c === 'Other' && !ETHIOPIAN_CITIES.slice(0,-1).includes(data.city))) ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'}`}>
                  {c}
                </button>
              ))}
            </div>
            {!ETHIOPIAN_CITIES.slice(0, -1).includes(data.city) && (
              <input type="text" value={data.city} onChange={(e) => set('city', e.target.value)}
                placeholder="Enter your city..."
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Region / Zone</label>
              <input type="text" value={data.region} onChange={(e) => set('region', e.target.value)}
                placeholder="e.g. Oromia"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Neighborhood</label>
              <input type="text" value={data.neighborhood} onChange={(e) => set('neighborhood', e.target.value)}
                placeholder="e.g. Bole, Merkato"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">How many people work in your business? <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Just me', '1-5', '6-15', '16+'].map((opt) => (
                <button key={opt} type="button" onClick={() => set('employeeCount', opt)}
                  className={`py-3 rounded-xl text-sm font-medium border transition-all ${data.employeeCount === opt ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">How many locations do you have?</label>
            <div className="flex gap-2">
              {['1', '2-3', '4+'].map((opt) => (
                <button key={opt} type="button" onClick={() => set('locationCount', opt)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${data.locationCount === opt ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-stone-50 border border-stone-200 rounded-xl">
            <input type="checkbox" id="primary-biz" checked={data.isPrimaryBusiness} onChange={(e) => set('isPrimaryBusiness', e.target.checked)} className="w-4 h-4 accent-amber-600" />
            <label htmlFor="primary-biz" className="text-sm text-stone-700 cursor-pointer">This is my primary / main business</label>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">What do you mainly sell or offer?</label>
            <textarea value={data.mainProducts} onChange={(e) => set('mainProducts', e.target.value)}
              placeholder="e.g. Soft drinks, snacks, household items, clothing..." rows={3}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">How do customers pay? <span className="text-rose-500">*</span></label>
            <MultiSelect options={PAYMENT_METHODS} selected={data.paymentMethods} onChange={(v) => set('paymentMethods', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">How do customers usually order?</label>
            <MultiSelect options={ORDER_CHANNELS} selected={data.orderChannels} onChange={(v) => set('orderChannels', v)} />
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Preferred language for Mercato AI <span className="text-rose-500">*</span></label>
            <div className="flex flex-col sm:flex-row gap-2">
              {LANGUAGES.map((lang) => (
                <button key={lang.code} type="button" onClick={() => set('preferredLanguage', lang.code)}
                  className={`flex-1 py-3.5 rounded-xl text-sm font-medium border transition-all ${data.preferredLanguage === lang.code ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'}`}>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Business currency <span className="text-rose-500">*</span></label>
            <div className="flex flex-col gap-2">
              {CURRENCIES.map((c) => (
                <button key={c.code} type="button" onClick={() => { set('currency', c.code); set('currencySymbol', c.symbol); }}
                  className={`py-3.5 rounded-xl text-sm font-medium border text-left px-4 transition-all ${data.currency === c.code ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Select all that apply. Mercato AI will tailor its recommendations to these priorities.</p>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((goal) => (
              <button key={goal} type="button" onClick={() => { const c = data.businessGoals; set('businessGoals', c.includes(goal) ? c.filter((g) => g !== goal) : [...c, goal]); }}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${data.businessGoals.includes(goal) ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'}`}>
                {goal}
              </button>
            ))}
          </div>
          {data.businessGoals.length === 0 && <p className="text-xs text-rose-500">Please select at least one goal.</p>}
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Review your details before we create your workspace.</p>
          <div className="bg-stone-50 border border-stone-200 rounded-xl divide-y divide-stone-100">
            {[
              { label: 'Business Name', value: data.businessName },
              { label: 'Type', value: data.businessType },
              { label: 'Industry', value: data.industry },
              { label: 'Location', value: [data.city, data.country].filter(Boolean).join(', ') },
              { label: 'Neighborhood', value: data.neighborhood || '-' },
              { label: 'Team Size', value: data.employeeCount },
              { label: 'Language', value: LANGUAGES.find((l) => l.code === data.preferredLanguage)?.label },
              { label: 'Currency', value: data.currency },
              { label: 'Goals', value: data.businessGoals.length ? data.businessGoals.join(', ') : '-' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start px-4 py-3">
                <span className="text-xs text-stone-500 font-medium">{label}</span>
                <span className="text-sm text-stone-900 font-medium text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
          {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">{error}</div>}
        </div>
      );
      default: return null;
    }
  };

  const currentStepDef = STEPS[step - 1];
  const StepIcon = currentStepDef.icon;
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Logo className="w-7 h-7 text-amber-600" />
          <span className="font-serif font-semibold text-stone-900">BirrMind</span>
        </div>
        <span className="text-xs text-stone-500">Step {step} of {STEPS.length}</span>
      </div>
      <div className="w-full h-1 bg-stone-100">
        <div className="h-1 bg-amber-500 transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
      </div>
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-xl text-stone-900">{currentStepDef.label}</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {step === 1 && 'Tell us about your business so we can set up your workspace.'}
                  {step === 2 && 'Where is your business located?'}
                  {step === 3 && 'Help us understand the scale of your operation.'}
                  {step === 4 && 'How does your business run day to day?'}
                  {step === 5 && 'Set your preferred language and currency.'}
                  {step === 6 && 'What would you like Mercato AI to help you with?'}
                  {step === 7 && 'Review your information before we create your workspace.'}
                </p>
              </div>
            </div>
            {renderStep()}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
              <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-stone-50">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              {step < STEPS.length ? (
                <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting || data.businessGoals.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating workspace...</>) : (<><Sparkles className="w-4 h-4" /> Create My Business</>)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
