import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, Volume2, Loader2, Mic, MicOff, AlertCircle } from 'lucide-react';
import { Business, User } from '../../types/index.js';
import { api } from '../../lib/api.js';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  user: User;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  facts?: string[];
  followUps?: string[];
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  business,
  user
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Selam ${user.fullName.split(' ')[0]}! I'm Mercato AI. How can I help you manage ${business.name} today?`,
      followUps: ['How much did I sell today?', 'Which products are low on stock?', 'What should I restock?']
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setInput(text);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied.');
        } else {
          setSpeechError(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      setSpeechError('Voice input not supported in this browser. Please type.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start microphone:', err);
      }
    }
  };

  const handleSend = async (queryText?: string) => {
    const query = (queryText || input).trim();
    if (!query || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const data = await api.askCopilot(query, history, user.id, business.id);

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer || 'I am unable to process that right now.',
          facts: data.deterministicFactsUsed,
          followUps: data.suggestedFollowUps,
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error communicating with the AI service. Business calculations are safely stored.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleListen = async (messageId: string, text: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
      return;
    }
    setPlayingAudio(messageId);
    
    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-business-id': business.id,
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) throw new Error('TTS Failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        setPlayingAudio(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlayingAudio(null);
        URL.revokeObjectURL(url);
      };
      
      await audio.play();
    } catch (err) {
      console.warn('Server TTS unavailable, falling back to Web Speech synthesis:', err);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setPlayingAudio(null);
        utterance.onerror = () => setPlayingAudio(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingAudio(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-amber-50/80">
          <div className="flex items-center gap-2 text-amber-950">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              M
            </div>
            <div>
              <h2 className="font-serif font-bold text-base">Mercato AI Copilot</h2>
              <p className="text-[10px] text-stone-500">{business.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-stone-900 text-white rounded-tr-none' 
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-xs'
                }`}
              >
                {msg.content}
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => handleListen(msg.id, msg.content)}
                    disabled={playingAudio === msg.id}
                    className="ml-2 inline-flex items-center justify-center text-stone-400 hover:text-amber-600 transition-colors"
                    title="Listen with voice TTS"
                  >
                    {playingAudio === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}

                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap gap-1">
                    {msg.followUps.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(chip)}
                        className="px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-medium transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-stone-200 p-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5 text-xs text-stone-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Mercato is analyzing your business...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 sm:p-4 border-t border-stone-200 bg-white space-y-2">
          {speechError && (
            <div className="flex items-center justify-between text-[11px] bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200">
              <span>{speechError}</span>
              <button onClick={() => setSpeechError(null)} className="font-bold">x</button>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleSpeech}
              title={isListening ? 'Stop listening' : 'Dictate with microphone'}
              className={`p-2 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Ask about sales, restock, or profit...'}
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-stone-400 text-center">
            English • አማርኛ (Amharic) • Afaan Oromo
          </p>
        </div>
      </div>
    </>
  );
};
