import { LLMProvider, LLMResponse, AIProviderContext } from './index.js';
import { isGeminiConfigured, callGeminiStructured, callGeminiChat } from '../geminiClient.js';

export class GeminiProvider implements LLMProvider {
  name = 'Gemini';

  isConfigured(): boolean {
    return isGeminiConfigured();
  }

  async generateText(prompt: string, context?: AIProviderContext): Promise<LLMResponse<string>> {
    if (!this.isConfigured()) {
      return { success: false, data: null, error: 'Gemini not configured', usedFallback: true };
    }
    const result = await callGeminiChat(context?.systemInstruction || '', prompt);
    return {
      success: result.success,
      data: result.text,
      rawText: result.text,
      error: result.error,
      usedFallback: !result.success
    };
  }

  async generateStructured<T>(prompt: string, context?: AIProviderContext): Promise<LLMResponse<T>> {
    if (!this.isConfigured()) {
      return { success: false, data: null, error: 'Gemini not configured', usedFallback: true };
    }
    return await callGeminiStructured<T>(context?.systemInstruction || '', prompt);
  }
}
