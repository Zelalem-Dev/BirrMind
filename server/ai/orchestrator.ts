import { 
  AIProviderContext, 
  LLMResponse, 
  activeProviders 
} from './providers/index.js';

/**
 * Detects the language of a given text to route to the appropriate AI provider.
 * This is a simple heuristic based on character blocks.
 */
export function detectLanguage(text: string): AIProviderContext['language'] {
  // Amharic/Tigrinya (Ge'ez script)
  if (/[\u1200-\u137F]/.test(text)) {
    // We'll default to Amharic for Ge'ez script for now unless we can distinguish Tigrinya
    return 'amharic';
  }
  
  // Oromo/Somali are Latin-based, harder to distinguish purely by regex without a dictionary,
  // but we can look for common Oromo words (e.g., akkam, galatoomi, fayyaa) 
  // or Somali words (e.g., sidee, mahadsanid, nabad) if needed.
  // For now, if it's not Ge'ez, we'll assume English and let the LLM figure it out,
  // unless we add specific dictionary heuristics later.
  return 'english';
}

/**
 * Orchestrator to route LLM text generation requests based on language.
 * Prefers ethiopianLLM for Amharic/Oromo/Tigrinya/Somali, falls back to standard LLM.
 */
export async function generateTextAutoRoute(
  prompt: string, 
  context?: AIProviderContext
): Promise<LLMResponse<string>> {
  const lang = context?.language || detectLanguage(prompt);
  const mergedContext = { ...context, language: lang };

  const isEthiopianLang = lang === 'amharic' || lang === 'oromo' || lang === 'tigrinya' || lang === 'somali';

  if (isEthiopianLang && activeProviders.ethiopianLLM?.isConfigured()) {
    const result = await activeProviders.ethiopianLLM.generateText(prompt, mergedContext);
    if (result.success || !activeProviders.llm?.isConfigured()) {
      return result;
    }
    // Fallback to standard LLM if ethiopianLLM failed
    console.warn(`[Orchestrator] ethiopianLLM failed for ${lang}. Falling back to standard LLM.`);
  }

  if (activeProviders.llm?.isConfigured()) {
    const result = await activeProviders.llm.generateText(prompt, mergedContext);
    if (result.success || !activeProviders.fallbackLLM?.isConfigured()) {
      return result;
    }
    // Fallback to fallbackLLM
    console.warn(`[Orchestrator] standard LLM failed. Falling back to fallbackLLM.`);
  }

  if (activeProviders.fallbackLLM?.isConfigured()) {
    return await activeProviders.fallbackLLM.generateText(prompt, mergedContext);
  }

  return {
    success: false,
    data: null,
    error: 'No configured LLM providers available.',
    usedFallback: true
  };
}

/**
 * Orchestrator to route structured data extraction based on language.
 */
export async function generateStructuredAutoRoute<T>(
  prompt: string, 
  context?: AIProviderContext
): Promise<LLMResponse<T>> {
  const lang = context?.language || detectLanguage(prompt);
  const mergedContext = { ...context, language: lang };

  const isEthiopianLang = lang === 'amharic' || lang === 'oromo' || lang === 'tigrinya' || lang === 'somali';

  if (isEthiopianLang && activeProviders.ethiopianLLM?.isConfigured()) {
    const result = await activeProviders.ethiopianLLM.generateStructured<T>(prompt, mergedContext);
    if (result.success || !activeProviders.llm?.isConfigured()) {
      return result;
    }
    console.warn(`[Orchestrator] ethiopianLLM failed for structured data. Falling back to standard LLM.`);
  }

  if (activeProviders.llm?.isConfigured()) {
    const result = await activeProviders.llm.generateStructured<T>(prompt, mergedContext);
    if (result.success || !activeProviders.fallbackLLM?.isConfigured()) {
      return result;
    }
    console.warn(`[Orchestrator] standard LLM failed for structured data. Falling back to fallbackLLM.`);
  }

  if (activeProviders.fallbackLLM?.isConfigured()) {
    return await activeProviders.fallbackLLM.generateStructured<T>(prompt, mergedContext);
  }

  return {
    success: false,
    data: null,
    error: 'No configured LLM providers available for structured output.',
    usedFallback: true
  };
}

/**
 * Vision extraction orchestrator.
 */
export async function extractVisionData<T>(
  imageBuffer: Buffer, 
  mimeType: string, 
  prompt: string, 
  context?: AIProviderContext
): Promise<LLMResponse<T>> {
  if (activeProviders.vision?.isConfigured()) {
    return await activeProviders.vision.extractStructuredData<T>(imageBuffer, mimeType, prompt, context);
  }
  
  return {
    success: false,
    data: null,
    error: 'No configured Vision provider available.',
    usedFallback: true
  };
}

/**
 * Speech-to-Text orchestrator.
 */
export async function transcribeAudioAutoRoute(
  audioBuffer: Buffer, 
  mimeType: string
): Promise<LLMResponse<string>> {
  if (activeProviders.stt?.isConfigured()) {
    return await activeProviders.stt.transcribeAudio(audioBuffer, mimeType);
  }

  return {
    success: false,
    data: null,
    error: 'No configured STT provider available.',
    usedFallback: true
  };
}

/**
 * Text-to-Speech orchestrator.
 */
export async function generateAudioAutoRoute(
  text: string, 
  voiceId?: string
): Promise<LLMResponse<Buffer>> {
  if (activeProviders.tts?.isConfigured()) {
    return await activeProviders.tts.generateAudio(text, voiceId);
  }

  return {
    success: false,
    data: null,
    error: 'No configured TTS provider available.',
    usedFallback: true
  };
}
