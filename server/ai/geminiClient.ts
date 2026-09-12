import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

export function getGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export const GEMINI_MODEL = 'gemini-3.8-flash';

export interface GeminiCallResult<T> {
  success: boolean;
  data: T | null;
  rawText?: string;
  error?: string;
  usedFallback: boolean;
}

/**
 * Executes a structured Gemini call requesting application/json output.
 * If Gemini fails, returns a graceful failure result rather than throwing.
 */
export async function callGeminiStructured<T>(
  systemInstruction: string,
  userPrompt: string
): Promise<GeminiCallResult<T>> {
  const client = getGeminiClient();
  if (!client) {
    return {
      success: false,
      data: null,
      error: 'GEMINI_API_KEY is not configured in server environment.',
      usedFallback: true,
    };
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for deterministic, analytical precision
      },
    });

    const text = response.text || '';
    if (!text.trim()) {
      return {
        success: false,
        data: null,
        error: 'Empty response received from Gemini model.',
        usedFallback: true,
      };
    }

    try {
      const parsed = JSON.parse(text) as T;
      return {
        success: true,
        data: parsed,
        rawText: text,
        usedFallback: false,
      };
    } catch (parseErr: any) {
      console.warn('Failed to parse Gemini JSON output:', text, parseErr);
      return {
        success: false,
        data: null,
        rawText: text,
        error: `JSON parsing error: ${parseErr.message}`,
        usedFallback: true,
      };
    }
  } catch (err: any) {
    console.warn(`Gemini API call failed (${err.status || err.name}):`, err.message || err);
    return {
      success: false,
      data: null,
      error: err.message || 'Gemini API call encountered an error.',
      usedFallback: true,
    };
  }
}

/**
 * Text-based Gemini call for conversational copilot assistance.
 */
export async function callGeminiChat(
  systemInstruction: string,
  userPrompt: string
): Promise<{ success: boolean; text: string; error?: string }> {
  const client = getGeminiClient();
  if (!client) {
    return {
      success: false,
      text: '',
      error: 'GEMINI_API_KEY is not configured.',
    };
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      },
    });

    const text = response.text || '';
    return {
      success: true,
      text,
    };
  } catch (err: any) {
    console.warn('Gemini chat call failed:', err.message || err);
    return {
      success: false,
      text: '',
      error: err.message || 'Gemini chat error',
    };
  }
}
