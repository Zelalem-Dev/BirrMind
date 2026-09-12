import React, { useState } from 'react';
import { Mic, Loader2, PlaySquare } from 'lucide-react';
import { Product } from '../../types/index.js';

interface VoiceSaleInputProps {
  products: Product[];
  onItemsParsed: (items: { productId: string; quantity: number }[]) => void;
}

export const VoiceSaleInput: React.FC<VoiceSaleInputProps> = ({ products, onItemsParsed }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      processVoiceInput();
    } else {
      setIsRecording(true);
      setTranscript('');
    }
  };

  const processVoiceInput = async () => {
    setIsProcessing(true);
    // Simulate AI STT and parsing logic
    setTimeout(() => {
      setTranscript("Customer said: Give me 2 espressos and 1 croissant.");
      setIsProcessing(false);
      
      // Mock matched items from catalog
      const espresso = products.find(p => p.name.toLowerCase().includes('espresso'));
      const croissant = products.find(p => p.name.toLowerCase().includes('croissant'));
      
      const parsed = [];
      if (espresso) parsed.push({ productId: espresso.id, quantity: 2 });
      if (croissant) parsed.push({ productId: croissant.id, quantity: 1 });
      
      if (parsed.length > 0) {
        onItemsParsed(parsed);
      }
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex flex-col items-center justify-center space-y-3">
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-rose-100 text-rose-600 animate-pulse ring-4 ring-rose-100'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
        }`}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isRecording ? (
          <PlaySquare className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>
      
      <div className="text-center">
        <h4 className="text-sm font-bold text-stone-900">
          {isRecording ? 'Listening...' : isProcessing ? 'Parsing Intent...' : 'Voice Order'}
        </h4>
        <p className="text-xs text-stone-500 max-w-[200px] mt-1">
          {transcript || 'Tap to dictate a customer order in Amharic or English.'}
        </p>
      </div>
    </div>
  );
};
