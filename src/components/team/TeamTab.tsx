import React, { useState } from 'react';
import {
  Users,
  Shield,
  Building,
  UserPlus,
  Key,
  CheckCircle,
  AlertCircle,
  Database,
  FileCode,
  ShieldAlert
} from 'lucide-react';
import { Business, BusinessMembership, User, MembershipRole } from '../../types/index.js';
import { api } from '../../lib/api.js';

interface TeamTabProps {
  business: Business;
  currentUser: User;
  currentMembership?: BusinessMembership | null;
  memberships: (BusinessMembership & { user: User })[];
  databaseEngine: 'supabase' | 'local_postgres_compatible';
  onMemberAdded: () => void;
}

export const TeamTab: React.FC<TeamTabProps> = ({
  business,
  currentUser,
  currentMembership,
  memberships = [],
  databaseEngine,
  onMemberAdded,
}) => {
  const [isInviting, setIsInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<MembershipRole>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentMembership?.role === 'owner';

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await api.addMembership({
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        role,
      });

      setFeedback(`Added ${fullName || email} to ${business.name} as ${role}`);
      setEmail('');
      setFullName('');
      setRole('staff');
      setIsInviting(false);
      onMemberAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (r?: MembershipRole) => {
    switch (r) {
      case 'owner':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'manager':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
      case 'staff':
        return 'bg-stone-100 text-stone-700 border-stone-300 font-semibold';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200 font-normal';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif font-bold text-xl text-stone-900">
            Tenant Identity & Team RBAC Management
          </h1>
          <p className="text-xs text-stone-500">
            Multi-tenant identity model: User • Business • BusinessMembership with role-based access control.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsInviting(!isInviting)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isInviting ? 'Cancel Invite' : 'Invite Team Member'}</span>
          </button>
        )}
      </div>

      {!currentMembership && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>You do not have an active membership in this business entity ({business.name}). Management actions are restricted.</span>
        </div>
      )}

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

      {/* Invite Member Form (Owner only) */}
      {isInviting && (
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <h3 className="font-serif font-bold text-sm text-stone-900 mb-3">
            Grant Business Membership
          </h3>

          <form onSubmit={handleAddMember} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@mercato.com"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Luca Ferri"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as MembershipRole)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg"
                >
                  <option value="staff">Staff (POS & Sales)</option>
                  <option value="manager">Manager (Inventory & Expenses)</option>
                  <option value="owner">Owner (Full Business Control)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsInviting(false)}
                className="px-3 py-1.5 text-stone-600 hover:text-stone-800 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold"
              >
                {isSubmitting ? 'Saving...' : 'Add Team Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Active Members List & RBAC Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Members List: 7 Cols */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700" />
              <span>Active Business Memberships</span>
            </h3>
            <span className="text-xs text-stone-500 font-mono">Tenant: {business.id}</span>
          </div>

          <div className="divide-y divide-stone-100">
            {(!memberships || memberships.length === 0) ? (
              <div className="py-8 text-center text-stone-400 text-xs font-medium">
                No active team members registered for this business.
              </div>
            ) : (
              memberships.map((item) => {
                const userObj = item.user;
                const displayName = userObj?.fullName || userObj?.email || item.userId;
                const displayEmail = userObj?.email || 'No email provided';
                const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';
                const isCurrent = (userObj?.id && currentUser?.id && userObj.id === currentUser.id) || (currentUser?.id && item.userId === currentUser.id);

                return (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-serif font-bold flex items-center justify-center text-sm border border-amber-200">
                        {initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs text-stone-900">{displayName}</p>
                          {isCurrent && (
                            <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500">{displayEmail}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase border ${getRoleBadge(item.role)}`}>
                        {item.role}
                      </span>
                      <p className="text-[10px] text-stone-400 font-mono mt-1">
                        Joined {item.joinedAt ? new Date(item.joinedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Role Matrix & Multi-Tenant Specs: 5 Cols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-5 space-y-3 text-xs">
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-700" />
              <span>Permission Hierarchy</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-800 uppercase text-[10px]">Owner</span>
                  <span className="text-[10px] font-mono text-stone-400">Level 3</span>
                </div>
                <p className="text-stone-600 mt-1">
                  Full control over business entity, invite/revoke team members, view all telemetry, configure settings, reset seed data.
                </p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800 uppercase text-[10px]">Manager</span>
                  <span className="text-[10px] font-mono text-stone-400">Level 2</span>
                </div>
                <p className="text-stone-600 mt-1">
                  Perform stock adjustments, confirm supplier restocks, record store expenses, update product pricing and catalog.
                </p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 uppercase text-[10px]">Staff</span>
                  <span className="text-[10px] font-mono text-stone-400">Level 1</span>
                </div>
                <p className="text-stone-600 mt-1">
                  Access Point of Sale, record customer orders, review catalog inventory, view recent activity ledger.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-2 text-xs">
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>PostgreSQL Schema Status</span>
            </h3>
            <p className="text-stone-600">
              Active Engine: <strong className="font-mono text-stone-800">{databaseEngine === 'supabase' ? 'Supabase Cloud PostgreSQL' : 'Local PostgreSQL-Compatible Engine'}</strong>
            </p>
            <p className="text-[11px] text-stone-500 font-mono bg-stone-50 p-2 rounded border border-stone-200">
              Migration: /supabase/migrations/20260911_initial_schema.sql
            </p>
            <p className="text-[11px] text-stone-500">
              Includes Row-Level Security (RLS) policies enforcing multi-tenant isolation on all 8 tables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
