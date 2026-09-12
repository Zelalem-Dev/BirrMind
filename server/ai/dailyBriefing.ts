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
- Keep the summary to 2-3 clean, punchy sentences.

ANSWER THESE FIVE CORE QUESTIONS:
1. HOW IS THE BUSINESS DOING? (Cite actual revenue vs target %, transactions count, and net result).
2. WHAT CHANGED? (Cite weekly revenue trend % or recent inventory/price shifts).
3. WHAT NEEDS ATTENTION? (Identify specific low-stock items with exact remaining units vs reorder threshold).
4. WHAT OPPORTUNITY SHOULD I ACT ON? (Highlight fast-movers or cross-selling patterns from approved store memories).
5. WHAT SHOULD I DO NEXT? (Give a single, concrete operational action to take right now).

STRICT RULES:
- NEVER make generic statements such as "Your business is doing well" or "Consider monitoring your inventory".
- EVERY statement, risk, signal, and opportunity MUST cite exact products, numbers, and currencies from the context.
- If data for any question is insufficient, say so explicitly rather than fabricating an assumption.

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
BUSINESS IDENTITY: ${context.businessProfile.name} (${context.businessProfile.type})
CURRENT DATE/TIME: ${context.currentDateTime}
CURRENCY: ${currency}

DETERMINISTIC FINANCIAL METRICS (CALCULATED BY SERVER):
- Today's Revenue: ${currency}${context.todayRevenue} across ${context.transactionCount} completed sales
- Daily Target Revenue: ${currency}${context.targetDailyRevenue} (${Math.round((context.todayRevenue / (context.targetDailyRevenue || 1)) * 100)}% achieved)
- Estimated Gross Profit: ${currency}${context.estimatedGrossProfit}
- Today's Operating Expenses: ${currency}${context.expenses.todayTotal}
- Net Operating Result: ${currency}${context.netOperatingResult}
- 7-Day Revenue Trend vs Prior 7 Days: ${context.recentRevenueTrend > 0 ? `+${context.recentRevenueTrend}` : context.recentRevenueTrend}%
- Overall Health Score: ${health.score}/100 (${health.verdict})

INVENTORY TRUTH:
- Total Stock Valuation: ${currency}${context.currentStock.totalValuation} (${context.currentStock.totalItems} total items)
- Low Stock Alerts (${context.lowStockProducts.length}): ${context.lowStockProducts.map(p => `${p.name}: ${p.currentStock} ${p.unit} remaining (Reorder point: ${p.reorderPoint})`).join('; ') || 'None - all items safely stocked'}
- Top Selling Product: ${context.topProducts[0] ? `${context.topProducts[0].name} (${context.topProducts[0].unitsSold} units, ${currency}${context.topProducts[0].revenue})` : 'Insufficient sales data recorded'}
- Slow Moving Products: ${context.slowMovingProducts.map(p => `${p.name} (${p.currentStock} units)`).join(', ') || 'None'}

APPROVED OPERATIONAL MEMORIES:
${context.approvedBusinessMemories.map(m => `- ${m.fact}`).join('\n') || '- None'}

RECENT OPERATIONAL EVENTS:
${context.relevantBusinessEvents.slice(0, 3).map(e => `- ${e.title}: ${e.detail}`).join('\n') || '- None'}

Synthesize the briefing answering the 5 core questions with concrete data. Return clean JSON matching schema.
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
        explanation: `${context.businessProfile.name} scored ${health.score}/100 based on ${health.revenueTargetProgress}% target progress, ${currency}${context.netOperatingResult} net result, and ${health.lowStockItemsCount} low-stock alerts.`,
      },
      keySignals: data.keySignals || analysis.positiveSignals,
      risks: data.risks || analysis.risks,
      opportunities: data.opportunities || analysis.opportunities,
      recommendations: pendingRecommendations.slice(0, 4),
      generatedAt: new Date().toISOString(),
      isAIGenerated: true,
    };
  }

  // Deterministic Grounded Fallback Briefing
  const progressPct = health.revenueTargetProgress;
  let headline = `${context.businessProfile.name}: Daily Status`;
  if (progressPct >= 100) {
    headline = `Target Achieved: ${currency}${context.todayRevenue} (${progressPct}%)`;
  } else if (health.lowStockItemsCount > 0) {
    const firstLow = context.lowStockProducts[0];
    headline = `Reorder Needed: ${firstLow.name} (${firstLow.currentStock} ${firstLow.unit} left)`;
  } else {
    headline = `Daily Progress: ${currency}${context.todayRevenue} Across ${context.transactionCount} Sales`;
  }

  const topProdStr = context.topProducts[0] ? `${context.topProducts[0].name} leads sales with ${context.topProducts[0].unitsSold} units.` : 'No significant sales recorded yet today.';
  const lowStockStr = context.lowStockProducts.length > 0 
    ? `${context.lowStockProducts.length} item(s) are below safety reorder threshold (e.g. ${context.lowStockProducts[0].name} at ${context.lowStockProducts[0].currentStock} ${context.lowStockProducts[0].unit}).`
    : 'All items are currently above safety stock thresholds.';

  const summary = `Revenue stands at ${currency}${context.todayRevenue} (${progressPct}% of daily goal ${currency}${context.targetDailyRevenue}) with estimated net operating profit of ${currency}${context.netOperatingResult}. ${topProdStr} ${lowStockStr}`;

  return {
    headline,
    summary,
    businessHealth: {
      score: health.score,
      verdict: health.verdict,
      explanation: `Deterministic health score evaluated at ${health.score}/100. Net operating result: ${currency}${context.netOperatingResult} (Revenue: ${currency}${context.todayRevenue}, Expenses: ${currency}${context.expenses.todayTotal}).`,
    },
    keySignals: analysis.positiveSignals.length > 0 ? analysis.positiveSignals : [`${context.transactionCount} transactions processed today generating ${currency}${context.todayRevenue}.`],
    risks: analysis.risks.length > 0 ? analysis.risks : ['Monitor supplier reorder delivery times.'],
    opportunities: analysis.opportunities.length > 0 ? analysis.opportunities : ['Review weekend stock levels against approved sales patterns.'],
    recommendations: pendingRecommendations.slice(0, 4),
    generatedAt: new Date().toISOString(),
    isAIGenerated: false,
  };
}
