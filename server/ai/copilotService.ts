import {
  BusinessContextForAI,
  CopilotChatMessage,
  RecommendationActionType,
} from '../../src/types/index.js';
import { callGeminiChat, callGeminiStructured } from './geminiClient.js';
import { businessService } from '../services/businessService.js';

interface CopilotResponse {
  answer: string;
  deterministicFactsUsed: string[];
  suggestedFollowUps: string[];
  relatedAction?: {
    label: string;
    actionType: RecommendationActionType;
    actionPayload: Record<string, any>;
  };
}

const SYSTEM_INSTRUCTION = `
You are Mercato Copilot, the AI business advisor for an independent merchant.
You provide direct, operational, and accurate answers to the owner's questions.

CRITICAL RULES:
1. ALWAYS use the deterministic facts provided in the prompt. NEVER perform mental math or recalculate totals.
2. If the user asks about revenue, profit, top products, or inventory, answer with the exact numbers supplied.
3. Be concise (2 to 4 sentences max). Avoid fluff, buzzwords, or generic pleasantries.
4. If an action is appropriate (like restocking a low item), specify the relatedAction.

Return valid JSON adhering to:
{
  "answer": string,
  "suggestedFollowUps": string[],
  "relatedAction": {
    "label": string,
    "actionType": "restock_product" | "adjust_price" | "log_expense" | "review_catalog" | "manual_action",
    "actionPayload": object
  } | null
}
`;

