import { LLMProvider, SpeechToTextProvider, TextToSpeechProvider, LLMResponse, AIProviderContext } from './index.js';

const DEFAULT_ADDIS_URL = 'https://api.addisai.com/v1';
const MAX_RETRIES = 2;
const TIMEOUT_MS = 15000;

function getAddisConfig() {
  const apiKey = process.env.ADDIS_API_KEY; // Using ADDIS_API_KEY as per plan
  const baseUrl = process.env.ADDIS_API_URL || DEFAULT_ADDIS_URL;
  return { apiKey, baseUrl };
}

/**
 * Helper to make HTTP requests with timeout and retries.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(id);

      if (response.ok) {
        return response;
      }
      
      if (response.status >= 500 && attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // Exponential backoff
        continue;
      }
      
      throw new Error(`Addis AI API error: ${response.status} ${response.statusText}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (attempt < retries) {
          attempt++;
          continue;
        }
        throw new Error('Addis AI API request timed out');
      }
      if (attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Addis AI Provider
 * Specialized in Ethiopian context, Amharic/Oromo/Tigrinya language processing.
 */
export class AddisProvider implements LLMProvider, SpeechToTextProvider, TextToSpeechProvider {
  name = 'AddisAI';

  isConfigured(): boolean {
    const { apiKey } = getAddisConfig();
    return Boolean(apiKey && apiKey.trim().length > 0);
  }

  async generateText(prompt: string, context?: AIProviderContext): Promise<LLMResponse<string>> {
    if (!this.isConfigured()) {
      return { success: false, data: null, error: 'Addis AI not configured', usedFallback: true };
    }

    const { apiKey, baseUrl } = getAddisConfig();
    try {
      // Assuming a standard OpenAI-compatible completions endpoint format
      const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'addis-llm-latest',
          messages: [
            ...(context?.systemInstruction ? [{ role: 'system', content: context.systemInstruction }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: context?.temperature ?? 0.7,
        })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      return { success: true, data: text, rawText: text, usedFallback: false };
    } catch (err: any) {
      console.warn(`[Addis AI] generateText error:`, err.message);
      return { success: false, data: null, error: err.message, usedFallback: true };
    }
  }

  async generateStructured<T>(prompt: string, context?: AIProviderContext): Promise<LLMResponse<T>> {
    if (!this.isConfigured()) {
      return { success: false, data: null, error: 'Addis AI not configured', usedFallback: true };
    }

    const { apiKey, baseUrl } = getAddisConfig();
    try {
      const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'addis-llm-latest',
          messages: [
            ...(context?.systemInstruction ? [{ role: 'system', content: context.systemInstruction }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: context?.temperature ?? 0.2,
          response_format: { type: 'json_object' } // Assuming JSON mode support
        })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      try {
        const parsed = JSON.parse(text) as T;
        return { success: true, data: parsed, rawText: text, usedFallback: false };
      } catch (parseErr: any) {
        return { success: false, data: null, error: `JSON parsing error: ${parseErr.message}`, rawText: text, usedFallback: true };
      }
    } catch (err: any) {
      console.warn(`[Addis AI] generateStructured error:`, err.message);
      return { success: false, data: null, error: err.message, usedFallback: true };
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<LLMResponse<string>> {
    if (!this.isConfigured()) {
      return { success: false, data: null, error: 'Addis AI not configured', usedFallback: true };
    }

    const { apiKey, baseUrl } = getAddisConfig();
    try {
      // Assuming a standard multipart/form-data whisper-like endpoint
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'addis-stt-latest');
      
      const response = await fetchWithRetry(`${baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
          // FormData automatically sets Content-Type boundary
        },
        body: formData
      });

      const data = await response.json();
      return { success: true, data: data.text, rawText: data.text, usedFallback: false };
    } catch (err: any) {
      console.warn(`[Addis AI] transcribeAudio error:`, err.message);
      return { success: false, data: null, error: err.message, usedFallback: true };
    }
  }

  async generateAudio(text: string, voiceId?: string): Promise<LLMResponse<Buffer>> {
    if (!this.isConfigured()) {
      return { success: false, data: null, error: 'Addis AI not configured', usedFallback: true };
    }

    const { apiKey, baseUrl } = getAddisConfig();
    try {
      const response = await fetchWithRetry(`${baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'addis-tts-latest',
          input: text,
          voice: voiceId || 'default'
        })
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return { success: true, data: buffer, usedFallback: false };
    } catch (err: any) {
      console.warn(`[Addis AI] generateAudio error:`, err.message);
      return { success: false, data: null, error: err.message, usedFallback: true };
    }
  }
}
