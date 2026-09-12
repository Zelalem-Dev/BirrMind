export interface AIProviderContext {
  systemInstruction?: string;
  temperature?: number;
  language?: 'english' | 'amharic' | 'oromo' | 'tigrinya' | 'somali';
}

export interface LLMResponse<T = string> {
  success: boolean;
  data: T | null;
  rawText?: string;
  error?: string;
  usedFallback: boolean;
}

export interface LLMProvider {
  name: string;
  isConfigured(): boolean;
  generateText(prompt: string, context?: AIProviderContext): Promise<LLMResponse<string>>;
  generateStructured<T>(prompt: string, context?: AIProviderContext): Promise<LLMResponse<T>>;
}

export interface SpeechToTextProvider {
  name: string;
  isConfigured(): boolean;
  transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<LLMResponse<string>>;
}

export interface TextToSpeechProvider {
  name: string;
  isConfigured(): boolean;
  generateAudio(text: string, voiceId?: string): Promise<LLMResponse<Buffer>>;
}

export interface ImageGenerationProvider {
  name: string;
  isConfigured(): boolean;
  generateImage(prompt: string): Promise<LLMResponse<string>>; // returns image URL or base64
}

export interface VisionProvider {
  name: string;
  isConfigured(): boolean;
  extractStructuredData<T>(imageBuffer: Buffer, mimeType: string, prompt: string, context?: AIProviderContext): Promise<LLMResponse<T>>;
}

export interface AIProviderRegistry {
  llm: LLMProvider;
  fallbackLLM?: LLMProvider;
  ethiopianLLM?: LLMProvider;
  stt: SpeechToTextProvider;
  tts: TextToSpeechProvider;
  image: ImageGenerationProvider;
  vision?: VisionProvider;
}

// Global registry instance (to be initialized by the app)
export const activeProviders: Partial<AIProviderRegistry> = {};

export function setProviders(registry: Partial<AIProviderRegistry>) {
  Object.assign(activeProviders, registry);
}
