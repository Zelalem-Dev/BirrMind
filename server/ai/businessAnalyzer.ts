import {
  BusinessContextForAI,
  AIRecommendation,
  RecommendationType,
  RecommendationActionType,
} from '../../src/types/index.js';
import { callGeminiStructured } from './geminiClient.js';
import { repository } from '../db/repository.js';

export interface AnalysisOutput {
  importantChanges: string[];
  risks: string[];
  opportunities: string[];
  unusualActivity: string[];
  inventoryConcerns: string[];
  positiveSignals: string[];
  recommendations: Array<{
    type: RecommendationType;
    title: string;
    explanation: string;
    confidence?: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    recommendedAction: string;
    actionType: RecommendationActionType;
    actionPayload?: Record<string, any>;
    evidence: string[];
    requiresConfirmation?: boolean;
  }>;
}

const SYSTEM_INSTRUCTION = `
You are the AI Business Brain of Mercato AI, an operating system for independent small businesses (such as specialty pantries, grocers, and cafes).
You receive a structured business context compiled deterministically by the server.

YOUR MANDATE:
1. Identify meaningful business shifts, risks, inventory anomalies, and revenue opportunities.
2. Formulate high-value recommendations with concrete, actionable steps.
3. NEVER fabricate numbers or calculate financial math yourself. Rely strictly on the deterministic figures provided.
4. Distinguish between server-calculated facts (evidence) and your analytical interpretations.
5. All recommendations MUST include:
   - type: 'inventory_restock' | 'pricing_adjustment' | 'expense_saving' | 'revenue_opportunity' | 'operational_risk'
   - title: concise heading
   - explanation: merchant-friendly context explaining why this matters
   - confidence: number between 0.70 and 0.99
   - priority: 'critical' | 'high' | 'medium' | 'low'
   - recommendedAction: clear suggestion
   - actionType: 'restock_product' | 'adjust_price' | 'log_expense' | 'review_catalog' | 'manual_action'
   - actionPayload: JSON object (e.g., for restock_product: { productId: string, quantity: number, costPrice: number, vendor?: string })
   - evidence: list of concrete facts from the context that justify this recommendation
   - requiresConfirmation: true (AI recommendations must always require merchant approval)

Return valid JSON with this exact structure:
{
  "importantChanges": string[],
  "risks": string[],
  "opportunities": string[],
  "unusualActivity": string[],
  "inventoryConcerns": string[],
  "positiveSignals": string[],
  "recommendations": [
    {
      "type": string,
      "title": string,
      "explanation": string,
      "confidence": number,
      "priority": string,
      "recommendedAction": string,
      "actionType": string,
      "actionPayload": object,
      "evidence": string[],
      "requiresConfirmation": true
    }
  ]
}
`;

export async function analyzeBusiness(
  context: BusinessContextForAI,
  persistRecommendations: boolean = true
): Promise<AnalysisOutput> {
  const prompt = `
CURRENT BUSINESS CONTEXT:
${JSON.stringify(context, null, 2)}

Analyze this business data. Highlight critical inventory thresholds, revenue progress vs daily target (${context.businessProfile.currencySymbol}${context.targetDailyRevenue}), and specific items that need restocking or margin review. Return clean JSON matching the schema.
`;

  const geminiResult = await callGeminiStructured<AnalysisOutput>(SYSTEM_INSTRUCTION, prompt);

  let output: AnalysisOutput;

  if (geminiResult.success && geminiResult.data && Array.isArray(geminiResult.data.recommendations)) {
    output = geminiResult.data;
  } else {
    // Deterministic rule-based fallback when Gemini is unavailable
    output = generateDeterministicAnalysis(context);
  }

  // Persist newly generated recommendations if requested and not already existing
  if (persistRecommendations && output.recommendations.length > 0) {
    const existingRecs = await repository.getRecommendations(context.businessProfile.id);
    const existingTitles = new Set(existingRecs.map(r => r.title));

    for (const rec of output.recommendations) {
      if (!existingTitles.has(rec.title)) {
        await repository.createRecommendation({
          businessId: context.businessProfile.id,
          type: rec.type,
          title: rec.title,
          explanation: rec.explanation,
          priority: rec.priority,
          recommendedAction: rec.recommendedAction,
          actionType: rec.actionType,
          actionPayload: rec.actionPayload,
          evidence: rec.evidence || [],
          status: 'pending',
        });
      }
    }
  }

  return output;
}

