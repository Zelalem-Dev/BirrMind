import { repository } from '../db/repository.js';
import { businessService } from '../services/businessService.js';
import { BusinessContextForAI, BusinessMemory } from '../../src/types/index.js';

export async function buildBusinessContext(businessId: string): Promise<BusinessContextForAI> {
  const business = await repository.getBusiness(businessId);
  if (!business) {
    throw new Error(`Business not found: ${businessId}`);
  }

  const [products, transactions, expenses, movements, events, memories] = await Promise.all([
    repository.getProducts(businessId),
    repository.getTransactions(businessId, 100),
    repository.getExpenses(businessId, 50),
    repository.getInventoryMovements(businessId, 25),
    repository.getBusinessEvents(businessId, 25),
    repository.getMemories(businessId, 50),
  ]);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 3600 * 1000;
  const fourteenDaysAgo = now.getTime() - 14 * 24 * 3600 * 1000;

  // 1. Today's Revenue & Transactions
  const todayTxs = transactions.filter(t => new Date(t.createdAt).getTime() >= startOfDay && t.status === 'completed');
  const todayRevenue = Number(todayTxs.reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2));
  const transactionCount = todayTxs.length;

  // 2. Revenue Trend (Last 7 days vs Prior 7 days)
  const last7DaysTxs = transactions.filter(t => {
    const time = new Date(t.createdAt).getTime();
    return time >= sevenDaysAgo && t.status === 'completed';
  });
  const prior7DaysTxs = transactions.filter(t => {
    const time = new Date(t.createdAt).getTime();
    return time >= fourteenDaysAgo && time < sevenDaysAgo && t.status === 'completed';
  });

  const last7DaysRev = last7DaysTxs.reduce((sum, t) => sum + t.totalAmount, 0);
  const prior7DaysRev = prior7DaysTxs.reduce((sum, t) => sum + t.totalAmount, 0);
  let recentRevenueTrend = 0;
  if (prior7DaysRev > 0) {
    recentRevenueTrend = Number((((last7DaysRev - prior7DaysRev) / prior7DaysRev) * 100).toFixed(1));
  } else if (last7DaysRev > 0) {
    recentRevenueTrend = 100;
  }

  // 3. Estimated Gross Profit (Revenue minus Cost of Goods Sold)
  let estimatedCostOfGoods = 0;
  const productCostMap = new Map<string, number>(products.map(p => [p.id, p.costPrice]));
  
  for (const tx of todayTxs) {
    for (const item of tx.items) {
      const cost = (item.productId && productCostMap.get(item.productId)) || 0;
      estimatedCostOfGoods += cost * item.quantity;
    }
  }
  const estimatedGrossProfit = Number((todayRevenue - estimatedCostOfGoods).toFixed(2));

  // 4. Expenses Breakdown
  const todayExpensesList = expenses.filter(e => new Date(e.createdAt).getTime() >= startOfDay);
  const todayExpensesTotal = Number(todayExpensesList.reduce((sum, e) => sum + e.amount, 0).toFixed(2));

  const breakdown: Record<string, number> = {};
  for (const exp of todayExpensesList) {
    breakdown[exp.category] = Number(((breakdown[exp.category] || 0) + exp.amount).toFixed(2));
  }

  const recentExpenses = expenses.slice(0, 5).map(e => ({
    amount: e.amount,
    vendor: e.vendor,
    category: e.category,
  }));

  // 5. Product Sales Aggregation (Last 7 Days)
  const productSalesMap = new Map<string, { unitsSold: number; revenue: number; name: string }>();
  for (const tx of last7DaysTxs) {
    for (const item of tx.items) {
      const current = productSalesMap.get(item.name) || { unitsSold: 0, revenue: 0, name: item.name };
      current.unitsSold += item.quantity;
      current.revenue += item.subtotal;
      productSalesMap.set(item.name, current);
    }
  }

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(p => {
      const match = products.find(prod => prod.name === p.name);
      return {
        id: match ? match.id : p.name.toLowerCase().replace(/\s+/g, '_'),
        name: p.name,
        unitsSold: p.unitsSold,
        revenue: Number(p.revenue.toFixed(2)),
      };
    });

  // 6. Slow Moving Products (In stock but zero or minimal sales in last 7 days)
  const soldNames = new Set(Array.from(productSalesMap.keys()));
  const slowMovingProducts = products
    .filter(p => p.isActive && p.currentStock > 5 && !soldNames.has(p.name))
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      name: p.name,
      currentStock: p.currentStock,
      daysWithoutSale: 7,
    }));

  // 7. Stock Valuation & Low Stock
  let totalStockUnits = 0;
  let totalValuation = 0;
  const lowStockProducts: { id: string; name: string; currentStock: number; reorderPoint: number; unit: string }[] = [];

  for (const prod of products) {
    if (prod.isActive) {
      totalStockUnits += prod.currentStock;
      totalValuation += prod.currentStock * prod.costPrice;
      if (prod.currentStock <= prod.reorderPoint) {
        lowStockProducts.push({
          id: prod.id,
          name: prod.name,
          currentStock: prod.currentStock,
          reorderPoint: prod.reorderPoint,
          unit: prod.unit,
        });
      }
    }
  }

  // 8. Recent Inventory Movements
  const recentMovements = movements.slice(0, 10).map(m => ({
    id: m.id,
    productName: m.productName || m.productId,
    type: m.type,
    quantityDelta: m.quantityDelta,
    resultingStock: m.resultingStock,
    reason: m.reason,
    timestamp: m.createdAt,
  }));

  // 9. Recent Events
  const recentEvents = events.slice(0, 10).map(ev => ({
    id: ev.id,
    type: ev.type,
    title: ev.title,
    detail: ev.detail,
    severity: ev.severity,
    timestamp: ev.createdAt,
  }));

  // 10. Approved Business Memories
  const approvedMemories = memories
    .filter(m => m.status === 'active')
    .slice(0, 10)
    .map(m => ({
      id: m.id,
      fact: m.fact,
      type: m.type,
      confidence: m.confidence,
    }));

  return {
    businessProfile: {
      id: business.id,
      name: business.name,
      type: business.type,
      currency: business.currency,
      currencySymbol: business.currencySymbol,
      timezone: (business as any).timezone || 'UTC',
      targetDailyRevenue: business.targetDailyRevenue,
      operatingHours: business.operatingHours,
    },
    currentDateTime: now.toISOString(),
    todayRevenue,
    recentRevenueTrend,
    transactionCount,
    estimatedGrossProfit,
    expenses: {
      todayTotal: todayExpensesTotal,
      breakdown,
      recent: recentExpenses,
    },
    topProducts,
    slowMovingProducts,
    currentStock: {
      totalItems: totalStockUnits,
      totalValuation: Number(totalValuation.toFixed(2)),
    },
    lowStockProducts,
    recentInventoryMovements: recentMovements,
    relevantBusinessEvents: recentEvents,
    targetDailyRevenue: business.targetDailyRevenue,
    approvedBusinessMemories: approvedMemories,
  };
}
