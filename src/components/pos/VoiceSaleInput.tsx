import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, PlaySquare, AlertCircle, CheckCircle2, ShoppingBag, X } from 'lucide-react';
import { Product } from '../../types/index.js';

interface VoiceSaleInputProps {
  products: Product[];
  onItemsParsed: (items: { productId: string; quantity: number }[]) => void;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  አንድ: 1, ሁለት: 2, ሦስት: 3, አራት: 4, አምስት: 5,
};

export const VoiceSaleInput: React.FC<VoiceSaleInputProps> = ({ products, onItemsParsed }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textFallback, setTextFallback] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [detectedCandidates, setDetectedCandidates] = useState<{ productId: string; name: string; quantity: number }[] | null>(null);

  const recognitionRef = useRef<any>(null);

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
        setIsRecording(true);
        setErrorNotice(null);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setTranscript(text);
          parseOrderText(text);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice sale recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setErrorNotice('Microphone access was denied. You can type the order below.');
        } else {
          setErrorNotice(`Microphone error: ${event.error}. You can type the order below.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, [products]);

  const toggleRecording = () => {
    if (!speechSupported) {
      setErrorNotice('Voice speech recognition is not supported in this browser. Please type below.');
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setErrorNotice(null);
      try {
        recognitionRef.current?.start();
      } catch (err: any) {
        console.warn('Could not start microphone:', err);
      }
    }
  };

  const parseOrderText = (text: string) => {
    setIsProcessing(true);
    try {
      const lower = text.toLowerCase();
      const tokens = lower.split(/[\s,]+/);

      const matchedList: { productId: string; name: string; quantity: number }[] = [];

      for (const product of products) {
        const pLower = product.name.toLowerCase();
        const pKeywords = pLower.split(/\s+/).filter(w => w.length > 3);

        const isMatch = pKeywords.some(kw => lower.includes(kw)) || lower.includes(pLower);
        if (isMatch) {
          // Look for preceding number token or digit in query
          let qty = 1;
          for (let i = 0; i < tokens.length; i++) {
            const tok = tokens[i];
            if (/^\d+$/.test(tok)) {
              qty = parseInt(tok, 10);
            } else if (NUMBER_WORDS[tok]) {
              qty = NUMBER_WORDS[tok];
            }
          }

          matchedList.push({
            productId: product.id,
            name: product.name,
            quantity: Math.max(1, qty),
          });
        }
      }

      if (matchedList.length > 0) {
        setDetectedCandidates(matchedList);
      } else {
        setErrorNotice(`Heard: "${text}", but could not automatically match products. Please select items from catalog.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCandidates = () => {
    if (detectedCandidates && detectedCandidates.length > 0) {
      onItemsParsed(detectedCandidates.map(c => ({ productId: c.productId, quantity: c.quantity })));
      setDetectedCandidates(null);
      setTranscript('');
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex flex-col items-center justify-center space-y-3">
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-rose-100 text-rose-600 animate-pulse ring-4 ring-rose-200'
              : 'bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 border border-stone-200'
          }`}
          title={isRecording ? 'Tap to finish' : 'Tap to speak order'}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          ) : isRecording ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        <div className="text-center">
          <h4 className="text-sm font-bold text-stone-900">
            {isRecording ? 'Listening...' : isProcessing ? 'Matching Catalog...' : 'Voice Order'}
          </h4>
          <p className="text-xs text-stone-500 max-w-[200px] mt-1">
            {transcript ? `"${transcript}"` : 'Dictate a customer order in English or Amharic.'}
          </p>
        </div>

        {/* Text fallback input */}
        <div className="w-full max-w-xs pt-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textFallback.trim()) {
                parseOrderText(textFallback.trim());
                setTextFallback('');
              }
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={textFallback}
              onChange={(e) => setTextFallback(e.target.value)}
              placeholder="Or type order text..."
              className="flex-1 px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!textFallback.trim()}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
            >
              Parse
            </button>
          </form>
        </div>

        {errorNotice && (
          <div className="p-2 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-center max-w-xs">
            {errorNotice}
          </div>
        )}
      </div>

      {/* Candidate Confirmation Modal per PART 10 & 12 */}
      {detectedCandidates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-amber-950">Confirm Voice Order Items</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Verified against catalog. Confirm quantities before adding to sale.
                </p>
              </div>
              <button
                onClick={() => setDetectedCandidates(null)}
                className="p-1 rounded-lg text-amber-800 hover:bg-amber-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {detectedCandidates.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-medium text-xs text-stone-900">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded border border-stone-200">
                      Qty: {c.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <button
                onClick={() => setDetectedCandidates(null)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCandidates}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Add to Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