/**
 * Deterministic rule-based analyzer when Gemini is unavailable or key is absent.
 * Guaranteed to operate safely on server-calculated figures without inventing data.
 */
export function generateDeterministicAnalysis(context: BusinessContextForAI): AnalysisOutput {
  const currency = context.businessProfile.currencySymbol;
  const risks: string[] = [];
  const opportunities: string[] = [];
  const inventoryConcerns: string[] = [];
  const positiveSignals: string[] = [];
  const recommendations: AnalysisOutput['recommendations'] = [];

  // 1. Inventory & Stockout Analysis
  if (context.lowStockProducts.length > 0) {
    for (const prod of context.lowStockProducts) {
      inventoryConcerns.push(`${prod.name} has only ${prod.currentStock} ${prod.unit}s remaining (reorder point: ${prod.reorderPoint}).`);
      
      const restockQty = Math.max(10, prod.reorderPoint * 2);
      recommendations.push({
        type: 'inventory_restock',
        title: `Restock ${prod.name}`,
        explanation: `Stock level of ${prod.name} has fallen to ${prod.currentStock}, at or below the safety threshold of ${prod.reorderPoint}.`,
        priority: prod.currentStock <= 2 ? 'critical' : 'high',
        recommendedAction: `Order ${restockQty} ${prod.unit}s to prevent a stockout during upcoming customer visits.`,
        actionType: 'restock_product',
        actionPayload: {
          productId: prod.id,
          quantity: restockQty,
          recordExpense: true,
          paymentMethod: 'card',
        },
        evidence: [
          `Current stock: ${prod.currentStock} ${prod.unit}s`,
          `Configured reorder point: ${prod.reorderPoint} ${prod.unit}s`,
          `Verified in deterministic inventory ledger`,
        ],
      });
    }
  } else {
    positiveSignals.push('All catalog items are currently stocked above configured safety reorder thresholds.');
  }

  // 2. Revenue & Target Progress Analysis
  const progressPct = context.targetDailyRevenue > 0
    ? Math.round((context.todayRevenue / context.targetDailyRevenue) * 100)
    : 0;

  if (progressPct >= 100) {
    positiveSignals.push(`Daily sales target of ${currency}${context.targetDailyRevenue} achieved (${progressPct}% completed, total ${currency}${context.todayRevenue}).`);
  } else if (progressPct < 50) {
    risks.push(`Pacing behind daily revenue target: ${currency}${context.todayRevenue} logged out of ${currency}${context.targetDailyRevenue} (${progressPct}%).`);
  }

  // 3. Top Products & Fast Movers
  if (context.topProducts.length > 0) {
    const top = context.topProducts[0];
    positiveSignals.push(`Top performing product this week is ${top.name} with ${top.unitsSold} units sold generating ${currency}${top.revenue}.`);
  }

  // 4. Slow Moving Products Opportunity
  if (context.slowMovingProducts.length > 0) {
    const slow = context.slowMovingProducts[0];
    opportunities.push(`${slow.name} holds ${slow.currentStock} units with zero recorded sales over the past week.`);
    recommendations.push({
      type: 'revenue_opportunity',
      title: `Feature or Bundle ${slow.name}`,
      explanation: `${slow.name} has ${slow.currentStock} units idle in storage without active sales velocity.`,
      priority: 'medium',
      recommendedAction: `Consider a weekend tasting showcase or bundle pairing with complementary pantry staples.`,
      actionType: 'manual_action',
      actionPayload: {
        productId: slow.id,
        suggestedStrategy: 'bundle_promotion',
      },
      evidence: [
        `Idle inventory: ${slow.currentStock} units`,
        `Zero sales recorded over 7-day trailing window`,
      ],
    });
  }

  return {
    importantChanges: [
      `Recorded ${context.transactionCount} transactions today totaling ${currency}${context.todayRevenue}.`,
      `Recent 7-day revenue trend is ${context.recentRevenueTrend >= 0 ? '+' : ''}${context.recentRevenueTrend}%.`,
    ],
    risks,
    opportunities,
    unusualActivity: [],
    inventoryConcerns,
    positiveSignals,
    recommendations,
  };
}
