import fs from 'fs';
import path from 'path';
import {
  User,
  Business,
  BusinessMembership,
  Product,
  Transaction,
  TransactionItem,
  Expense,
  InventoryMovement,
  BusinessEvent,
  MembershipRole,
  BusinessMemory,
  AIRecommendation
} from '../../src/types/index.js';
import { getSupabaseClient, isSupabaseConfigured } from './supabase.js';
import { SupabaseRepository } from './repository.supabase.js';

interface DatabaseState {
  users: User[];
  businesses: Business[];
  memberships: BusinessMembership[];
  products: Product[];
  movements: InventoryMovement[];
  transactions: Transaction[];
  transactionItems: TransactionItem[];
  expenses: Expense[];
  events: BusinessEvent[];
  memories: BusinessMemory[];
  recommendations: AIRecommendation[];
}

const DATA_FILE = path.join(process.cwd(), '.mercato_data.json');

export const INITIAL_USER_ID = 'user_marco';
export const DEFAULT_BUSINESS_ID = 'biz_mercato_pantry';

function getSeedData(): DatabaseState {
  const now = new Date();
  const formatTime = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600 * 1000).toISOString();

  const users: User[] = [
    {
      id: 'user_marco',
      email: 'marco@mercatofoods.com',
      fullName: 'Marco Rossi',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: formatTime(2160),
    },
    {
      id: 'user_elena',
      email: 'elena@mercatofoods.com',
      fullName: 'Elena Bianchi',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      createdAt: formatTime(1440),
    },
    {
      id: 'user_matteo',
      email: 'matteo@mercatofoods.com',
      fullName: 'Matteo Conti',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: formatTime(720),
    },
  ];

  const businesses: Business[] = [
    {
      id: 'biz_mercato_pantry',
      name: 'Mercato Artisan Provisions',
      slug: 'mercato-pantry',
      type: 'grocery',
      currency: 'USD',
      currencySymbol: '$',
      targetDailyRevenue: 650.00,
      operatingHours: '8:00 AM - 7:00 PM',
      createdAt: formatTime(2160),
      updatedAt: formatTime(1),
    },
    {
      id: 'biz_mercato_cafe',
      name: 'Mercato Espresso Bar',
      slug: 'mercato-espresso',
      type: 'cafe',
      currency: 'USD',
      currencySymbol: '$',
      targetDailyRevenue: 450.00,
      operatingHours: '7:00 AM - 4:00 PM',
      createdAt: formatTime(1440),
      updatedAt: formatTime(2),
    },
  ];

  const memberships: BusinessMembership[] = [
    {
      id: 'bm_marco_pantry',
      userId: 'user_marco',
      businessId: 'biz_mercato_pantry',
      role: 'owner',
      joinedAt: formatTime(2160),
    },
    {
      id: 'bm_marco_cafe',
      userId: 'user_marco',
      businessId: 'biz_mercato_cafe',
      role: 'owner',
      joinedAt: formatTime(1440),
    },
    {
      id: 'bm_elena_pantry',
      userId: 'user_elena',
      businessId: 'biz_mercato_pantry',
      role: 'manager',
      joinedAt: formatTime(1440),
    },
    {
      id: 'bm_elena_cafe',
      userId: 'user_elena',
      businessId: 'biz_mercato_cafe',
      role: 'staff',
      joinedAt: formatTime(720),
    },
    {
      id: 'bm_matteo_pantry',
      userId: 'user_matteo',
      businessId: 'biz_mercato_pantry',
      role: 'staff',
      joinedAt: formatTime(720),
    },
  ];

  const products: Product[] = [
    // Pantry business products
    {
      id: 'prod_oil',
      businessId: 'biz_mercato_pantry',
      name: 'Extra Virgin Olive Oil (Cold Pressed 750ml)',
      sku: 'PAN-OIL-750',
      category: 'Pantry',
      costPrice: 9.50,
      sellingPrice: 18.00,
      currentStock: 3, // Below reorder point 6!
      reorderPoint: 6,
      reorderQuantity: 18,
      unit: 'bottle',
      supplier: 'Umbria Imports Co.',
      isActive: true,
      createdAt: formatTime(2160),
      updatedAt: formatTime(2),
    },
    {
      id: 'prod_bread',
      businessId: 'biz_mercato_pantry',
      name: 'Artisan Country Sourdough Loaf',
      sku: 'BAK-SRD-001',
      category: 'Bakery',
      costPrice: 2.20,
      sellingPrice: 6.50,
      currentStock: 7,
      reorderPoint: 5,
      reorderQuantity: 20,
      unit: 'loaf',
      supplier: 'Golden Hearth Bakehouse',
      isActive: true,
      createdAt: formatTime(2160),
      updatedAt: formatTime(1),
    },
    {
      id: 'prod_cheese',
      businessId: 'biz_mercato_pantry',
      name: 'Parmigiano Reggiano DOP (200g)',
      sku: 'DAI-PRM-200',
      category: 'Dairy & Cheese',
      costPrice: 6.00,
      sellingPrice: 12.50,
      currentStock: 14,
      reorderPoint: 8,
      reorderQuantity: 24,
      unit: 'wedge',
      supplier: 'Parma Deli Select',
      isActive: true,
      createdAt: formatTime(2160),
      updatedAt: formatTime(12),
    },
    {
      id: 'prod_coffee',
      businessId: 'biz_mercato_pantry',
      name: 'Signature Espresso Roast Beans (1kg)',
      sku: 'BEV-COF-1KG',
      category: 'Beverages',
      costPrice: 11.00,
      sellingPrice: 22.00,
      currentStock: 5, // Approaching reorder
      reorderPoint: 6,
      reorderQuantity: 15,
      unit: 'bag',
      supplier: 'Torrefazione Roma',
      isActive: true,
      createdAt: formatTime(2160),
      updatedAt: formatTime(8),
    },
    {
      id: 'prod_tomatoes',
      businessId: 'biz_mercato_pantry',
      name: 'San Marzano Peeled Tomatoes (800g)',
      sku: 'PAN-TOM-800',
      category: 'Pantry',
      costPrice: 2.10,
      sellingPrice: 4.80,
      currentStock: 22,
      reorderPoint: 10,
      reorderQuantity: 30,
      unit: 'can',
      supplier: 'Campania Harvest',
      isActive: true,
      createdAt: formatTime(2160),
      updatedAt: formatTime(24),
    },
    {
      id: 'prod_pasta',
      businessId: 'biz_mercato_pantry',
      name: 'Bronze-Cut Tagliatelle Pasta (500g)',
      sku: 'PAN-PAS-500',
      category: 'Pantry',
      costPrice: 2.00,
      sellingPrice: 5.20,
      currentStock: 18,
      reorderPoint: 10,
      reorderQuantity: 25,
      unit: 'box',
      supplier: 'Gragnano Artisans',
      isActive: true,
      createdAt: formatTime(2160),
      updatedAt: formatTime(24),
    },
    {
      id: 'prod_truffle',
      businessId: 'biz_mercato_pantry',
      name: 'Black Truffle Butter (100g)',
      sku: 'SPC-TRF-100',
      category: 'Specialty',
      costPrice: 7.00,
      sellingPrice: 15.50,
      currentStock: 2, // Critical low stock
      reorderPoint: 4,
      reorderQuantity: 10,
      unit: 'jar',
      supplier: 'Tartufi Piemonte',
      isActive: true,
      createdAt: formatTime(2160),
      updatedAt: formatTime(30),
    },
    {
      id: 'prod_croissant',
      businessId: 'biz_mercato_pantry',
      name: 'Butter Croissant (Fresh Baked)',
      sku: 'BAK-CRO-002',
      category: 'Bakery',
      costPrice: 1.10,
      sellingPrice: 3.50,
      currentStock: 12,
      reorderPoint: 8,
      reorderQuantity: 24,
      unit: 'piece',
      supplier: 'Golden Hearth Bakehouse',
      isActive: true,
      createdAt: formatTime(2160),
      updatedAt: formatTime(4),
    },

    // Cafe business products
    {
      id: 'prod_cafe_espresso',
      businessId: 'biz_mercato_cafe',
      name: 'Single Origin Espresso Shot',
      sku: 'CAF-ESP-01',
      category: 'Coffee',
      costPrice: 0.65,
      sellingPrice: 3.25,
      currentStock: 120,
      reorderPoint: 30,
      reorderQuantity: 100,
      unit: 'cup',
      supplier: 'Torrefazione Roma',
      isActive: true,
      createdAt: formatTime(1440),
      updatedAt: formatTime(3),
    },
    {
      id: 'prod_cafe_cappuccino',
      businessId: 'biz_mercato_cafe',
      name: 'Oat Milk Cappuccino',
      sku: 'CAF-CAP-02',
      category: 'Coffee',
      costPrice: 1.15,
      sellingPrice: 5.00,
      currentStock: 85,
      reorderPoint: 25,
      reorderQuantity: 80,
      unit: 'cup',
      supplier: 'Local Dairy & Plant Co.',
      isActive: true,
      createdAt: formatTime(1440),
      updatedAt: formatTime(2),
    },
  ];

  const movements: InventoryMovement[] = [
    {
      id: 'mov_01',
      businessId: 'biz_mercato_pantry',
      productId: 'prod_oil',
      productName: 'Extra Virgin Olive Oil (Cold Pressed 750ml)',
      type: 'restock',
      quantityDelta: 12,
      resultingStock: 15,
      referenceType: 'expense',
      referenceId: 'exp_init_oil',
      reason: 'Regular weekly delivery from Umbria Imports',
      actorUserId: 'user_elena',
      actorName: 'Elena Bianchi',
      createdAt: formatTime(72),
    },
    {
      id: 'mov_02',
      businessId: 'biz_mercato_pantry',
      productId: 'prod_oil',
      productName: 'Extra Virgin Olive Oil (Cold Pressed 750ml)',
      type: 'sale',
      quantityDelta: -1,
      resultingStock: 3,
      referenceType: 'transaction',
      referenceId: 'tx_02',
      reason: 'Sale recorded',
      actorUserId: 'user_marco',
      actorName: 'Marco Rossi',
      createdAt: formatTime(1.5),
    },
    {
      id: 'mov_03',
      businessId: 'biz_mercato_pantry',
      productId: 'prod_truffle',
      productName: 'Black Truffle Butter (100g)',
      type: 'adjustment',
      quantityDelta: -1,
      resultingStock: 2,
      referenceType: 'manual_adjustment',
      reason: 'Damaged seal found during morning audit',
      actorUserId: 'user_elena',
      actorName: 'Elena Bianchi',
      createdAt: formatTime(26),
    },
    {
      id: 'mov_04',
      businessId: 'biz_mercato_pantry',
      productId: 'prod_bread',
      productName: 'Artisan Country Sourdough Loaf',
      type: 'sale',
      quantityDelta: -2,
      resultingStock: 7,
      referenceType: 'transaction',
      referenceId: 'tx_01',
      reason: 'Sale recorded',
      actorUserId: 'user_matteo',
      actorName: 'Matteo Conti',
      createdAt: formatTime(3),
    },
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx_01',
      businessId: 'biz_mercato_pantry',
      actorUserId: 'user_matteo',
      actorName: 'Matteo Conti',
      type: 'sale',
      subtotal: 35.00,
      tax: 0.00,
      totalAmount: 35.00,
      paymentMethod: 'card',
      status: 'completed',
      notes: 'Customer requested whole sourdough un-sliced',
      createdAt: formatTime(3),
      items: [
        {
          id: 'txi_01',
          transactionId: 'tx_01',
          productId: 'prod_bread',
          name: 'Artisan Country Sourdough Loaf',
          quantity: 2,
          unitPrice: 6.50,
          costPrice: 2.20,
          subtotal: 13.00,
        },
        {
          id: 'txi_02',
          transactionId: 'tx_01',
          productId: 'prod_coffee',
          name: 'Signature Espresso Roast Beans (1kg)',
          quantity: 1,
          unitPrice: 22.00,
          costPrice: 11.00,
          subtotal: 22.00,
        },
      ],
    },
    {
      id: 'tx_02',
      businessId: 'biz_mercato_pantry',
      actorUserId: 'user_marco',
      actorName: 'Marco Rossi',
      type: 'sale',
      subtotal: 42.80,
      tax: 0.00,
      totalAmount: 42.80,
      paymentMethod: 'cash',
      status: 'completed',
      notes: 'Pantry dinner recipe bundle',
      createdAt: formatTime(1.5),
      items: [
        {
          id: 'txi_03',
          transactionId: 'tx_02',
          productId: 'prod_oil',
          name: 'Extra Virgin Olive Oil (Cold Pressed 750ml)',
          quantity: 1,
          unitPrice: 18.00,
          costPrice: 9.50,
          subtotal: 18.00,
        },
        {
          id: 'txi_04',
          transactionId: 'tx_02',
          productId: 'prod_tomatoes',
          name: 'San Marzano Peeled Tomatoes (800g)',
          quantity: 3,
          unitPrice: 4.80,
          costPrice: 2.10,
          subtotal: 14.40,
        },
        {
          id: 'txi_05',
          transactionId: 'tx_02',
          productId: 'prod_pasta',
          name: 'Bronze-Cut Tagliatelle Pasta (500g)',
          quantity: 2,
          unitPrice: 5.20,
          costPrice: 2.00,
          subtotal: 10.40,
        },
      ],
    },
    {
      id: 'tx_03',
      businessId: 'biz_mercato_pantry',
      actorUserId: 'user_elena',
      actorName: 'Elena Bianchi',
      type: 'sale',
      subtotal: 20.50,
      tax: 0.00,
      totalAmount: 20.50,
      paymentMethod: 'digital',
      status: 'completed',
      notes: 'Morning pastry run',
      createdAt: formatTime(0.8),
      items: [
        {
          id: 'txi_06',
          transactionId: 'tx_03',
          productId: 'prod_croissant',
          name: 'Butter Croissant (Fresh Baked)',
          quantity: 4,
          unitPrice: 3.50,
          costPrice: 1.10,
          subtotal: 14.00,
        },
        {
          id: 'txi_07',
          transactionId: 'tx_03',
          productId: 'prod_bread',
          name: 'Artisan Country Sourdough Loaf',
          quantity: 1,
          unitPrice: 6.50,
          costPrice: 2.20,
          subtotal: 6.50,
        },
      ],
    },
  ];

  const transactionItems: TransactionItem[] = transactions.flatMap(t => t.items);

  const expenses: Expense[] = [
    {
      id: 'exp_01',
      businessId: 'biz_mercato_pantry',
      actorUserId: 'user_marco',
      actorName: 'Marco Rossi',
      category: 'inventory',
      amount: 110.00,
      vendor: 'Golden Hearth Bakehouse',
      description: 'Morning fresh bakery delivery (Sourdough & Croissants restock)',
      paymentMethod: 'transfer',
      status: 'cleared',
      createdAt: formatTime(7),
    },
    {
      id: 'exp_02',
      businessId: 'biz_mercato_pantry',
      actorUserId: 'user_elena',
      actorName: 'Elena Bianchi',
      category: 'supplies',
      amount: 24.50,
      vendor: 'EcoPackaging Direct',
      description: 'Kraft paper carrier bags & greaseproof pastry wraps',
      paymentMethod: 'card',
      status: 'cleared',
      createdAt: formatTime(20),
    },
  ];

  const events: BusinessEvent[] = [
    {
      id: 'evt_01',
      businessId: 'biz_mercato_pantry',
      actorUserId: 'user_marco',
      actorName: 'Marco Rossi',
      type: 'STOCK_ADJUSTED',
      title: 'Low Stock Threshold Reached',
      detail: 'Extra Virgin Olive Oil inventory dropped to 3 bottles (Reorder point: 6).',
      metadata: { productId: 'prod_oil', remainingStock: 3, reorderPoint: 6 },
      severity: 'warning',
      createdAt: formatTime(1.5),
    },
    {
      id: 'evt_02',
      businessId: 'biz_mercato_pantry',
      actorUserId: 'user_marco',
      actorName: 'Marco Rossi',
      type: 'SALE_RECORDED',
      title: 'Cash Sale Completed: $42.80',
      detail: 'Processed checkout with 3 items (EVOO, San Marzano Tomatoes, Tagliatelle).',
      metadata: { transactionId: 'tx_02', totalAmount: 42.80, paymentMethod: 'cash' },
      severity: 'positive',
      createdAt: formatTime(1.5),
    },
    {
      id: 'evt_03',
      businessId: 'biz_mercato_pantry',
      actorUserId: 'user_elena',
      actorName: 'Elena Bianchi',
      type: 'PRODUCT_RESTOCKED',
      title: 'Inventory Restocked: Extra Virgin Olive Oil',
      detail: 'Added 12 bottles to inventory ledger from Umbria Imports delivery.',
      metadata: { productId: 'prod_oil', quantityAdded: 12, resultingStock: 15 },
      severity: 'positive',
      createdAt: formatTime(72),
    },
  ];

  const memories: BusinessMemory[] = [
    {
      id: 'mem_pantry_1',
      businessId: 'biz_mercato_pantry',
      fact: 'Peak demand for premium extra virgin olive oil and pasta occurs on Thursday and Friday afternoons before the weekend.',
      type: 'customer_preference',
      confidence: 0.95,
      source: 'observation',
      status: 'active',
      createdAt: formatTime(240),
      lastReferencedAt: formatTime(12),
    },
    {
      id: 'mem_pantry_2',
      businessId: 'biz_mercato_pantry',
      fact: 'Parmigiano Reggiano 24-month rounds take 3-4 business days for refrigerated delivery from Parma Imports.',
      type: 'supplier_pattern',
      confidence: 0.90,
      source: 'manual',
      status: 'active',
      createdAt: formatTime(300),
      lastReferencedAt: formatTime(24),
    },
    {
      id: 'mem_pantry_3',
      businessId: 'biz_mercato_pantry',
      fact: 'Dry pasta sales increase by ~30% whenever artisanal tomato passata is displayed nearby.',
      type: 'operating_rhythm',
      confidence: 0.85,
      source: 'observation',
      status: 'active',
      createdAt: formatTime(180),
      lastReferencedAt: formatTime(48),
    },
    {
      id: 'mem_cafe_1',
      businessId: 'biz_mercato_cafe',
      fact: 'Morning rush between 7:30 AM and 9:30 AM drives 65% of daily espresso bean consumption.',
      type: 'operating_rhythm',
      confidence: 0.95,
      source: 'observation',
      status: 'active',
      createdAt: formatTime(200),
      lastReferencedAt: formatTime(6),
    }
  ];

  const recommendations: AIRecommendation[] = [
    {
      id: 'rec_pantry_1',
      businessId: 'biz_mercato_pantry',
      type: 'inventory_restock',
      title: 'Restock Extra Virgin Olive Oil (Cold Pressed 750ml)',
      explanation: 'Current stock is down to 3 bottles, breaching the safety reorder threshold of 6. High weekend demand projected.',
      priority: 'high',
      recommendedAction: 'Restock 12 bottles from Umbria Imports to ensure stock availability.',
      actionType: 'restock_product',
      actionPayload: {
        productId: 'prod_oil',
        quantity: 12,
        costPrice: 11.00,
        vendor: 'Umbria Imports',
        recordExpense: true,
        paymentMethod: 'card'
      },
      evidence: [
        'Current stock: 3 bottles',
        'Reorder point: 6 bottles',
        'Weekend olive oil demand surge identified in store memories'
      ],
      status: 'pending',
      createdAt: formatTime(4),
    }
  ];

  return {
    users,
    businesses,
    memberships,
    products,
    movements,
    transactions,
    transactionItems,
    expenses,
    events,
    memories,
    recommendations,
  };
}

