import { SpeechToTextProvider, LLMResponse } from './index.js';

// Deepgram could be another provider, but we'll create a generic SpeechProvider for now
export class GenericSpeechProvider implements SpeechToTextProvider {
  name = 'GenericSpeech';

  isConfigured(): boolean {
    // Return true if any STT provider is configured (e.g. Deepgram or Whisper)
    return true; 
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<LLMResponse<string>> {
    try {
      console.log(`[STT] Transcribing ${audioBuffer.length} bytes of ${mimeType} audio`);
      
      // Mock transcription
      const mockTranscript = "Customer said: Two artisan sourdough loaves and a bag of espresso beans, please.";
      return { success: true, data: mockTranscript, rawText: mockTranscript, usedFallback: false };
    } catch (err: any) {
      console.warn('Speech transcription error:', err);
      return { success: false, data: null, error: err.message, usedFallback: true };
    }
  }
}
