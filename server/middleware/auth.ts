import { Request, Response, NextFunction } from 'express';
import { repository, INITIAL_USER_ID, DEFAULT_BUSINESS_ID } from '../db/repository.js';
import { getSupabaseClient } from '../db/supabase.js';
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
    
    // In production, we ONLY trust the Authorization header JWT from Supabase
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

    if (!isProduction && !userId) {
      // Allow demo user fallback ONLY in non-production environments
      userId = (req.headers['x-user-id'] as string) || INITIAL_USER_ID;
    }

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const user = await repository.getUser(userId);
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