class DatabaseRepository {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.businesses && parsed.memberships) {
          if (!parsed.memories || parsed.memories.length === 0) {
            parsed.memories = getSeedData().memories;
          }
          if (!parsed.recommendations || parsed.recommendations.length === 0) {
            parsed.recommendations = getSeedData().recommendations;
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing database file, seeding new database state:', err);
    }

    const seed = getSeedData();
    this.persist(seed);
    return seed;
  }

  private persist(data: DatabaseState = this.state): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database state to disk:', err);
    }
  }

  // --- Users & Multi-Tenant RBAC ---

  public async getUser(userId: string): Promise<User | null> {
    return this.state.users.find(u => u.id === userId) || null;
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public async getBusiness(businessId: string): Promise<Business | null> {
    return this.state.businesses.find(b => b.id === businessId) || null;
  }

  public async listUserBusinesses(userId: string): Promise<{ business: Business; role: MembershipRole }[]> {
    const userMemberships = this.state.memberships.filter(m => m.userId === userId);
    const result: { business: Business; role: MembershipRole }[] = [];

    for (const mem of userMemberships) {
      const biz = this.state.businesses.find(b => b.id === mem.businessId);
      if (biz) {
        result.push({ business: biz, role: mem.role });
      }
    }

    return result;
  }

  public async getMembership(userId: string, businessId: string): Promise<BusinessMembership | null> {
    return this.state.memberships.find(m => m.userId === userId && m.businessId === businessId) || null;
  }

  public async listMemberships(businessId: string): Promise<(BusinessMembership & { user: User })[]> {
    const mems = this.state.memberships.filter(m => m.businessId === businessId);
    return mems.map(m => ({
      ...m,
      user: this.state.users.find(u => u.id === m.userId)!,
    })).filter(m => Boolean(m.user));
  }

  public async createMembership(params: { userId: string; businessId: string; role: MembershipRole }): Promise<BusinessMembership> {
    const existing = await this.getMembership(params.userId, params.businessId);
    if (existing) {
      existing.role = params.role;
      this.persist();
      return existing;
    }

    const membership: BusinessMembership = {
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      businessId: params.businessId,
      role: params.role,
      joinedAt: new Date().toISOString(),
    };

    this.state.memberships.push(membership);
    this.persist();
    return membership;
  }

  public async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.state.users.push(newUser);
    this.persist();
    return newUser;
  }

  // --- Products Catalog ---

  public async getProducts(businessId: string): Promise<Product[]> {
    return this.state.products.filter(p => p.businessId === businessId && p.isActive);
  }

  public async getProduct(businessId: string, productId: string): Promise<Product | null> {
    return this.state.products.find(p => p.businessId === businessId && p.id === productId) || null;
  }

  public async createProduct(businessId: string, product: Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Product> {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.state.products.push(newProduct);
    this.persist();
    return newProduct;
  }

  public async updateProduct(businessId: string, productId: string, updates: Partial<Product>): Promise<Product | null> {
    const prod = this.state.products.find(p => p.businessId === businessId && p.id === productId);
    if (!prod) return null;

    Object.assign(prod, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return prod;
  }

  // --- Inventory Movements Ledger (Audit of Truth) ---

  public async recordInventoryMovement(movement: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<InventoryMovement> {
    const newMovement: InventoryMovement = {
      ...movement,
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    this.state.movements.unshift(newMovement);
    this.persist();
    return newMovement;
  }

  public async getInventoryMovements(businessId: string, limit: number = 50): Promise<InventoryMovement[]> {
    return this.state.movements.filter(m => m.businessId === businessId).slice(0, limit);
  }

  // --- Transactions ---

  public async createTransaction(
    tx: Omit<Transaction, 'id' | 'createdAt' | 'items'>,
    items: Omit<TransactionItem, 'id' | 'transactionId'>[]
  ): Promise<Transaction> {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const createdItems: TransactionItem[] = items.map((item, idx) => ({
      ...item,
      id: `txi_${Date.now()}_${idx}`,
      transactionId: txId,
    }));

    const newTransaction: Transaction = {
      ...tx,
      id: txId,
      items: createdItems,
      createdAt: now,
    };

    this.state.transactions.unshift(newTransaction);
    this.state.transactionItems.push(...createdItems);
    this.persist();
    return newTransaction;
  }

  public async getTransactions(businessId: string, limit: number = 50): Promise<Transaction[]> {
    return this.state.transactions.filter(t => t.businessId === businessId).slice(0, limit);
  }

  // --- Expenses ---

  public async createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const newExpense: Expense = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    this.state.expenses.unshift(newExpense);
    this.persist();
    return newExpense;
  }

  public async getExpenses(businessId: string, limit: number = 50): Promise<Expense[]> {
    return this.state.expenses.filter(e => e.businessId === businessId).slice(0, limit);
  }

  // --- Business Events (Immutable Audit Log) ---

  public async createBusinessEvent(event: Omit<BusinessEvent, 'id' | 'createdAt'>): Promise<BusinessEvent> {
    const newEvent: BusinessEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    this.state.events.unshift(newEvent);
    if (this.state.events.length > 200) {
      this.state.events = this.state.events.slice(0, 200);
    }
    this.persist();
    return newEvent;
  }

  public async getBusinessEvents(businessId: string, limit: number = 50): Promise<BusinessEvent[]> {
    return this.state.events.filter(e => e.businessId === businessId).slice(0, limit);
  }

  // --- Business Memories ---

  public async getMemories(businessId: string, limit: number = 50): Promise<BusinessMemory[]> {
    return (this.state.memories || [])
      .filter(m => m.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public async getMemory(businessId: string, id: string): Promise<BusinessMemory | null> {
    return (this.state.memories || []).find(m => m.businessId === businessId && m.id === id) || null;
  }

  public async createMemory(memory: Omit<BusinessMemory, 'id' | 'createdAt' | 'lastReferencedAt'>): Promise<BusinessMemory> {
    const now = new Date().toISOString();
    const newMemory: BusinessMemory = {
      ...memory,
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      lastReferencedAt: now,
    };

    if (!this.state.memories) this.state.memories = [];
    this.state.memories.unshift(newMemory);
    this.persist();
    return newMemory;
  }

  public async updateMemory(
    businessId: string,
    id: string,
    updates: Partial<Pick<BusinessMemory, 'fact' | 'type' | 'confidence' | 'status' | 'lastReferencedAt'>>
  ): Promise<BusinessMemory | null> {
    const memory = await this.getMemory(businessId, id);
    if (!memory) return null;

    Object.assign(memory, updates);
    this.persist();
    return memory;
  }

  public async deleteMemory(businessId: string, id: string): Promise<boolean> {
    const initialLen = (this.state.memories || []).length;
    this.state.memories = (this.state.memories || []).filter(m => !(m.businessId === businessId && m.id === id));
    if (this.state.memories.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- AI Recommendations ---

  public async getRecommendations(
    businessId: string,
    status?: 'pending' | 'accepted' | 'rejected' | 'executed'
  ): Promise<AIRecommendation[]> {
    return (this.state.recommendations || [])
      .filter(r => r.businessId === businessId && (!status || r.status === status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getRecommendation(businessId: string, id: string): Promise<AIRecommendation | null> {
    return (this.state.recommendations || []).find(r => r.businessId === businessId && r.id === id) || null;
  }

  public async createRecommendation(
    recommendation: Omit<AIRecommendation, 'id' | 'createdAt'>
  ): Promise<AIRecommendation> {
    const newRec: AIRecommendation = {
      ...recommendation,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    if (!this.state.recommendations) this.state.recommendations = [];
    this.state.recommendations.unshift(newRec);
    this.persist();
    return newRec;
  }

  public async updateRecommendation(
    businessId: string,
    id: string,
    updates: Partial<Pick<AIRecommendation, 'status' | 'confirmedByUserId' | 'confirmedAt'>>
  ): Promise<AIRecommendation | null> {
    const rec = await this.getRecommendation(businessId, id);
    if (!rec) return null;

    Object.assign(rec, updates);
    this.persist();
    return rec;
  }

  // --- Reset Seed ---

  public resetDemoData(): void {
    this.state = getSeedData();
    this.persist(this.state);
  }
}

export const repository = isSupabaseConfigured()
  ? new SupabaseRepository() as unknown as DatabaseRepository // duck typing for now
  : new DatabaseRepository();

