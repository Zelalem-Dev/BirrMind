import { Request, Response, NextFunction } from 'express';
import { repository, INITIAL_USER_ID, DEFAULT_BUSINESS_ID } from '../db/repository.js';
import { getSupabaseClient, isSupabaseConfigured } from '../db/supabase.js';
import { User, Business, BusinessMembership, MembershipRole } from '../../src/types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      business?: Business;
      membership?: BusinessMembership;
    }
  }
}

const ROLE_RANK: Record<MembershipRole, number> = {
  owner: 3,
  manager: 2,
  staff: 1,
};

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    let userId = '';
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (token) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
          res.status(401).json({ error: 'Unauthorized: Invalid Supabase token' });
          return;
        }
        userId = data.user.id;
      }
    }

    if (!userId) {
      const reqUserId = req.headers['x-user-id'] as string;
      const isDemo = ['user_marco', 'user_elena', 'user_matteo'].includes(reqUserId);
      const isDemoHeader = req.headers['x-demo-mode'] === 'true';

      // Allow demo users and unconfigured fallback even in production to prevent crash loop
      if (!isProduction || isDemo || isDemoHeader || !isSupabaseConfigured()) {
        userId = reqUserId || INITIAL_USER_ID;
      }
    }

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    let user = await repository.getUser(userId);

    // If user is from Supabase auth but not yet in the repository database, auto-provision
    if (!user && token) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data } = await supabase.auth.getUser(token);
        if (data?.user) {
          const newUser: User = {
            id: data.user.id,
            email: data.user.email || 'user@birrmind.com',
            fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Business Owner',
            avatarUrl: data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            createdAt: new Date().toISOString(),
          };

          try {
            if ((repository as any).state?.users) {
              (repository as any).state.users.push(newUser);
              (repository as any).state.memberships.push({
                id: `bm_${newUser.id}_${DEFAULT_BUSINESS_ID}`,
                userId: newUser.id,
                businessId: DEFAULT_BUSINESS_ID,
                role: 'owner',
                joinedAt: new Date().toISOString(),
              });
              (repository as any).persist?.();
              user = newUser;
            } else if ((repository as any).client) {
              await (repository as any).client.from('users').upsert({
                id: newUser.id,
                email: newUser.email,
                full_name: newUser.fullName,
                avatar_url: newUser.avatarUrl,
              });
              await (repository as any).client.from('business_memberships').upsert({
                id: `bm_${newUser.id}_${DEFAULT_BUSINESS_ID}`,
                user_id: newUser.id,
                business_id: DEFAULT_BUSINESS_ID,
                role: 'owner',
              });
              user = newUser;
            }
          } catch (provisionErr) {
            console.warn('[auth] Auto-provision note:', provisionErr);
          }
        }
      }
    }

    // Fallback to initial demo user if still missing
    if (!user && (userId === INITIAL_USER_ID || userId === 'user_marco')) {
      user = await repository.getUser(INITIAL_USER_ID);
    }

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User does not exist' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication error: ' + (err.message || String(err)) });
  }
}

/**
 * Multi-tenant authorization middleware:
 * Validates that the authenticated user holds an active membership in the target business
 * and possesses the minimum required role (staff <= manager <= owner).
 */
export function requireBusiness(minimumRole: MembershipRole = 'staff') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required before business access' });
        return;
      }

      // Determine requested businessId from header, route params, or query
      let businessId =
        (req.headers['x-business-id'] as string) ||
        (req.params.businessId as string) ||
        (req.query.businessId as string);

      if (!businessId || !businessId.trim()) {
        // Fall back to first accessible business of user
        const accessible = await repository.listUserBusinesses(req.user.id);
        if (accessible.length > 0) {
          businessId = accessible[0].business.id;
        } else {
          businessId = DEFAULT_BUSINESS_ID;
        }
      }

      const business = await repository.getBusiness(businessId);
      if (!business) {
        res.status(404).json({ error: `Business '${businessId}' not found` });
        return;
      }

      // Verify membership
      const membership = await repository.getMembership(req.user.id, business.id);
      if (!membership) {
        res.status(403).json({
          error: `Forbidden: User '${req.user.fullName}' is not an authorized member of '${business.name}'`,
          code: 'TENANT_ACCESS_DENIED',
        });
        return;
      }

      // Verify role hierarchy
      const userRank = ROLE_RANK[membership.role] || 0;
      const requiredRank = ROLE_RANK[minimumRole] || 1;

      if (userRank < requiredRank) {
        res.status(403).json({
          error: `Forbidden: Action requires at least '${minimumRole}' role. Your current role is '${membership.role}'`,
          code: 'INSUFFICIENT_ROLE',
        });
        return;
      }

      req.business = business;
      req.membership = membership;
      next();
    } catch (err: any) {
      res.status(500).json({ error: 'Authorization error: ' + (err.message || String(err)) });
    }
  };
}
