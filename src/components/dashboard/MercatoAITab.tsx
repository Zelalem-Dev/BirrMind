import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Volume2,
  Loader2,
  Mic,
  MicOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  TrendingUp,
  Package
} from 'lucide-react';
import { Business, User, BusinessHealth, Product } from '../../types/index.js';
import { api } from '../../lib/api.js';

interface MercatoAITabProps {
  business: Business;
  user: User;
  health: BusinessHealth;
  products: Product[];
  onNavigateTab: (tab: string) => void;
  onRefreshData: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  deterministicFacts?: string[];
  suggestedFollowUps?: string[];
  relatedAction?: {
    label: string;
    actionType: string;
    actionPayload: Record<string, any>;
  };
}

export const MercatoAITab: React.FC<MercatoAITabProps> = ({
  business,
  user,
  health,
  products,
  onNavigateTab,
  onRefreshData,
}) => {
  const currency = business.currencySymbol || 'ETB';
  const firstName = user.fullName.split(' ')[0] || 'Owner';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Selam ${firstName}! I am Mercato AI, your business companion for ${business.name}. I understand your sales, inventory, and profit. How can I help you grow today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'How much did I sell today?',
        'Which products are running low?',
        'What should I restock this week?',
        'ዛሬ ስንት ብር ሸጥኩ?'
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [actionExecuting, setActionExecuting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access was denied. Please allow microphone permissions or type your question.');
        } else {
          setSpeechError(`Speech error: ${event.error}. You can also type below.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const toggleSpeech = () => {
    if (!speechSupported) {
      setSpeechError('Voice dictation is not supported in this browser. Please type your question.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current?.start();
      } catch (err: any) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const handleSend = async (messageText?: string) => {
    const query = (messageText || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.askCopilot(query, history, user.id, business.id);

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deterministicFacts: res.deterministicFactsUsed,
        suggestedFollowUps: res.suggestedFollowUps,
        relatedAction: res.relatedAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I could not reach the business reasoning service. Core business operations are still fully active.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTTS = async (msgId: string, text: string) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
      return;
    }
    setPlayingAudioId(msgId);

    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-business-id': business.id,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error('TTS server endpoint unavailable');
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setPlayingAudioId(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setPlayingAudioId(null);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.warn('TTS playback error, falling back to Web Speech synthesis:', err);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingAudioId(null);
      }
    }
  };

  const handleExecuteAction = async (action: NonNullable<ChatMessage['relatedAction']>) => {
    setActionExecuting(true);
    try {
      if (action.actionType === 'restock_product' && action.actionPayload?.productId) {
        onNavigateTab('inventory');
      } else if (action.actionType === 'review_catalog') {
        onNavigateTab('inventory');
      } else {
        onNavigateTab('pos');
      }
    } finally {
      setActionExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo-icon.png"
            alt="BirrMind Mercato AI"
            className="h-10 w-auto object-contain flex-shrink-0"
            style={{ aspectRatio: '153 / 177' }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-xl text-stone-900 flex items-baseline gap-1.5">
                <span>BirrMind</span>
                <span className="font-sans font-bold text-xs tracking-wider uppercase text-amber-600">MERCATO AI</span>
                <span className="font-serif text-stone-700 font-semibold text-lg ml-1">Business Brain</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                Grounding Active
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Ask questions about sales, inventory, and margins. Answers are calculated strictly from your verified business data.
            </p>
          </div>
        </div>

        {/* Quick business snapshot pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg">
            <span className="text-stone-400">Today's Sales:</span>{' '}
            <span className="font-bold text-stone-900">{currency}{health.todayRevenue.toFixed(2)}</span>
          </div>
          <div className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg">
            <span className="text-stone-400">Stock Alerts:</span>{' '}
            <span className={`font-bold ${health.lowStockItemsCount > 0 ? 'text-amber-600' : 'text-stone-900'}`}>
              {health.lowStockItemsCount} items
            </span>
          </div>
        </div>
      </div>

      {/* Main Conversation Container */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[600px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/60">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm ${
                  isUser
                    ? 'bg-stone-900 text-white rounded-tr-none shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-900 rounded-tl-none shadow-xs'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? 'text-stone-400' : 'text-amber-700'}`}>
                      {isUser ? user.fullName : 'Mercato AI'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-stone-400 font-mono">{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handlePlayTTS(msg.id, msg.content)}
                          disabled={playingAudioId === msg.id}
                          className="p-1 rounded text-stone-400 hover:text-amber-700 transition-colors"
                          title="Listen with voice TTS"
                        >
                          {playingAudioId === msg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>

                  {/* Grounded facts badge */}
                  {msg.deterministicFacts && msg.deterministicFacts.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] text-stone-500 space-y-1 bg-stone-50/60 p-2 rounded-lg">
                      <p className="font-semibold text-stone-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Grounded in store records:
                      </p>
                      {msg.deterministicFacts.map((fact, idx) => (
                        <p key={idx} className="font-mono text-[10px] text-stone-600">• {fact}</p>
                      ))}
                    </div>
                  )}

                  {/* Related Action Button */}
                  {msg.relatedAction && (
                    <div className="mt-3 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleExecuteAction(msg.relatedAction!)}
                        disabled={actionExecuting}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>{msg.relatedAction.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Suggested follow-up prompt chips */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="mt-3 pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-[11px] font-medium transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center gap-2 text-xs text-stone-500">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Mercato is analyzing your business context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-white space-y-2">
          {speechError && (
            <div className="flex items-center justify-between text-xs bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{speechError}</span>
              </div>
              <button onClick={() => setSpeechError(null)} className="font-bold text-[10px] ml-2">Dismiss</button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Mic voice button */}
            <button
              type="button"
              onClick={toggleSpeech}
              title={isListening ? 'Stop listening' : 'Speak order or query'}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-600 animate-pulse ring-2 ring-rose-300'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening to your voice...' : 'Ask about sales, top products, restock advice, in English or Amharic...'}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all placeholder:text-stone-400"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>Supports English, Amharic (አማርኛ), and Afaan Oromo</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" /> Powered by Mercato AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
