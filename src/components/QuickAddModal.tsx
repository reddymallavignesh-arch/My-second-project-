import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { parseNaturalLanguageTransaction } from '../services/api';
import { Transaction } from '../types/finance';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

const PRESET_PROMPTS = [
  'Dinner with teammates at Olive Garden $64.20 on Visa yesterday',
  'Weekly grocery haul at Trader Joe’s $92.40 on card',
  'Monthly gym membership fee $85.00 auto debit',
  'Freelance web development payment received $850 direct deposit',
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<Partial<Transaction> | null>(null);

  if (!isOpen) return null;

  const handleParse = async (textToParse?: string) => {
    const text = (textToParse || promptText).trim();
    if (!text || isParsing) return;

    setIsParsing(true);
    try {
      const result = await parseNaturalLanguageTransaction(text);
      setParsedResult(result);
    } catch (err: any) {
      console.error(err);
      alert('Failed to parse text: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedResult || !parsedResult.amount || !parsedResult.merchant) return;

    onAddTransaction({
      type: parsedResult.type || 'expense',
      amount: parsedResult.amount,
      merchant: parsedResult.merchant,
      category: parsedResult.category || ('Food & Dining' as any),
      date: parsedResult.date || new Date().toISOString().split('T')[0],
      paymentMethod: parsedResult.paymentMethod || ('Credit Card' as any),
      notes: parsedResult.notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span>AI Quick Natural Log</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Type or speak naturally in plain language. Gemini will automatically extract amount, merchant, category, date, and payment method!
        </p>

        {/* Text Input */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              placeholder="e.g. Lunch at Chipotle $18.50 with Apple Pay today"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
              autoFocus
            />
          </div>

          {/* Quick presets */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Try an example:</div>
            <div className="flex flex-col gap-1.5">
              {PRESET_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPromptText(p);
                    handleParse(p);
                  }}
                  className="text-left text-xs text-slate-300 hover:text-emerald-400 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition truncate"
                >
                  &ldquo;{p}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Parse Button */}
        {!parsedResult && (
          <button
            onClick={() => handleParse()}
            disabled={!promptText.trim() || isParsing}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Parse Transaction</span>
              </>
            )}
          </button>
        )}

        {/* Parsed Result Card */}
        {parsedResult && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Parsed Successfully</span>
              </span>
              <span className="text-base font-black text-white">
                {parsedResult.type === 'income' ? '+' : '-'}${parsedResult.amount?.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Merchant / Source:</span>
                <div className="font-semibold text-white mt-0.5">{parsedResult.merchant}</div>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>
                <div className="font-semibold text-emerald-400 mt-0.5">{parsedResult.category}</div>
              </div>
              <div>
                <span className="text-slate-400">Date:</span>
                <div className="font-semibold text-white mt-0.5">{parsedResult.date}</div>
              </div>
              <div>
                <span className="text-slate-400">Payment:</span>
                <div className="font-semibold text-white mt-0.5">{parsedResult.paymentMethod}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setParsedResult(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
              >
                Clear
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Add to Transactions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
