export type MembershipRole = 'owner' | 'manager' | 'staff';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  type: 'grocery' | 'bakery' | 'cafe' | 'boutique' | 'general';
  currency: string;
  currencySymbol: string;
  targetDailyRevenue: number;
  operatingHours: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessMembership {
  id: string;
  userId: string;
  businessId: string;
  role: MembershipRole;
  joinedAt: string;
  user?: User;
  business?: Business;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku?: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  supplier?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InventoryMovementType = 'sale' | 'restock' | 'return' | 'adjustment' | 'damage' | 'internal_use';
export type InventoryReferenceType = 'transaction' | 'expense' | 'manual_adjustment' | 'stocktake';

export interface InventoryMovement {
  id: string;
  businessId: string;
  productId: string;
  productName?: string;
  type: InventoryMovementType;
  quantityDelta: number; // e.g. -2 for sale, +18 for restock, +3 for correction
  resultingStock: number;
  referenceType: InventoryReferenceType;
  referenceId?: string;
  reason?: string;
  actorUserId?: string;
  actorName?: string;
  createdAt: string;
}

export interface TransactionItem {
  id?: string;
  transactionId?: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  businessId: string;
  actorUserId?: string;
  actorName?: string;
  type: 'sale' | 'refund';
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'digital';
  status: 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 'inventory' | 'utilities' | 'rent' | 'supplies' | 'payroll' | 'marketing' | 'maintenance' | 'other';

export interface Expense {
  id: string;
  businessId: string;
  actorUserId?: string;
  actorName?: string;
  category: ExpenseCategory;
  amount: number;
  vendor: string;
  description: string;
  receiptUrl?: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'digital';
  status: 'cleared' | 'pending';
  createdAt: string;
}

export type BusinessEventType =
  | 'SALE_RECORDED'
  | 'EXPENSE_RECORDED'
  | 'PRODUCT_RESTOCKED'
  | 'STOCK_ADJUSTED'
  | 'PRICE_CHANGED'
  | 'AI_RECOMMENDATION_CREATED'
  | 'RECOMMENDATION_ACCEPTED'
  | 'RECOMMENDATION_REJECTED'
  | 'MEMORY_CREATED';

export type EventSeverity = 'normal' | 'warning' | 'positive' | 'critical';

export interface BusinessEvent {
  id: string;
  businessId: string;
  actorUserId?: string;
  actorName?: string;
  type: BusinessEventType;
  title: string;
  detail: string;
  metadata?: Record<string, any>;
  severity: EventSeverity;
  createdAt: string;
}

export interface BusinessHealth {
  score: number; // 0 - 100
  verdict: 'thriving' | 'stable' | 'attention_needed' | 'at_risk';
  todayRevenue: number;
  todaySalesCount: number;
  todayExpenses: number;
  todayNetProfit: number;
  lowStockItemsCount: number;
  revenueTargetProgress: number; // percentage
  weeklyRevenueTrend: number; // % change vs prior
  inventoryHealthPercentage: number;
}

export type MemoryType =
  | 'customer_preference'
  | 'operating_rhythm'
  | 'supplier_pattern'
  | 'seasonal_trend'
  | 'constraint'
  | 'general';

export interface BusinessMemory {
  id: string;
  businessId: string;
  fact: string;
  type: MemoryType;
  confidence: number; // 0.0 - 1.0
  source: 'manual' | 'observation' | 'conversation';
  status: 'active' | 'archived' | 'disputed';
  createdAt: string;
  lastReferencedAt: string;
}

export type RecommendationType =
  | 'inventory_restock'
  | 'pricing_adjustment'
  | 'expense_saving'
  | 'revenue_opportunity'
  | 'operational_risk';

export type RecommendationActionType =
  | 'restock_product'
  | 'adjust_price'
  | 'log_expense'
  | 'review_catalog'
  | 'manual_action';

export interface AIRecommendation {
  id: string;
  businessId: string;
  type: RecommendationType;
  title: string;
  explanation: string;
  confidence?: number; // 0.0 - 1.0 confidence score
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendedAction: string;
  actionType: RecommendationActionType;
  actionPayload?: Record<string, any>;
  evidence: string[]; // Facts calculated deterministically by server
  requiresConfirmation?: boolean; // Always true for mutations
  status: 'pending' | 'accepted' | 'rejected' | 'executed';
  createdAt: string;
  confirmedByUserId?: string;
  confirmedAt?: string;
}

export interface DailyBriefing {
  headline: string;
  summary: string;
  businessHealth: {
    score: number;
    verdict: string;
    explanation: string;
  };
  keySignals: string[];
  risks: string[];
  opportunities: string[];
  recommendations: AIRecommendation[];
  generatedAt: string;
  isAIGenerated: boolean;
}

export interface AIHealthExplanation {
  healthScore: number;
  healthVerdict: string;
  strengths: string[];
  concerns: string[];
  explanation: string;
  metrics: {
    revenueTargetProgress: number;
    inventoryHealthPercentage: number;
    todayProfit: number;
  };
  isAIGenerated: boolean;
}

export interface BusinessContextForAI {
  businessProfile: {
    id: string;
    name: string;
    type: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    targetDailyRevenue: number;
    operatingHours?: string;
  };
  currentDateTime: string;
  todayRevenue: number;
  recentRevenueTrend: number;
  transactionCount: number;
  estimatedGrossProfit: number;
  netOperatingResult: number;
  expenses: {
    todayTotal: number;
    breakdown: Record<string, number>;
    recent: { amount: number; vendor: string; category: string }[];
  };
  topProducts: { id: string; name: string; unitsSold: number; revenue: number }[];
  slowMovingProducts: { id: string; name: string; currentStock: number; daysWithoutSale: number }[];
  currentStock: {
    totalItems: number;
    totalValuation: number;
  };
  lowStockProducts: { id: string; name: string; currentStock: number; reorderPoint: number; unit: string }[];
  recentInventoryMovements: {
    id: string;
    productName: string;
    type: string;
    quantityDelta: number;
    resultingStock: number;
    reason: string;
    timestamp: string;
  }[];
  relevantBusinessEvents: {
    id: string;
    type: string;
    title: string;
    detail: string;
    severity: string;
    timestamp: string;
  }[];
  targetDailyRevenue: number;
  approvedBusinessMemories: {
    id: string;
    fact: string;
    type: string;
    confidence: number;
  }[];
  recentRecommendations: {
    id: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    actionType: string;
  }[];
}

export interface CopilotChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  deterministicFactsUsed?: string[];
  suggestedFollowUps?: string[];
  relatedAction?: {
    label: string;
    actionType: RecommendationActionType;
    actionPayload: Record<string, any>;
  };
  timestamp: string;
}

export interface BusinessStateSnapshot {
  business: Business;
  user: User;
  membership: BusinessMembership;
  accessibleBusinesses: { business: Business; role: MembershipRole }[];
  products: Product[];
  movements: InventoryMovement[];
  transactions: Transaction[];
  expenses: Expense[];
  events: BusinessEvent[];
  memories: BusinessMemory[];
  recommendations: AIRecommendation[];
  memberships: (BusinessMembership & { user: User })[];
  health: BusinessHealth;
  databaseEngine: 'supabase' | 'local_postgres_compatible';
}
