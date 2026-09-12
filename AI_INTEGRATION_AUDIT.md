# Mercato AI - AI Integration Audit

## Overview
This document audits the AI integrations in Mercato AI (BirrMind platform) to ensure separation of concerns, secure access, and fallback reliability.

## 1. Provider Implementations
- **Gemini (Default LLM)**: Powered by `GeminiProvider`. Used for structured outputs, general business reasoning, copilot chat, and deterministic health checking. Falls back safely if API is unavailable or keys are missing.
- **Addis AI**: Powered by `AddisProvider`. Sub-providers for `STT` (Speech-to-Text), `TTS` (Text-to-Speech) and `EthiopianLLM` (Local Language). Configured to cleanly timeout after 15 seconds and return `usedFallback: true` to let the orchestrator gracefully fallback to Gemini if needed.
- **Fal.ai**: Powered by `FalProvider`. Implements `VisionProvider` interface. Used to securely pass receipt images and prompts for structured data extraction.
- **ElevenLabs**: Powered by `ElevenLabsProvider`. Used for high-quality TTS generation in English. Includes character limit caps to prevent runaway spend.

## 2. Orchestrator Routing
The `AIOrchestrator` centralizes AI requests:
1. Detects language (e.g. Amharic/Afaan Oromo vs English).
2. Routes requests to `EthiopianLLM` for local languages, otherwise `llm`.
3. Handles provider failure by falling back to `fallbackLLM`.
4. Decouples the application layer from specific model vendors.

## 3. Security & Safety
- **No Client-Side Secrets**: All LLM, TTS, STT, and Vision API keys (`GEMINI_API_KEY`, `ADDIS_API_KEY`, `FAL_KEY`, `ELEVENLABS_API_KEY`) are exclusively used server-side.
- **Deterministic Action**: AI only generates recommendations and structured data. Actions (e.g., RESTOCK_PRODUCT, ADJUST_PRICE) are verified and deterministically executed by `businessService.ts`.
- **Tenant Context Isolation**: The context builder (`buildBusinessContext`) only fetches data matching the authorized `business.id` from the secure auth middleware. AI prompts cannot access data outside the tenant.
