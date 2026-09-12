import {
  User,
  Business,
  BusinessMembership,
  Product,
  Transaction,
  Expense,
  InventoryMovement,
  BusinessEvent,
  BusinessHealth,
  BusinessStateSnapshot,
  MembershipRole,
  BusinessMemory,
  AIRecommendation,
  DailyBriefing,
  AIHealthExplanation,
  BusinessContextForAI,
} from '../types/index.js';

let currentUserId = 'user_marco';
let currentBusinessId = 'biz_mercato_pantry';

export function setApiContext(userId?: string, businessId?: string) {
  if (userId) currentUserId = userId;
  if (businessId) currentBusinessId = businessId;
}

export function getApiContext() {
  return { userId: currentUserId, businessId: currentBusinessId };
}

const getHeaders = (userId?: string, businessId?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-user-id': userId || currentUserId,
    'x-business-id': businessId || currentBusinessId,
  };
  return headers;
};

export const api = {
  async getHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getMe(userId?: string): Promise<{
    user: User;
    accessibleBusinesses: { business: Business; role: MembershipRole }[];
    defaultBusinessId: string | null;
  }> {
    const res = await fetch('/api/auth/me', {
      headers: getHeaders(userId),
    });
    if (!res.ok) throw new Error('Failed to load user auth context');
    return res.json();
  },

  async getState(userId?: string, businessId?: string): Promise<BusinessStateSnapshot> {
    const res = await fetch('/api/business/state', {
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load business state' }));
      throw new Error(err.error || 'Failed to load business state');
    }
    return res.json();
  },

  async getProducts(userId?: string, businessId?: string): Promise<Product[]> {
    const res = await fetch('/api/products', {
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  },

  async createProduct(
    productData: Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'isActive'>,
    userId?: string,
    businessId?: string
  ): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create product' }));
      throw new Error(err.error || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(
    productId: string,
    updates: Partial<Product>,
    userId?: string,
    businessId?: string
  ): Promise<Product> {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update product' }));
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  async recordSale(
    data: {
      items: { productId?: string; name: string; quantity: number; unitPrice: number }[];
      paymentMethod: 'cash' | 'card' | 'transfer' | 'digital';
      notes?: string;
    },
    userId?: string,
    businessId?: string
  ): Promise<{
    transaction: Transaction;
    affectedProducts: Product[];
    movements: InventoryMovement[];
    events: BusinessEvent[];
  }> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to record transaction' }));
      throw new Error(err.error || 'Failed to record transaction');
    }
    return res.json();
  },

  async adjustStock(
    data: {
      productId: string;
      quantityDelta?: number;
      newStock?: number;
      type: 'adjustment' | 'restock' | 'return' | 'damage' | 'internal_use';
      reason: string;
    },
    userId?: string,
    businessId?: string
  ): Promise<{
    product: Product;
    movement: InventoryMovement;
    event: BusinessEvent;
  }> {
    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to adjust stock' }));
      throw new Error(err.error || 'Failed to adjust stock');
    }
    return res.json();
  },

  async restockProduct(
    data: {
      productId: string;
      quantity: number;
      costPrice?: number;
      vendor?: string;
      recordExpense: boolean;
      paymentMethod?: 'cash' | 'card' | 'transfer' | 'digital';
    },
    userId?: string,
    businessId?: string
  ): Promise<{
    product: Product;
    movement: InventoryMovement;
    expense?: Expense;
    events: BusinessEvent[];
  }> {
    const res = await fetch('/api/inventory/restock', {
      method: 'POST',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to restock product' }));
      throw new Error(err.error || 'Failed to restock product');
    }
    return res.json();
  },

  async recordExpense(
    data: {
      category: string;
      amount: number;
      vendor: string;
      description: string;
      paymentMethod: 'cash' | 'card' | 'transfer' | 'digital';
    },
    userId?: string,
    businessId?: string
  ): Promise<Expense> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to record expense' }));
      throw new Error(err.error || 'Failed to record expense');
    }
    return res.json();
  },

  async addMembership(
    data: { email: string; fullName?: string; role: MembershipRole },
    userId?: string,
    businessId?: string
  ): Promise<{ membership: BusinessMembership; user: User }> {
    const res = await fetch('/api/memberships', {
      method: 'POST',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add team member' }));
      throw new Error(err.error || 'Failed to add team member');
    }
    return res.json();
  },

  async resetDemoData(userId?: string, businessId?: string): Promise<void> {
    const res = await fetch('/api/demo/reset', {
      method: 'POST',
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to reset demo data' }));
      throw new Error(err.error || 'Failed to reset demo data');
    }
  },

  // --- Phase 2: AI Business Brain Methods ---

  async getAIContext(userId?: string, businessId?: string): Promise<BusinessContextForAI> {
    const res = await fetch('/api/ai/context', {
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load business context' }));
      throw new Error(err.error || 'Failed to load business context');
    }
    return res.json();
  },

  async getAIBriefing(userId?: string, businessId?: string): Promise<DailyBriefing> {
    const res = await fetch('/api/ai/briefing', {
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load briefing' }));
      throw new Error(err.error || 'Failed to load briefing');
    }
    return res.json();
  },

  async getAIHealth(userId?: string, businessId?: string): Promise<AIHealthExplanation> {
    const res = await fetch('/api/ai/health', {
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load health explanation' }));
      throw new Error(err.error || 'Failed to load health explanation');
    }
    return res.json();
  },

  async getAIRecommendations(
    status?: 'pending' | 'accepted' | 'rejected',
    userId?: string,
    businessId?: string
  ): Promise<AIRecommendation[]> {
    const url = status ? `/api/ai/recommendations?status=${status}` : '/api/ai/recommendations';
    const res = await fetch(url, {
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load recommendations' }));
      throw new Error(err.error || 'Failed to load recommendations');
    }
    return res.json();
  },

  async confirmRecommendation(
    id: string,
    userId?: string,
    businessId?: string
  ): Promise<{ success: boolean; recommendation: AIRecommendation; executionResult: any }> {
    const res = await fetch(`/api/ai/recommendations/${id}/confirm`, {
      method: 'POST',
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to confirm recommendation' }));
      throw new Error(err.error || 'Failed to confirm recommendation');
    }
    return res.json();
  },

  async rejectRecommendation(
    id: string,
    userId?: string,
    businessId?: string
  ): Promise<{ success: boolean; recommendation: AIRecommendation }> {
    const res = await fetch(`/api/ai/recommendations/${id}/reject`, {
      method: 'POST',
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to reject recommendation' }));
      throw new Error(err.error || 'Failed to reject recommendation');
    }
    return res.json();
  },

  async getAIMemories(limit: number = 50, userId?: string, businessId?: string): Promise<BusinessMemory[]> {
    const res = await fetch(`/api/ai/memories?limit=${limit}`, {
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load memories' }));
      throw new Error(err.error || 'Failed to load memories');
    }
    return res.json();
  },

  async createAIMemory(
    data: { fact: string; type?: string; confidence?: number; source?: string },
    userId?: string,
    businessId?: string
  ): Promise<BusinessMemory> {
    const res = await fetch('/api/ai/memories', {
      method: 'POST',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create memory' }));
      throw new Error(err.error || 'Failed to create memory');
    }
    return res.json();
  },

  async updateAIMemory(
    id: string,
    data: Partial<BusinessMemory>,
    userId?: string,
    businessId?: string
  ): Promise<BusinessMemory> {
    const res = await fetch(`/api/ai/memories/${id}`, {
      method: 'PATCH',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update memory' }));
      throw new Error(err.error || 'Failed to update memory');
    }
    return res.json();
  },

  async deleteAIMemory(id: string, userId?: string, businessId?: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/ai/memories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(userId, businessId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete memory' }));
      throw new Error(err.error || 'Failed to delete memory');
    }
    return res.json();
  },

  async askCopilot(
    message: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId?: string,
    businessId?: string
  ): Promise<{
    answer: string;
    deterministicFactsUsed: string[];
    suggestedFollowUps: string[];
    relatedAction?: any;
  }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: getHeaders(userId, businessId),
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Copilot query failed' }));
      throw new Error(err.error || 'Copilot query failed');
    }
    return res.json();
  },
};
