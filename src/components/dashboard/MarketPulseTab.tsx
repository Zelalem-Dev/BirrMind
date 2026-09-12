import React from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, MapPin, Activity } from 'lucide-react';
import { Business } from '../../types/index.js';

interface MarketPulseTabProps {
  business: Business;
}

export const MarketPulseTab: React.FC<MarketPulseTabProps> = ({ business }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif font-bold text-xl text-stone-900">
            Addis Market Pulse
          </h1>
          <p className="text-xs text-stone-500">
            Real-time hyper-local market intelligence and predictive insights for your business.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Market Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-2.5 rounded-lg text-amber-700 mt-1 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Teff Price Surge Alert</h3>
              <p className="text-xs text-amber-800 mt-1">
                Wholesale Teff prices in the Merkato district have risen by 12% in the last 48 hours due to supply chain disruptions on the main highway. 
                Consider adjusting injera pricing or securing bulk supply immediately.
              </p>
              <button className="mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors shadow-xs">
                Review Pricing Strategy
              </button>
            </div>
          </div>
        </div>

        {/* Opportunity Card 1 */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:border-emerald-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">Product Opportunity</h3>
          </div>
          <p className="text-xs text-stone-600 mb-3">
            Demand for "Fasting (Tsom) Macchiato" using soy/almond milk is up 40% in your area this week. You are currently out of stock on Almond Milk.
          </p>
          <div className="flex justify-between items-end">
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">High Confidence</span>
            <span className="text-xs font-mono font-medium text-stone-900">Est. +2,400 ETB/wk</span>
          </div>
        </div>

        {/* Local Competitor Pulse */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-stone-900 text-sm">Neighborhood Traffic</h3>
          </div>
          <p className="text-xs text-stone-600 mb-3">
            A large conference is happening 2 blocks away at Skylight Hotel tomorrow. Expect a 30% increase in morning foot traffic.
          </p>
          <div className="flex justify-between items-end">
            <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Event Alert</span>
            <span className="text-xs font-mono font-medium text-stone-900">Tomorrow 8am-11am</span>
          </div>
        </div>

        {/* AI Competitor Pricing */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-stone-900 text-sm">Pricing Optimization</h3>
          </div>
          <p className="text-xs text-stone-600 mb-3">
            Your "House Special Pasta" is priced 15% lower than 3 nearby competitors who have similar ratings.
          </p>
          <div className="flex justify-between items-end">
            <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Underpriced</span>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Apply Recommendation &rarr;
            </button>
          </div>
        </div>
        
      </div>
      
      {/* Visual Mock Chart Area */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-sm">Neighborhood Sales Velocity Index</h3>
          </div>
          <select className="text-xs border-stone-200 rounded p-1">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div className="h-48 w-full bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-center relative overflow-hidden">
           {/* Purely decorative mock chart bars */}
           <div className="absolute inset-0 flex items-end justify-around px-4 pt-8 pb-4">
              {[40, 65, 45, 80, 95, 75, 85].map((height, i) => (
                <div key={i} className="w-8 md:w-16 bg-amber-200/50 rounded-t-sm border-t-2 border-amber-400" style={{ height: `${height}%` }}></div>
              ))}
           </div>
           <div className="absolute inset-0 flex items-end justify-around px-4 pt-8 pb-4">
              {[35, 55, 40, 60, 85, 70, 75].map((height, i) => (
                <div key={i} className="w-4 md:w-8 bg-stone-300/50 rounded-t-sm border-t-2 border-stone-500 ml-4 md:ml-8" style={{ height: `${height}%` }}></div>
              ))}
           </div>
           
           <span className="relative text-xs font-mono font-bold text-stone-500 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm z-10">
             You vs. Neighborhood Average
           </span>
        </div>
      </div>

    </div>
  );
};