export async function askCopilot(
  question: string,
  context: BusinessContextForAI,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<CopilotResponse> {
  const currency = context.businessProfile.currencySymbol;
  const qLower = question.toLowerCase();

  // 1. Gather deterministic facts upfront based on query intent
  const deterministicFacts: string[] = [];

  // Today's revenue & sales
  deterministicFacts.push(`Today's Revenue: ${currency}${context.todayRevenue} (${context.transactionCount} completed sales).`);
  deterministicFacts.push(`Today's Estimated Gross Profit: ${currency}${context.estimatedGrossProfit}.`);
  deterministicFacts.push(`Today's Logged Expenses: ${currency}${context.expenses.todayTotal}.`);
  deterministicFacts.push(`Daily Revenue Target: ${currency}${context.targetDailyRevenue} (${Math.round((context.todayRevenue / (context.targetDailyRevenue || 1)) * 100)}% achieved).`);

  // Low stock & Reorder facts
  if (context.lowStockProducts.length > 0) {
    const itemsStr = context.lowStockProducts
      .map(p => `${p.name} (Stock: ${p.currentStock}, Reorder: ${p.reorderPoint})`)
      .join('; ');
    deterministicFacts.push(`Low Stock Items Needing Reorder: ${itemsStr}`);
  } else {
    deterministicFacts.push('All items in catalog are currently above reorder thresholds.');
  }

  // Top products
  if (context.topProducts.length > 0) {
    const top = context.topProducts[0];
    deterministicFacts.push(`Top Selling Product (Last 7 Days): ${top.name} (${top.unitsSold} units, ${currency}${top.revenue} revenue).`);
  }

  // Slow moving products
  if (context.slowMovingProducts.length > 0) {
    const slow = context.slowMovingProducts[0];
    deterministicFacts.push(`Slow Moving Product: ${slow.name} (${slow.currentStock} units in stock with 0 sales in past 7 days).`);
  }

  // Relevant memories
  const relevantMemories = context.approvedBusinessMemories.slice(0, 3).map(m => m.fact);

  // 2. Prepare structured prompt for Gemini
  const prompt = `
MERCHANT QUESTION: "${question}"

DETERMINISTIC FACTS CALCULATED BY SERVER:
${deterministicFacts.map(f => `- ${f}`).join('\n')}

BUSINESS PROFILE:
- Business: ${context.businessProfile.name} (${context.businessProfile.type})
- Currency: ${currency}
- Weekly Revenue Trend: ${context.recentRevenueTrend}%

STORE MEMORIES:
${relevantMemories.map(m => `- ${m}`).join('\n') || '- None'}

RECENT EVENTS:
${context.relevantBusinessEvents.slice(0, 3).map(e => `- ${e.title}: ${e.detail}`).join('\n') || '- None'}

Answer the merchant's question clearly, incorporating the deterministic facts without altering the numbers. Suggest 2-3 natural follow-up questions.
`;

  const geminiResult = await callGeminiStructured<{
    answer: string;
    suggestedFollowUps: string[];
    relatedAction?: {
      label: string;
      actionType: RecommendationActionType;
      actionPayload: Record<string, any>;
    } | null;
  }>(SYSTEM_INSTRUCTION, prompt);

  if (geminiResult.success && geminiResult.data && geminiResult.data.answer) {
    return {
      answer: geminiResult.data.answer,
      deterministicFactsUsed: deterministicFacts,
      suggestedFollowUps: geminiResult.data.suggestedFollowUps || [
        'How much did I make today?',
        'What should I reorder next?',
        'How is my overall health score?'
      ],
      relatedAction: geminiResult.data.relatedAction || undefined,
    };
  }

  // 3. Deterministic Fallback if Gemini is unavailable
  let fallbackAnswer = '';
  let fallbackAction: CopilotResponse['relatedAction'] = undefined;

  if (qLower.includes('how much') || qLower.includes('today') || qLower.includes('revenue') || qLower.includes('make')) {
    const progress = Math.round((context.todayRevenue / (context.targetDailyRevenue || 1)) * 100);
    fallbackAnswer = `Today you have banked ${currency}${context.todayRevenue} across ${context.transactionCount} transactions. Estimated gross profit is ${currency}${context.estimatedGrossProfit}. You are currently at ${progress}% of your ${currency}${context.targetDailyRevenue} daily goal.`;
  } else if (qLower.includes('reorder') || qLower.includes('stock') || qLower.includes('inventory')) {
    if (context.lowStockProducts.length > 0) {
      const topLow = context.lowStockProducts[0];
      fallbackAnswer = `You have ${context.lowStockProducts.length} item(s) that need restocking. Most urgently: ${topLow.name} has only ${topLow.currentStock} left (reorder threshold is ${topLow.reorderPoint}).`;
      fallbackAction = {
        label: `Reorder ${topLow.name}`,
        actionType: 'restock_product',
        actionPayload: {
          productId: topLow.id,
          quantity: Math.max(10, topLow.reorderPoint * 2),
        },
      };
    } else {
      fallbackAnswer = `All catalog items are stocked safely above minimum levels. No urgent reorders are required today.`;
    }
  } else if (qLower.includes('which product') || qLower.includes('sells the most') || qLower.includes('top product') || qLower.includes('best seller')) {
    if (context.topProducts.length > 0) {
      const top = context.topProducts[0];
      fallbackAnswer = `Your best seller is ${top.name}, with ${top.unitsSold} units sold over the last week generating ${currency}${top.revenue}.`;
    } else {
      fallbackAnswer = `Not enough sales data recorded this week yet to identify a top seller.`;
    }
  } else if (qLower.includes('how is my business') || qLower.includes('health')) {
    fallbackAnswer = `Your business has healthy activity today with ${currency}${context.todayRevenue} in revenue and ${context.transactionCount} sales. Keep an eye on ${context.lowStockProducts.length} low-stock item(s).`;
  } else {
    fallbackAnswer = `I have your business data ready: today's revenue is ${currency}${context.todayRevenue} (${context.transactionCount} sales), and there are ${context.lowStockProducts.length} items at or below reorder levels.`;
  }

  return {
    answer: fallbackAnswer,
    deterministicFactsUsed: deterministicFacts,
    suggestedFollowUps: [
      'How much did I make today?',
      'What should I reorder?',
      'Which product sells the most?'
    ],
    relatedAction: fallbackAction,
  };
}
