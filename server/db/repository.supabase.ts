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
import { getSupabaseClient } from './supabase.js';

export class SupabaseRepository {
  
  private get db() {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase is not configured.");
    return client;
  }

  // --- Users & Multi-Tenant RBAC ---

  public async getUser(userId: string): Promise<User | null> {
    const { data, error } = await this.db.from('users').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
    };
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.db.from('users').select('*').eq('email', email).single();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
    };
  }

  public async getBusiness(businessId: string): Promise<Business | null> {
    const { data, error } = await this.db.from('businesses').select('*').eq('id', businessId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      type: data.type,
      currency: data.currency,
      currencySymbol: data.currency_symbol,
      targetDailyRevenue: data.target_daily_revenue,
      operatingHours: data.operating_hours,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  public async listUserBusinesses(userId: string): Promise<{ business: Business; role: MembershipRole }[]> {
    const { data, error } = await this.db
      .from('business_memberships')
      .select('role, businesses(*)')
      .eq('user_id', userId);
    
    if (error || !data) return [];
    
    return data.map((row: any) => ({
      role: row.role as MembershipRole,
      business: {
        id: row.businesses.id,
        name: row.businesses.name,
        slug: row.businesses.slug,
        type: row.businesses.type,
        currency: row.businesses.currency,
        currencySymbol: row.businesses.currency_symbol,
        targetDailyRevenue: row.businesses.target_daily_revenue,
        operatingHours: row.businesses.operating_hours,
        createdAt: row.businesses.created_at,
        updatedAt: row.businesses.updated_at,
      }
    }));
  }

  public async getMembership(userId: string, businessId: string): Promise<BusinessMembership | null> {
    const { data, error } = await this.db
      .from('business_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single();
    
    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      businessId: data.business_id,
      role: data.role as MembershipRole,
      joinedAt: data.joined_at,
    };
  }

  public async listMemberships(businessId: string): Promise<(BusinessMembership & { user: User })[]> {
    const { data, error } = await this.db
      .from('business_memberships')
      .select('*, users(*)')
      .eq('business_id', businessId);
      
    if (error || !data) return [];
    
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      businessId: row.business_id,
      role: row.role as MembershipRole,
      joinedAt: row.joined_at,
      user: {
        id: row.users.id,
        email: row.users.email,
        fullName: row.users.full_name,
        avatarUrl: row.users.avatar_url,
        createdAt: row.users.created_at,
      }
    }));
  }

  public async createMembership(params: { userId: string; businessId: string; role: MembershipRole }): Promise<BusinessMembership> {
    const { data, error } = await this.db
      .from('business_memberships')
      .upsert({ user_id: params.userId, business_id: params.businessId, role: params.role })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      businessId: data.business_id,
      role: data.role,
      joinedAt: data.joined_at,
    };
  }

  public async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data, error } = await this.db
      .from('users')
      .insert({ email: user.email, full_name: user.fullName, avatar_url: user.avatarUrl })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
    };
  }

  // --- Products Catalog ---

  public async getProducts(businessId: string): Promise<Product[]> {
    const { data, error } = await this.db
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);
      
    if (error) return [];
    return data.map(this.mapProduct);
  }

  public async getProduct(businessId: string, productId: string): Promise<Product | null> {
    const { data, error } = await this.db
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', productId)
      .single();
      
    if (error || !data) return null;
    return this.mapProduct(data);
  }

  public async createProduct(businessId: string, product: Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Product> {
    const { data, error } = await this.db
      .from('products')
      .insert({
        business_id: businessId,
        name: product.name,
        sku: product.sku,
        category: product.category,
        cost_price: product.costPrice,
        selling_price: product.sellingPrice,
        current_stock: product.currentStock,
        reorder_point: product.reorderPoint,
        reorder_quantity: product.reorderQuantity,
        unit: product.unit,
        supplier: product.supplier,
        is_active: true
      })
      .select()
      .single();
      
    if (error) throw error;
    return this.mapProduct(data);
  }

  public async updateProduct(businessId: string, productId: string, updates: Partial<Product>): Promise<Product | null> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
    if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;
    if (updates.reorderPoint !== undefined) dbUpdates.reorder_point = updates.reorderPoint;
    if (updates.reorderQuantity !== undefined) dbUpdates.reorder_quantity = updates.reorderQuantity;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await this.db
      .from('products')
      .update(dbUpdates)
      .eq('id', productId)
      .eq('business_id', businessId)
      .select()
      .single();
      
    if (error || !data) return null;
    return this.mapProduct(data);
  }

  private mapProduct(data: any): Product {
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      sku: data.sku,
      category: data.category,
      costPrice: Number(data.cost_price),
      sellingPrice: Number(data.selling_price),
      currentStock: data.current_stock,
      reorderPoint: data.reorder_point,
      reorderQuantity: data.reorder_quantity,
      unit: data.unit,
      supplier: data.supplier,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // --- Inventory Movements Ledger ---

  public async recordInventoryMovement(movement: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<InventoryMovement> {
    const { data, error } = await this.db
      .from('inventory_movements')
      .insert({
        business_id: movement.businessId,
        product_id: movement.productId,
        product_name: movement.productName,
        type: movement.type,
        quantity_delta: movement.quantityDelta,
        resulting_stock: movement.resultingStock,
        reference_type: movement.referenceType,
        reference_id: movement.referenceId,
        reason: movement.reason,
        actor_user_id: movement.actorUserId,
        actor_name: movement.actorName
      })
      .select()
      .single();
      
    if (error) throw error;
    return this.mapMovement(data);
  }

  public async getRecentMovements(businessId: string, limit = 50): Promise<InventoryMovement[]> {
    const { data, error } = await this.db
      .from('inventory_movements')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) return [];
    return data.map(this.mapMovement);
  }

  private mapMovement(data: any): InventoryMovement {
    return {
      id: data.id,
      businessId: data.business_id,
      productId: data.product_id,
      productName: data.product_name,
      type: data.type,
      quantityDelta: Number(data.quantity_delta),
      resultingStock: Number(data.resulting_stock),
      referenceType: data.reference_type,
      referenceId: data.reference_id,
      reason: data.reason,
      actorUserId: data.actor_user_id,
      actorName: data.actor_name,
      createdAt: data.created_at,
    };
  }

  // --- Point of Sale (Transactions) ---

  public async createTransaction(businessId: string, txData: Omit<Transaction, 'id' | 'createdAt' | 'status' | 'items'>, items: Omit<TransactionItem, 'id' | 'transactionId'>[]): Promise<Transaction> {
    const { data: tx, error: txError } = await this.db
      .from('transactions')
      .insert({
        business_id: businessId,
        actor_user_id: txData.actorUserId,
        actor_name: txData.actorName,
        type: txData.type,
        subtotal: txData.subtotal,
        tax: txData.tax,
        total_amount: txData.totalAmount,
        payment_method: txData.paymentMethod,
        notes: txData.notes,
        status: 'completed'
      })
      .select()
      .single();
      
    if (txError) throw txError;
    
    const dbItems = items.map(item => ({
      transaction_id: tx.id,
      product_id: item.productId,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      cost_price: item.costPrice,
      subtotal: item.subtotal
    }));
    
    const { data: insertedItems, error: itemsError } = await this.db
      .from('transaction_items')
      .insert(dbItems)
      .select();
      
    if (itemsError) throw itemsError;
    
    return this.mapTransaction(tx, insertedItems);
  }

  public async getRecentTransactions(businessId: string, limit = 100): Promise<Transaction[]> {
    const { data, error } = await this.db
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) return [];
    return data.map((tx: any) => this.mapTransaction(tx, tx.transaction_items));
  }

  private mapTransaction(tx: any, items: any[]): Transaction {
    return {
      id: tx.id,
      businessId: tx.business_id,
      actorUserId: tx.actor_user_id,
      actorName: tx.actor_name,
      type: tx.type,
      subtotal: Number(tx.subtotal),
      tax: Number(tx.tax),
      totalAmount: Number(tx.total_amount),
      paymentMethod: tx.payment_method,
      status: tx.status,
      notes: tx.notes,
      createdAt: tx.created_at,
      items: (items || []).map((item: any) => ({
        id: item.id,
        transactionId: item.transaction_id,
        productId: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        costPrice: Number(item.cost_price),
        subtotal: Number(item.subtotal),
      }))
    };
  }

  // --- Expenses & Operating Costs ---

  public async createExpense(businessId: string, expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const { data, error } = await this.db
      .from('expenses')
      .insert({
        business_id: businessId,
        actor_user_id: expense.actorUserId,
        actor_name: expense.actorName,
        category: expense.category,
        amount: expense.amount,
        vendor: expense.vendor,
        description: expense.description,
        payment_method: expense.paymentMethod,
        status: expense.status
      })
      .select()
      .single();
      
    if (error) throw error;
    return this.mapExpense(data);
  }

  public async getRecentExpenses(businessId: string, limit = 50): Promise<Expense[]> {
    const { data, error } = await this.db
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) return [];
    return data.map(this.mapExpense);
  }

  private mapExpense(data: any): Expense {
    return {
      id: data.id,
      businessId: data.business_id,
      actorUserId: data.actor_user_id,
      actorName: data.actor_name,
      category: data.category,
      amount: Number(data.amount),
      vendor: data.vendor,
      description: data.description,
      paymentMethod: data.payment_method,
      status: data.status,
      createdAt: data.created_at,
    };
  }

  // --- Business Events & Notifications ---

  public async logEvent(businessId: string, event: Omit<BusinessEvent, 'id' | 'createdAt'>): Promise<BusinessEvent> {
    const { data, error } = await this.db
      .from('business_events')
      .insert({
        business_id: businessId,
        actor_user_id: event.actorUserId,
        actor_name: event.actorName,
        type: event.type,
        title: event.title,
        detail: event.detail,
        metadata: event.metadata,
        severity: event.severity
      })
      .select()
      .single();
      
    if (error) throw error;
    return this.mapEvent(data);
  }

  public async getRecentEvents(businessId: string, limit = 50): Promise<BusinessEvent[]> {
    const { data, error } = await this.db
      .from('business_events')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) return [];
    return data.map(this.mapEvent);
  }

  private mapEvent(data: any): BusinessEvent {
    return {
      id: data.id,
      businessId: data.business_id,
      actorUserId: data.actor_user_id,
      actorName: data.actor_name,
      type: data.type,
      title: data.title,
      detail: data.detail,
      metadata: data.metadata,
      severity: data.severity,
      createdAt: data.created_at,
    };
  }

  // --- Business Memories ---

  public async getMemories(businessId: string): Promise<BusinessMemory[]> {
    const { data, error } = await this.db
      .from('business_memories')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'active');
      
    if (error) return [];
    return data.map(this.mapMemory);
  }

  public async createMemory(businessId: string, memory: Omit<BusinessMemory, 'id' | 'businessId' | 'createdAt' | 'lastReferencedAt'>): Promise<BusinessMemory> {
    const { data, error } = await this.db
      .from('business_memories')
      .insert({
        business_id: businessId,
        fact: memory.fact,
        type: memory.type,
        confidence: memory.confidence,
        source: memory.source,
        status: memory.status
      })
      .select()
      .single();
      
    if (error) throw error;
    return this.mapMemory(data);
  }

  public async updateMemoryReferenceTime(memoryId: string): Promise<void> {
    await this.db
      .from('business_memories')
      .update({ last_referenced_at: new Date().toISOString() })
      .eq('id', memoryId);
  }

  private mapMemory(data: any): BusinessMemory {
    return {
      id: data.id,
      businessId: data.business_id,
      fact: data.fact,
      type: data.type,
      confidence: Number(data.confidence),
      source: data.source,
      status: data.status,
      createdAt: data.created_at,
      lastReferencedAt: data.last_referenced_at,
    };
  }

  // --- AI Recommendations ---

  public async getPendingRecommendations(businessId: string): Promise<AIRecommendation[]> {
    const { data, error } = await this.db
      .from('ai_recommendations')
      .select('*')
      .eq('business_id', businessId)
      .in('status', ['pending', 'accepted']);
      
    if (error) return [];
    return data.map(this.mapRecommendation);
  }

  public async createRecommendation(businessId: string, rec: Omit<AIRecommendation, 'id' | 'businessId' | 'createdAt'>): Promise<AIRecommendation> {
    const { data, error } = await this.db
      .from('ai_recommendations')
      .insert({
        business_id: businessId,
        type: rec.type,
        title: rec.title,
        explanation: rec.explanation,
        priority: rec.priority,
        recommended_action: rec.recommendedAction,
        action_type: rec.actionType,
        action_payload: rec.actionPayload,
        evidence: rec.evidence,
        status: rec.status
      })
      .select()
      .single();
      
    if (error) throw error;
    return this.mapRecommendation(data);
  }

  public async updateRecommendationStatus(recId: string, status: 'pending' | 'accepted' | 'dismissed' | 'completed'): Promise<boolean> {
    const { error } = await this.db
      .from('ai_recommendations')
      .update({ status })
      .eq('id', recId);
      
    return !error;
  }

  private mapRecommendation(data: any): AIRecommendation {
    return {
      id: data.id,
      businessId: data.business_id,
      type: data.type,
      title: data.title,
      explanation: data.explanation,
      priority: data.priority,
      recommendedAction: data.recommended_action,
      actionType: data.action_type,
      actionPayload: data.action_payload,
      evidence: data.evidence,
      status: data.status,
      createdAt: data.created_at,
    };
  }

  // --- Summaries & Analytics ---

  public async getDailySummary(businessId: string, date: string): Promise<{
    salesTotal: number;
    transactionCount: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
    expensesTotal: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startIso = startOfDay.toISOString();
    const endIso = endOfDay.toISOString();
    
    const { data: txs, error: txError } = await this.db
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('created_at', startIso)
      .lte('created_at', endIso);
      
    const { data: exps, error: expError } = await this.db
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'cleared')
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    let salesTotal = 0;
    const itemsMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    if (txs) {
      for (const tx of txs) {
        salesTotal += Number(tx.total_amount);
        for (const item of tx.transaction_items || []) {
          const existing = itemsMap.get(item.product_id) || { name: item.name, quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += Number(item.subtotal);
          itemsMap.set(item.product_id, existing);
        }
      }
    }

    const topProducts = Array.from(itemsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    let expensesTotal = 0;
    if (exps) {
      expensesTotal = exps.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    }

    return {
      salesTotal,
      transactionCount: txs ? txs.length : 0,
      topProducts,
      expensesTotal,
    };
  }
}
