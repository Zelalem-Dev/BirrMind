import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { repository } from './server/db/repository.js';
import { isSupabaseConfigured } from './server/db/supabase.js';
import { requireAuth, requireBusiness } from './server/middleware/auth.js';
import { businessService } from './server/services/businessService.js';
import {
  CreateTransactionSchema,
  AdjustStockSchema,
  RestockProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  CreateExpenseSchema,
  AddMembershipSchema,
  CreateMemorySchema,
  UpdateMemorySchema,
  CopilotChatSchema,
} from './server/validation/schemas.js';
import { buildBusinessContext } from './server/ai/contextBuilder.js';
import { generateDailyBriefing } from './server/ai/dailyBriefing.js';
import { explainBusinessHealth } from './server/ai/healthExplainer.js';
import { analyzeBusiness } from './server/ai/businessAnalyzer.js';
import { askCopilot } from './server/ai/copilotService.js';
import { isGeminiConfigured } from './server/ai/geminiClient.js';
import { setProviders } from './server/ai/providers/index.js';
import { GeminiProvider } from './server/ai/providers/geminiProvider.js';
import { AddisProvider } from './server/ai/providers/addisProvider.js';
import { FalProvider } from './server/ai/providers/falProvider.js';
import { ElevenLabsProvider } from './server/ai/providers/elevenLabsProvider.js';
import { processReceiptImage } from './server/ai/receiptPipeline.js';
import { generateAudioAutoRoute } from './server/ai/orchestrator.js';
import multer from 'multer';

// Setup file upload for receipts
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Register Providers
const addisProvider = new AddisProvider();
const falProvider = new FalProvider();
const elevenLabsProvider = new ElevenLabsProvider();
const geminiProvider = new GeminiProvider();

setProviders({
  llm: geminiProvider,
  ethiopianLLM: addisProvider,
  fallbackLLM: geminiProvider,
  stt: addisProvider,
  tts: elevenLabsProvider,
  image: falProvider,
  vision: falProvider
});
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// ---------------------- API ROUTES ---------------------- //

// 1. System & Database Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      engine: isSupabaseConfigured() ? 'supabase_postgresql' : 'local_postgres_compatible',
      configured: isSupabaseConfigured(),
    },
    version: '1.0.0',
  });
});

// 2. Auth State: Current user and accessible businesses
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const accessibleBusinesses = await repository.listUserBusinesses(user.id);

    res.json({
      user,
      accessibleBusinesses,
      defaultBusinessId: accessibleBusinesses[0]?.business.id || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user profile' });
  }
});

