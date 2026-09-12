import {
  BusinessContextForAI,
  DailyBriefing,
  AIRecommendation,
} from '../../src/types/index.js';
import { callGeminiStructured } from './geminiClient.js';
import { repository } from '../db/repository.js';
import { businessService } from '../services/businessService.js';
import { analyzeBusiness } from './businessAnalyzer.js';

const SYSTEM_INSTRUCTION = `
You are the Executive Merchant Copilot for Mercato AI.
You provide daily operational briefings for independent small shop and pantry owners.

TONE & VOICE:
- Speak as a sharp, practical, warm business partner—not a corporate chatbot.
- Be direct, concise, and focused on operational realities: cash, customer volume, and shelf inventory.
- Use merchant-friendly phrasing (e.g. "We've banked...", "On the shelves...", "Watch out for...").
- Keep the summary to 2-3 clean, punchy sentences.

ANSWER THE QUESTION:
"What does the owner need to know today to run a profitable, smooth business?"

Return valid JSON adhering strictly to:
{
  "headline": string,
  "summary": string,
  "keySignals": string[],
  "risks": string[],
  "opportunities": string[]
}
`;

export async function generateDailyBriefing(context: BusinessContextForAI): Promise<DailyBriefing> {
  const currency = context.businessProfile.currencySymbol;
  const businessId = context.businessProfile.id;

  // Calculate deterministic health first
  const health = await businessService.calculateHealth(businessId);

  // Run analyzer to get up-to-date recommendations
  const analysis = await analyzeBusiness(context, true);
  const pendingRecommendations = await repository.getRecommendations(businessId, 'pending');

  const prompt = `
BUSINESS: ${context.businessProfile.name} (${context.businessProfile.type})
CURRENCY: ${currency}
TARGET DAILY REVENUE: ${currency}${context.targetDailyRevenue}
TODAY'S REVENUE: ${currency}${context.todayRevenue} (${context.transactionCount} transactions)
TODAY'S ESTIMATED GROSS PROFIT: ${currency}${context.estimatedGrossProfit}
TODAY'S EXPENSES: ${currency}${context.expenses.todayTotal}
HEALTH SCORE: ${health.score}/100 (${health.verdict})
LOW STOCK PRODUCTS: ${context.lowStockProducts.map(p => `${p.name} (${p.currentStock} left)`).join(', ') || 'None'}
TOP PRODUCT: ${context.topProducts[0]?.name || 'N/A'} (${context.topProducts[0]?.unitsSold || 0} units)
APPROVED MEMORIES: ${context.approvedBusinessMemories.map(m => m.fact).join('; ') || 'None'}

Generate a merchant-friendly daily operational briefing for the owner.
`;

  const geminiResult = await callGeminiStructured<{
    headline: string;
    summary: string;
    keySignals: string[];
    risks: string[];
    opportunities: string[];
  }>(SYSTEM_INSTRUCTION, prompt);

  if (geminiResult.success && geminiResult.data && geminiResult.data.headline) {
    const data = geminiResult.data;
    return {
      headline: data.headline,
      summary: data.summary,
      businessHealth: {
        score: health.score,
        verdict: health.verdict,
        explanation: `${context.businessProfile.name} scored ${health.score}/100 based on ${health.revenueTargetProgress}% target progress and ${health.lowStockItemsCount} stock threshold alerts.`,
      },
      keySignals: data.keySignals || analysis.positiveSignals,
      risks: data.risks || analysis.risks,
      opportunities: data.opportunities || analysis.opportunities,
      recommendations: pendingRecommendations.slice(0, 4),
      generatedAt: new Date().toISOString(),
      isAIGenerated: true,
    };
  }

  // Deterministic Fallback Briefing
  const progressPct = health.revenueTargetProgress;
  let headline = `${context.businessProfile.name} Operations Status`;
  if (progressPct >= 100) {
    headline = `Daily Revenue Target Achieved (${currency}${context.todayRevenue})`;
  } else if (health.lowStockItemsCount > 0) {
    headline = `${health.lowStockItemsCount} Item${health.lowStockItemsCount > 1 ? 's' : ''} Require Immediate Reorder`;
  } else {
    headline = `Steady Trading: ${currency}${context.todayRevenue} Across ${context.transactionCount} Sales`;
  }

  const summary = `Today's revenue is currently at ${currency}${context.todayRevenue} (${progressPct}% of daily target ${currency}${context.targetDailyRevenue}). Gross profit stands at approximately ${currency}${context.estimatedGrossProfit} with ${health.lowStockItemsCount} items approaching safety stock limits.`;

  return {
    headline,
    summary,
    businessHealth: {
      score: health.score,
      verdict: health.verdict,
      explanation: `Deterministic health score evaluated at ${health.score}/100. Today's net trading shows revenue of ${currency}${context.todayRevenue} and expenses of ${currency}${context.expenses.todayTotal}.`,
    },
    keySignals: analysis.positiveSignals.length > 0 ? analysis.positiveSignals : [`${context.transactionCount} transactions processed today.`],
    risks: analysis.risks.length > 0 ? analysis.risks : ['Monitor supplier delivery schedules.'],
    opportunities: analysis.opportunities.length > 0 ? analysis.opportunities : ['Check weekend display bundle options.'],
    recommendations: pendingRecommendations.slice(0, 4),
    generatedAt: new Date().toISOString(),
    isAIGenerated: false,
  };
}
