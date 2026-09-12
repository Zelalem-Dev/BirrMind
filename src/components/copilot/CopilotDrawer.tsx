import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, Volume2, Loader2 } from 'lucide-react';
import { Business, User } from '../../types/index.js';

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
      content: `Selam ${user.fullName.split(' ')[0]}! I'm Mercato AI. How can I help you manage ${business.name} today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages.map(m => ({ role: m.role, content: m.content })) })
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer || data.text || 'I am unable to process that right now.'
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error communicating with the AI service.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleListen = async (messageId: string, text: string) => {
    if (playingAudio === messageId) return;
    setPlayingAudio(messageId);
    
    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      
      audio.play();
    } catch (err) {
      console.error(err);
      setPlayingAudio(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-2 text-amber-900">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-bold text-lg">Mercato AI Copilot</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-amber-100 rounded text-amber-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3 rounded-xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-amber-600 text-white rounded-tr-none' 
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.content}
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => handleListen(msg.id, msg.content)}
                    disabled={playingAudio === msg.id}
                    className="ml-2 inline-flex items-center justify-center text-stone-400 hover:text-amber-600 transition-colors"
                    title="Listen to response"
                  >
                    {playingAudio === msg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-stone-200 p-3 rounded-xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-200 bg-white">
          <form onSubmit={handleSend} className="flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your business..."
              className="flex-1 pl-4 pr-10 py-2.5 bg-stone-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-1.5 p-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-full transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-center gap-4">
            <button type="button" className="text-[10px] text-stone-500 hover:text-amber-700 flex items-center gap-1 transition-colors">
              <Bot className="w-3 h-3" /> Audio Input
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