// 3. User's Accessible Businesses
app.get('/api/businesses', requireAuth, async (req, res) => {
  try {
    const businesses = await repository.listUserBusinesses(req.user!.id);
    res.json(businesses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3b. Complete First-Time Business Onboarding
app.post('/api/onboarding/complete', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const data = req.body;

    if (!data.businessName || data.businessName.trim().length < 2) {
      res.status(400).json({ error: 'Business name must be at least 2 characters.' });
      return;
    }

    const business = await repository.createBusiness({
      name: data.businessName.trim(),
      type: data.businessType || 'retail',
      currency: data.currency || 'ETB',
      currencySymbol: data.currencySymbol || 'ETB',
      targetDailyRevenue: 1000,
      operatingHours: '8:00 AM - 8:00 PM',
    });

    const membership = await repository.createMembership({
      userId: user.id,
      businessId: business.id,
      role: 'owner',
    });

    // Record initial workspace business event
    try {
      await repository.createBusinessEvent({
        businessId: business.id,
        actorUserId: user.id,
        actorName: user.fullName,
        type: 'BUSINESS_WORKSPACE_CREATED',
        title: 'Business Workspace Initialized',
        detail: `${business.name} (${data.businessType || 'Business'}) workspace created in ${data.city || 'Addis Ababa'}.`,
        metadata: {
          city: data.city,
          country: data.country || 'Ethiopia',
          industry: data.industry,
          goals: data.businessGoals,
        },
        severity: 'positive',
      });
    } catch (evtErr) {
      console.warn('Initial event note:', evtErr);
    }

    // Initialize Mercato AI memories with business context
    try {
      if (data.businessGoals && Array.isArray(data.businessGoals) && data.businessGoals.length > 0) {
        await repository.createMemory({
          businessId: business.id,
          fact: `Core business priorities: ${data.businessGoals.join(', ')}.`,
          type: 'operating_rhythm',
          confidence: 0.95,
          source: 'onboarding',
          status: 'active',
        });
      }
      if (data.paymentMethods && Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
        await repository.createMemory({
          businessId: business.id,
          fact: `Accepted payment methods: ${data.paymentMethods.join(', ')}.`,
          type: 'customer_preference',
          confidence: 0.95,
          source: 'onboarding',
          status: 'active',
        });
      }
      if (data.city) {
        await repository.createMemory({
          businessId: business.id,
          fact: `Business located in ${data.city}${data.neighborhood ? ', ' + data.neighborhood : ''}, ${data.country || 'Ethiopia'}.`,
          type: 'operating_rhythm',
          confidence: 1.0,
          source: 'onboarding',
          status: 'active',
        });
      }
    } catch (memErr) {
      console.warn('Initial memory note:', memErr);
    }

    res.status(201).json({
      success: true,
      business,
      membership,
    });
  } catch (err: any) {
    console.error('Onboarding completion error:', err);
    res.status(500).json({ error: err.message || 'Failed to complete onboarding' });
  }
});

// 4. Tenant Business State Snapshot (Scoped to authorized business)
app.get('/api/business/state', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const business = req.business!;
    const user = req.user!;
    const membership = req.membership!;

    const [
      accessibleBusinesses,
      products,
      movements,
      transactions,
      expenses,
      events,
      memories,
      recommendations,
      memberships,
      health,
    ] = await Promise.all([
      repository.listUserBusinesses(user.id),
      repository.getProducts(business.id),
      repository.getInventoryMovements(business.id, 50),
      repository.getTransactions(business.id, 40),
      repository.getExpenses(business.id, 40),
      repository.getBusinessEvents(business.id, 40),
      repository.getMemories(business.id, 50),
      repository.getRecommendations(business.id),
      repository.listMemberships(business.id),
      businessService.calculateHealth(business.id),
    ]);

    res.json({
      business,
      user,
      membership,
      accessibleBusinesses,
      products,
      movements,
      transactions,
      expenses,
      events,
      memories,
      recommendations,
      memberships,
      health,
      databaseEngine: isSupabaseConfigured() ? 'supabase' : 'local_postgres_compatible',
    });
  } catch (err: any) {
    console.error('Error fetching tenant state:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch business state' });
  }
});

