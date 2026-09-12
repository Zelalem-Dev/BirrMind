import {
  BusinessContextForAI,
  AIHealthExplanation,
} from '../../src/types/index.js';
import { callGeminiStructured } from './geminiClient.js';
import { businessService } from '../services/businessService.js';

const SYSTEM_INSTRUCTION = `
You are an expert small-business operational financial advisor.
You are given a deterministic health score and underlying business metrics calculated by the server.

CRITICAL RULE:
- Do NOT calculate or change the health score or verdict. The score and verdict provided to you are absolute facts.
- Your job is solely to EXPLAIN what drives this score in practical, merchant-friendly language.
- Identify specific strengths from the metrics.
- Identify specific operational concerns.
- Write a clear, empowering 2-3 sentence explanation summarizing how the merchant can improve or maintain their health.

Return valid JSON adhering to:
{
  "strengths": string[],
  "concerns": string[],
  "explanation": string
}
`;

export async function explainBusinessHealth(
  businessId: string,
  context: BusinessContextForAI
): Promise<AIHealthExplanation> {
  // Deterministic server calculations are source of truth
  const health = await businessService.calculateHealth(businessId);
  const currency = context.businessProfile.currencySymbol;

  const prompt = `
DETERMINISTIC HEALTH DATA (CANNOT BE CHANGED):
- Health Score: ${health.score}/100
- Verdict: ${health.verdict}
- Today's Revenue: ${currency}${health.todayRevenue}
- Target Daily Revenue: ${currency}${context.targetDailyRevenue}
- Target Progress: ${health.revenueTargetProgress}%
- Low Stock Items: ${health.lowStockItemsCount} items
- Inventory Health: ${health.inventoryHealthPercentage}%
- Today's Expenses: ${currency}${health.todayExpenses}
- Net Profit Today: ${currency}${health.todayNetProfit}
- Top Performing Product: ${context.topProducts[0]?.name || 'N/A'}

Explain why the business is rated "${health.verdict}" (${health.score}/100). Identify actionable strengths and concerns.
`;

  const geminiResult = await callGeminiStructured<{
    strengths: string[];
    concerns: string[];
    explanation: string;
  }>(SYSTEM_INSTRUCTION, prompt);

  if (geminiResult.success && geminiResult.data && Array.isArray(geminiResult.data.strengths)) {
    return {
      healthScore: health.score,
      healthVerdict: health.verdict,
      strengths: geminiResult.data.strengths,
      concerns: geminiResult.data.concerns,
      explanation: geminiResult.data.explanation,
      metrics: {
        revenueTargetProgress: health.revenueTargetProgress,
        inventoryHealthPercentage: health.inventoryHealthPercentage,
        todayProfit: health.todayNetProfit,
      },
      isAIGenerated: true,
    };
  }

  // Deterministic Fallback Explainer
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (health.revenueTargetProgress >= 80) {
    strengths.push(`Strong sales pace: ${health.revenueTargetProgress}% of daily revenue target met (${currency}${health.todayRevenue}).`);
  }
  if (health.todayNetProfit > 0) {
    strengths.push(`Profitable daily run rate: Net operating profit is positive at ${currency}${health.todayNetProfit}.`);
  }
  if (health.inventoryHealthPercentage >= 85) {
    strengths.push(`Healthy shelf stocking: ${health.inventoryHealthPercentage}% of catalog items are safely above reorder points.`);
  }

  if (health.lowStockItemsCount > 0) {
    concerns.push(`${health.lowStockItemsCount} items have breached minimum stock levels and risk stockouts.`);
  }
  if (health.revenueTargetProgress < 50) {
    concerns.push(`Revenue is currently trailing the daily goal (${health.revenueTargetProgress}% achieved).`);
  }
  if (health.todayExpenses > health.todayRevenue) {
    concerns.push(`Daily expenditures (${currency}${health.todayExpenses}) currently exceed daily intake (${currency}${health.todayRevenue}).`);
  }

  const explanation = `Your business has a deterministic health rating of ${health.score}/100 (${health.verdict.replace('_', ' ')}). This reflects ${health.revenueTargetProgress}% pacing toward your ${currency}${context.targetDailyRevenue} goal alongside ${health.lowStockItemsCount} pending inventory restock alerts.`;

  return {
    healthScore: health.score,
    healthVerdict: health.verdict,
    strengths: strengths.length > 0 ? strengths : ['Steady transactional recording.'],
    concerns: concerns.length > 0 ? concerns : ['No immediate critical risks detected.'],
    explanation,
    metrics: {
      revenueTargetProgress: health.revenueTargetProgress,
      inventoryHealthPercentage: health.inventoryHealthPercentage,
      todayProfit: health.todayNetProfit,
    },
    isAIGenerated: false,
  };
}
