import React, { useState } from 'react';
import {
  History,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  UserCheck,
  Search,
  Code
} from 'lucide-react';
import { BusinessEvent, Business } from '../../types/index.js';

interface EventsAuditTabProps {
  business: Business;
  events: BusinessEvent[];
}

export const EventsAuditTab: React.FC<EventsAuditTabProps> = ({
  business,
  events,
}) => {
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const eventTypes = ['ALL', ...Array.from(new Set(events.map(e => e.type)))];

  const filteredEvents = events.filter(e => {
    const matchType = selectedType === 'ALL' || e.type === selectedType;
    const matchSeverity = selectedSeverity === 'ALL' || e.severity === selectedSeverity;
    const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.actorName && e.actorName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSeverity && matchSearch;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'positive':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif font-bold text-xl text-stone-900">
            Business Activity & Audit Events Log
          </h1>
          <p className="text-xs text-stone-500">
            Immutable system stream of business events (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">BusinessEvent</code>) recording all sales, restocks, and price adjustments.
          </p>
        </div>

        <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded border border-stone-200 self-start sm:self-auto">
          Total Logged: {events.length} events
        </span>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event title, details, actor..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-stone-600">Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none"
          >
            {eventTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-stone-600">Severity:</label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="normal">Normal</option>
            <option value="positive">Positive</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Event Stream List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs divide-y divide-stone-100 overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            No events match the selected filters.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.id;

            return (
              <div key={evt.id} className="p-4 hover:bg-stone-50/70 transition-colors text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border shrink-0 mt-0.5 ${getSeverityBadge(evt.severity)}`}>
                      {evt.type.replace('_', ' ')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-stone-900">{evt.title}</h4>
                      <p className="text-stone-600 mt-0.5">{evt.detail}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-stone-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(evt.createdAt).toLocaleString()}
                        </span>
                        {evt.actorName && (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            Actor: {evt.actorName}
                          </span>
                        )}
                        <span className="font-mono text-[10px]">ID: {evt.id}</span>
                      </div>
                    </div>
                  </div>

                  {evt.metadata && (
                    <button
                      onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                      className="text-stone-400 hover:text-stone-700 p-1 flex items-center gap-1 text-[11px] font-mono shrink-0"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide Payload' : 'Payload'}</span>
                    </button>
                  )}
                </div>

                {isExpanded && evt.metadata && (
                  <div className="mt-3 p-3 bg-stone-900 text-stone-200 rounded-lg font-mono text-[11px] overflow-x-auto">
                    <pre>{JSON.stringify(evt.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