// 5. Products Catalog
app.get('/api/products', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const products = await repository.getProducts(req.business!.id);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const created = await repository.createProduct(req.business!.id, parsed.data);

    // Initial stock inventory movement if stock > 0
    if (created.currentStock > 0) {
      await repository.recordInventoryMovement({
        businessId: req.business!.id,
        productId: created.id,
        productName: created.name,
        type: 'restock',
        quantityDelta: created.currentStock,
        resultingStock: created.currentStock,
        referenceType: 'manual_adjustment',
        reason: 'Initial catalog creation stock count',
        actorUserId: req.user!.id,
        actorName: req.user!.fullName,
      });
    }

    await repository.createBusinessEvent({
      businessId: req.business!.id,
      actorUserId: req.user!.id,
      actorName: req.user!.fullName,
      type: 'PRODUCT_RESTOCKED',
      title: `Product Created: ${created.name}`,
      detail: `Added to catalog with ${created.currentStock} ${created.unit}s @ ${req.business!.currencySymbol}${created.sellingPrice.toFixed(2)}.`,
      metadata: { productId: created.id },
      severity: 'normal',
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const parsed = UpdateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const current = await repository.getProduct(req.business!.id, req.params.id);
    if (!current) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Check if price changed
    if (parsed.data.sellingPrice !== undefined && parsed.data.sellingPrice !== current.sellingPrice) {
      await repository.createBusinessEvent({
        businessId: req.business!.id,
        actorUserId: req.user!.id,
        actorName: req.user!.fullName,
        type: 'PRICE_CHANGED',
        title: `Price Changed: ${current.name}`,
        detail: `Updated selling price from ${req.business!.currencySymbol}${current.sellingPrice.toFixed(2)} to ${req.business!.currencySymbol}${parsed.data.sellingPrice.toFixed(2)}.`,
        metadata: {
          productId: current.id,
          oldPrice: current.sellingPrice,
          newPrice: parsed.data.sellingPrice,
        },
        severity: 'normal',
      });
    }

    const updated = await repository.updateProduct(req.business!.id, req.params.id, parsed.data);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Transactions & Atomic POS Sale
app.get('/api/transactions', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const transactions = await repository.getTransactions(req.business!.id, limit);
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const parsed = CreateTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const result = await businessService.recordSale({
      business: req.business!,
      user: req.user!,
      items: parsed.data.items,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record transaction' });
  }
});

// 7. Inventory Ledger & Adjustments
app.get('/api/inventory/movements', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const movements = await repository.getInventoryMovements(req.business!.id, limit);
    res.json(movements);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory/adjust', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const parsed = AdjustStockSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const result = await businessService.adjustStock({
      business: req.business!,
      user: req.user!,
      productId: parsed.data.productId,
      quantityDelta: parsed.data.quantityDelta,
      newStock: parsed.data.newStock,
      type: parsed.data.type,
      reason: parsed.data.reason,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to adjust stock' });
  }
});

app.post('/api/inventory/restock', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const parsed = RestockProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const result = await businessService.restockProduct({
      business: req.business!,
      user: req.user!,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      costPrice: parsed.data.costPrice,
      vendor: parsed.data.vendor,
      recordExpense: parsed.data.recordExpense,
      paymentMethod: parsed.data.paymentMethod,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to restock product' });
  }
});

// 8. Operating Expenses
app.get('/api/expenses', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const expenses = await repository.getExpenses(req.business!.id, limit);
    res.json(expenses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const parsed = CreateExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const expense = await repository.createExpense({
      businessId: req.business!.id,
      actorUserId: req.user!.id,
      actorName: req.user!.fullName,
      category: parsed.data.category,
      amount: parsed.data.amount,
      vendor: parsed.data.vendor,
      description: parsed.data.description,
      paymentMethod: parsed.data.paymentMethod,
      status: 'cleared',
    });

    await repository.createBusinessEvent({
      businessId: req.business!.id,
      actorUserId: req.user!.id,
      actorName: req.user!.fullName,
      type: 'EXPENSE_RECORDED',
      title: `Expense Logged: ${req.business!.currencySymbol}${expense.amount.toFixed(2)}`,
      detail: `${expense.vendor} — ${expense.description} (${expense.category})`,
      metadata: { expenseId: expense.id, amount: expense.amount, category: expense.category },
      severity: 'normal',
    });

    res.status(201).json(expense);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Business Events (Immutable Audit Log)
app.get('/api/events', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const events = await repository.getBusinessEvents(req.business!.id, limit);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Memberships & Multi-Tenant Team Management
app.get('/api/memberships', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const memberships = await repository.listMemberships(req.business!.id);
    res.json(memberships);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memberships', requireAuth, requireBusiness('owner'), async (req, res) => {
  try {
    const parsed = AddMembershipSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    let user = await repository.getUserByEmail(parsed.data.email);
    if (!user) {
      user = await repository.createUser({
        email: parsed.data.email,
        fullName: parsed.data.fullName || parsed.data.email.split('@')[0],
      });
    }

    const membership = await repository.createMembership({
      userId: user.id,
      businessId: req.business!.id,
      role: parsed.data.role,
    });

    res.status(201).json({ membership, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Reset Demo Database
app.post('/api/demo/reset', requireAuth, requireBusiness('owner'), async (req, res) => {
  try {
    repository.resetDemoData();
    res.json({ success: true, message: 'Demo data reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- PHASE 2 AI BUSINESS BRAIN ENDPOINTS ---------------------- //

// 12. Compact Business Context for AI
app.get('/api/ai/context', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const context = await buildBusinessContext(req.business!.id);
    res.json(context);
  } catch (err: any) {
    console.error('Failed to build context:', err);
    res.status(500).json({ error: err.message || 'Failed to build business context' });
  }
});

// 13. Daily Operational Briefing
app.get('/api/ai/briefing', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const context = await buildBusinessContext(req.business!.id);
    const briefing = await generateDailyBriefing(context);
    res.json(briefing);
  } catch (err: any) {
    console.error('Failed to generate briefing:', err);
    res.status(500).json({ error: err.message || 'Failed to generate briefing' });
  }
});

// 14. Deterministic Business Health with AI Explanation
app.get('/api/ai/health', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const context = await buildBusinessContext(req.business!.id);
    const explanation = await explainBusinessHealth(req.business!.id, context);
    res.json(explanation);
  } catch (err: any) {
    console.error('Failed to explain health:', err);
    res.status(500).json({ error: err.message || 'Failed to explain business health' });
  }
});

// 15. AI Recommendations List
app.get('/api/ai/recommendations', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const status = req.query.status as any;
    const shouldRefresh = req.query.refresh === 'true';

    let recommendations = await repository.getRecommendations(req.business!.id, status);
    if (recommendations.length === 0 || shouldRefresh) {
      const context = await buildBusinessContext(req.business!.id);
      await analyzeBusiness(context, true);
      recommendations = await repository.getRecommendations(req.business!.id, status);
    }

    res.json(recommendations);
  } catch (err: any) {
    console.error('Failed to fetch recommendations:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch recommendations' });
  }
});

// 16. Confirm Recommendation (Requires explicit manager/owner confirmation)
app.post('/api/ai/recommendations/:id/confirm', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const rec = await repository.getRecommendation(req.business!.id, id);
    if (!rec) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }
    if (rec.status !== 'pending') {
      res.status(400).json({ error: `Recommendation has already been ${rec.status}` });
      return;
    }

    let executionResult: any = null;

    // Execute server-validated action based on recommendation payload
    if (rec.actionType === 'restock_product' && rec.actionPayload) {
      const p = rec.actionPayload;
      executionResult = await businessService.restockProduct({
        business: req.business!,
        user: req.user!,
        productId: p.productId,
        quantity: p.quantity,
        costPrice: p.costPrice,
        vendor: p.vendor,
        recordExpense: p.recordExpense !== false,
        paymentMethod: p.paymentMethod || 'card',
      });
    } else if (rec.actionType === 'adjust_price' && rec.actionPayload) {
      const p = rec.actionPayload;
      const updatedProd = await repository.updateProduct(req.business!.id, p.productId, {
        sellingPrice: p.newPrice,
      });
      await repository.createBusinessEvent({
        businessId: req.business!.id,
        actorUserId: req.user!.id,
        actorName: req.user!.fullName,
        type: 'PRICE_CHANGED',
        title: `Price Adjusted: ${req.business!.currencySymbol}${p.newPrice}`,
        detail: `Updated pricing for product via confirmed AI recommendation: ${rec.title}`,
        severity: 'positive',
      });
      executionResult = updatedProd;
    } else if (rec.actionType === 'log_expense' && rec.actionPayload) {
      const p = rec.actionPayload;
      const expense = await repository.createExpense({
        businessId: req.business!.id,
        actorUserId: req.user!.id,
        actorName: req.user!.fullName,
        category: p.category || 'other',
        amount: p.amount,
        vendor: p.vendor || 'Vendor',
        description: p.description || rec.title,
        paymentMethod: p.paymentMethod || 'card',
        status: 'cleared',
      });
      await repository.createBusinessEvent({
        businessId: req.business!.id,
        actorUserId: req.user!.id,
        actorName: req.user!.fullName,
        type: 'EXPENSE_RECORDED',
        title: `Expense Logged: ${req.business!.currencySymbol}${expense.amount.toFixed(2)}`,
        detail: `${expense.vendor} — ${expense.description}`,
        severity: 'normal',
      });
      executionResult = expense;
    }

    // Mark recommendation as accepted
    const updatedRec = await repository.updateRecommendation(req.business!.id, id, {
      status: 'accepted',
      confirmedByUserId: req.user!.id,
      confirmedAt: new Date().toISOString(),
    });

    // Record BusinessEvent
    await repository.createBusinessEvent({
      businessId: req.business!.id,
      actorUserId: req.user!.id,
      actorName: req.user!.fullName,
      type: 'RECOMMENDATION_ACCEPTED',
      title: `Recommendation Confirmed: ${rec.title}`,
      detail: `Confirmed by ${req.user!.fullName} (${req.membership!.role}). Executed action: ${rec.actionType}.`,
      metadata: { recommendationId: rec.id, actionType: rec.actionType, executionResult },
      severity: 'positive',
    });

    res.json({
      success: true,
      recommendation: updatedRec,
      executionResult,
    });
  } catch (err: any) {
    console.error('Failed to confirm recommendation:', err);
    res.status(500).json({ error: err.message || 'Failed to confirm recommendation' });
  }
});

// 17. Reject Recommendation
app.post('/api/ai/recommendations/:id/reject', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const rec = await repository.getRecommendation(req.business!.id, id);
    if (!rec) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    const updatedRec = await repository.updateRecommendation(req.business!.id, id, {
      status: 'rejected',
      confirmedByUserId: req.user!.id,
      confirmedAt: new Date().toISOString(),
    });

    await repository.createBusinessEvent({
      businessId: req.business!.id,
      actorUserId: req.user!.id,
      actorName: req.user!.fullName,
      type: 'RECOMMENDATION_REJECTED',
      title: `Recommendation Dismissed: ${rec.title}`,
      detail: `Dismissed by ${req.user!.fullName} (${req.membership!.role}).`,
      metadata: { recommendationId: rec.id },
      severity: 'normal',
    });

    res.json({ success: true, recommendation: updatedRec });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reject recommendation' });
  }
});

