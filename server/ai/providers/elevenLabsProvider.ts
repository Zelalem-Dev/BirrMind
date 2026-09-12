import { TextToSpeechProvider, LLMResponse } from './index.js';

const TIMEOUT_MS = 15000;

export class ElevenLabsProvider implements TextToSpeechProvider {
  name = 'ElevenLabs';

  isConfigured(): boolean {
    return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim().length > 0);
  }

  async generateAudio(text: string, voiceId?: string): Promise<LLMResponse<Buffer>> {
    if (!this.isConfigured()) {
      return { success: false, data: null, error: 'ElevenLabs not configured', usedFallback: true };
    }

    if (!text || text.trim().length === 0) {
      return { success: false, data: null, error: 'Empty text provided', usedFallback: true };
    }

    // ElevenLabs limit
    if (text.length > 5000) {
      console.warn(`[ElevenLabs] Text too long (${text.length} chars). Truncating to 5000.`);
      text = text.substring(0, 5000);
    }

    const apiKey = process.env.ELEVENLABS_API_KEY!;
    const actualVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // fallback default voice

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
        signal: controller.signal
      });

      clearTimeout(id);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return { success: true, data: buffer, usedFallback: false };
    } catch (err: any) {
      console.warn('[ElevenLabs] generateAudio error:', err.message);
      return { success: false, data: null, error: err.message, usedFallback: true };
    }
  }
}
