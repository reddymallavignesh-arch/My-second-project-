import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Send,
  Loader2,
  RefreshCw,
  Clock,
  Layers,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  Transaction,
  CategoryBudget,
  SavingsGoal,
  FinancialAuditReport,
  AIChatMessage,
} from '../types/finance';
import { UserProfile, CURRENCY_SYMBOLS } from '../types/auth';
import { formatCurrency } from '../utils/currency';
import { requestFinancialAudit, sendAIChatMessage } from '../services/api';

interface AIAdvisorViewProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  auditReport: FinancialAuditReport | null;
  setAuditReport: (report: FinancialAuditReport) => void;
  currency?: UserProfile['currency'];
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({
  transactions,
  budgets,
  goals,
  auditReport,
  setAuditReport,
  currency = 'USD',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'chat'>('audit');
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  // Chat state
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content:
        `Hello! I'm **SpendWise AI**, your personal financial strategist. I've analyzed your cash flow, category budgets, and savings vaults. Ask me anything about your money, upcoming purchases, or how to eliminate hidden expense leaks!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        `Can I afford a ${symbol}1,200 purchase next month?`,
        `How can I cut ${symbol}200 from my monthly spending?`,
        'What are my biggest recurring expense leaks?',
      ],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Calculations for context
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthStr));

  const totalIncome = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  // Run or refresh financial audit
  const handleRunAudit = async () => {
    setIsLoadingAudit(true);
    try {
      const report = await requestFinancialAudit({
        transactions,
        budgets,
        goals,
      });
      setAuditReport(report);
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate AI financial audit: ' + err.message);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Send message in chat
  const handleSendChat = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || isSendingChat) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const response = await sendAIChatMessage({
        messages: [...chatMessages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        financialContext: {
          totalIncome,
          totalExpense,
          netSavings,
          budgets,
          goals,
          recentTransactions: transactions.slice(0, 20),
        },
      });

      const assistantMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: response.suggestions,
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Apologies, I encountered an issue analyzing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-full">
      {/* Top Banner & Sub-Tabs */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SpendWise AI Advisor & Copilot</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Personal Wealth Strategist
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5 max-w-xl">
              Continuous audit of cash leaks, 50/30/20 balance, runway health, and conversational advisory powered by Gemini 3.8 Flash.
            </p>
          </div>

          {/* Sub-tab Pill Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'audit'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Deep Financial Audit</span>
            </button>
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'chat'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Ask Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: Deep Financial Audit */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          {/* Audit Controls & Score Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex flex-col items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
                <span className="text-2xl leading-none">
                  {auditReport?.overallHealthScore ?? 84}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Grade {auditReport?.scoreGrade ?? 'B+'}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Financial Health & Efficiency Score
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {auditReport?.statusSummary ??
                    'Your cash flow is solidly positive. 28% savings rate exceeds standard 20% guidelines.'}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Last analyzed:{' '}
                    {auditReport?.generatedAt
                      ? new Date(auditReport.generatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now (demo model)'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunAudit}
              disabled={isLoadingAudit}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition disabled:opacity-50 shrink-0"
            >
              {isLoadingAudit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Auditing Finances...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh AI Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Emergency Runway</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {auditReport?.runwayMonths ?? 5.8} <span className="text-sm font-normal text-slate-400">months</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Months you can survive if all income ceased today</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Projected 1-Year Wealth</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-2">
                {formatCurrency(auditReport?.projectedAnnualSavings ?? 12720, currency)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Estimated annual cash accumulated at current run rate</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Savings Rate Target</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {auditReport?.rule503020?.savings?.percentage ?? 28}%{' '}
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Exceeds 20%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Standard benchmark is 20% of net income</p>
            </div>
          </div>

          {/* 50/30/20 Rule Deep Dive */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>50 / 30 / 20 Rule Analysis</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Evaluating essentials vs discretionary lifestyle</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Needs (Target 50%)</span>
                  <span className="font-bold text-white">{auditReport?.rule503020?.needs?.percentage ?? 51}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${auditReport?.rule503020?.needs?.percentage ?? 51}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  {formatCurrency(auditReport?.rule503020?.needs?.amount ?? 1970, currency)} allocated to essentials.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Wants (Target 30%)</span>
                  <span className="font-bold text-white">{auditReport?.rule503020?.wants?.percentage ?? 21}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-400"
                    style={{ width: `${auditReport?.rule503020?.wants?.percentage ?? 21}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  {formatCurrency(auditReport?.rule503020?.wants?.amount ?? 820, currency)} in dining and leisure.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Savings (Target 20%)</span>
                  <span className="font-bold text-emerald-400">
                    {auditReport?.rule503020?.savings?.percentage ?? 28}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${auditReport?.rule503020?.savings?.percentage ?? 28}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  {formatCurrency(auditReport?.rule503020?.savings?.amount ?? 1060, currency)} into savings and vaults.
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 italic pt-1">
              &ldquo;{auditReport?.rule503020?.analysis ??
                'Your core needs (housing + utilities) are comfortably at 51%, and your savings rate (28%) is exceeding the 20% benchmark.'}&rdquo;
            </p>
          </div>

          {/* Detected Spending Leaks & Recurring Waste */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Detected Spending Leaks & Anomalies</span>
                </h3>
                <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {(auditReport?.topLeakages || []).length || 2} Potential Leaks
                </span>
              </div>

              <div className="space-y-3">
                {(auditReport?.topLeakages || [
                  {
                    title: 'Dual Streaming Subscriptions',
                    category: 'Subscriptions',
                    description: 'Dual streaming service charges detected (Spotify Premium and Tidal HiFi active simultaneously).',
                    estimatedMonthlySaving: 21.98,
                    urgency: 'medium' as const,
                  },
                  {
                    title: 'Midweek Surge Delivery',
                    category: 'Food & Dining',
                    description: 'Midweek food delivery delivery fees and surge pricing averaged +18% over weekend dining.',
                    estimatedMonthlySaving: 74.5,
                    urgency: 'high' as const,
                  },
                ]).map((leak, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{leak.title || leak.category}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            leak.urgency === 'high'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {leak.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{leak.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-rose-400">
                        -{formatCurrency(leak.estimatedMonthlySaving, currency)}/mo
                      </div>
                      <div className="text-[10px] text-slate-500">recoverable</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Strategic Advice */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-emerald-400" />
                <span>Actionable Recommendations</span>
              </h3>

              <div className="space-y-3">
                {(auditReport?.actionableTips || [
                  {
                    title: 'Automate 20% Split on Payday',
                    impact: 'high',
                    advice: `Route ${formatCurrency(970, currency)} directly to your High-Yield Emergency Vault on direct deposit morning to prevent discretionary lifestyle creep.`,
                  },
                  {
                    title: 'Lock In Groceries Meal Prep Cap',
                    impact: 'medium',
                    advice: `Pre-order grocery baskets once weekly to eliminate ${symbol}40-60 impromptu midweek trips.`,
                  },
                ]).map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tip.title}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          tip.impact === 'high'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-teal-500/20 text-teal-300'
                        }`}
                      >
                        {tip.impact} impact
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{tip.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Interactive AI Chat Copilot */}
      {activeSubTab === 'chat' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm flex flex-col h-[650px] max-w-full overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">SpendWise Financial Copilot</h3>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Context: {formatCurrency(totalIncome, currency)} Income, {formatCurrency(totalExpense, currency)} Outflow
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                setChatMessages([
                  {
                    id: 'reset',
                    role: 'assistant',
                    content: 'Chat history cleared. How can I assist your wealth building today?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 transition"
            >
              Clear
            </button>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-600/20'
                        : 'bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700/60 shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    <div
                      className={`text-[10px] mt-2 font-medium ${
                        isUser ? 'text-emerald-200' : 'text-slate-500'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Assistant Suggested Prompts */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[85%]">
                      {msg.suggestions.map((sugg, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendChat(sugg)}
                          className="text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-full px-3 py-1 transition flex items-center gap-1 shadow-sm"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>{sugg}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isSendingChat && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 p-3 rounded-2xl w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>SpendWise AI is calculating finances...</span>
              </div>
            )}
          </div>

          {/* Chat input form */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/70">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Ask SpendWise: 'Can I afford a ${symbol}500 flight?', 'How to optimize my subscriptions?'...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isSendingChat}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shrink-0"
              >
                {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