// 18. Business Memories Foundation (List, Create, Update, Delete)
app.get('/api/ai/memories', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const memories = await repository.getMemories(req.business!.id, limit);
    res.json(memories);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch memories' });
  }
});

app.post('/api/ai/memories', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const parsed = CreateMemorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const memory = await repository.createMemory({
      businessId: req.business!.id,
      fact: parsed.data.fact,
      type: parsed.data.type,
      confidence: parsed.data.confidence,
      source: parsed.data.source,
      status: parsed.data.status,
    });

    await repository.createBusinessEvent({
      businessId: req.business!.id,
      actorUserId: req.user!.id,
      actorName: req.user!.fullName,
      type: 'MEMORY_CREATED',
      title: `Store Memory Recorded`,
      detail: memory.fact,
      metadata: { memoryId: memory.id, type: memory.type },
      severity: 'normal',
    });

    res.status(201).json(memory);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create memory' });
  }
});

app.patch('/api/ai/memories/:id', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = UpdateMemorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const updated = await repository.updateMemory(req.business!.id, id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update memory' });
  }
});

app.delete('/api/ai/memories/:id', requireAuth, requireBusiness('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await repository.deleteMemory(req.business!.id, id);
    if (!deleted) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ success: true, message: 'Memory deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete memory' });
  }
});

// 19. Copilot Conversational Engine
app.post('/api/ai/chat', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const parsed = CopilotChatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const context = await buildBusinessContext(req.business!.id);
    const result = await askCopilot(parsed.data.message, context, parsed.data.history || []);
    res.json(result);
  } catch (err: any) {
    console.error('Copilot chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to process chat query' });
  }
});

// 20. Process Receipt Image
app.post('/api/ai/receipt/extract', requireAuth, requireBusiness('manager'), upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No receipt image provided' });
      return;
    }

    const result = await processReceiptImage(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (err: any) {
    console.error('Receipt extraction error:', err);
    res.status(500).json({ error: err.message || 'Failed to extract receipt data' });
  }
});

// 21. Generate TTS Audio
app.post('/api/ai/tts', requireAuth, requireBusiness('staff'), async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    const result = await generateAudioAutoRoute(text, voiceId);
    
    if (!result.success || !result.data) {
      res.status(500).json({ error: result.error || 'Failed to generate audio' });
      return;
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': result.data.length,
    });
    res.send(result.data);
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate audio' });
  }
});
// ---------------------- VITE / STATIC SETUP ---------------------- //

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mercato AI Foundation Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
