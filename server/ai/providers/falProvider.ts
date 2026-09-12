import { ImageGenerationProvider, VisionProvider, LLMResponse, AIProviderContext } from './index.js';

const MAX_RETRIES = 2;
const TIMEOUT_MS = 30000; // Vision tasks might take longer

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
      
      throw new Error(`Fal.ai API error: ${response.status} ${response.statusText}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (attempt < retries) {
          attempt++;
          continue;
        }
        throw new Error('Fal.ai API request timed out');
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

export class FalProvider implements ImageGenerationProvider, VisionProvider {
  name = 'Fal.ai';

  isConfigured(): boolean {
    return Boolean(process.env.FAL_KEY && process.env.FAL_KEY.trim().length > 0);
  }

  async generateImage(prompt: string): Promise<LLMResponse<string>> {
    if (!this.isConfigured()) {
      return { success: false, data: null, error: 'Fal.ai not configured', usedFallback: true };
    }

    try {
      // Example integration using fal-serverless or REST directly
      // Using fal-ai/fast-sdxl endpoint as an example
      const response = await fetchWithRetry('https://fal.run/fal-ai/fast-sdxl', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.FAL_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          image_size: "square_1024"
        })
      });

      const data = await response.json();
      const imageUrl = data.images?.[0]?.url;
      
      if (!imageUrl) {
        throw new Error('No image URL returned from Fal.ai');
      }

      return { success: true, data: imageUrl, rawText: imageUrl, usedFallback: false };
    } catch (err: any) {
      console.warn('[Fal.ai] generateImage error:', err.message);
      return { success: false, data: null, error: err.message, usedFallback: true };
    }
  }

  async extractStructuredData<T>(imageBuffer: Buffer, mimeType: string, prompt: string, context?: AIProviderContext): Promise<LLMResponse<T>> {
    if (!this.isConfigured()) {
      return { success: false, data: null, error: 'Fal.ai not configured', usedFallback: true };
    }

    try {
      // For vision tasks, we might use a VLM like llava or qwen-vl on fal.ai
      // Convert buffer to data URI for Fal.ai
      const base64Image = imageBuffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      const response = await fetchWithRetry('https://fal.run/fal-ai/llava-next', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.FAL_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_url: dataUri,
          prompt: `Return ONLY a valid JSON object. ${prompt}`
        })
      });

      const data = await response.json();
      const text = data.output || '';
      
      try {
        // Try to extract JSON from the output if it has markdown formatting
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : text;
        const parsed = JSON.parse(jsonString) as T;
        return { success: true, data: parsed, rawText: text, usedFallback: false };
      } catch (parseErr: any) {
        return { success: false, data: null, error: `JSON parsing error: ${parseErr.message}`, rawText: text, usedFallback: true };
      }
    } catch (err: any) {
      console.warn('[Fal.ai] extractStructuredData error:', err.message);
      return { success: false, data: null, error: err.message, usedFallback: true };
    }
  }
}
