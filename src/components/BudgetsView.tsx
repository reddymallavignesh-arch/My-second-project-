import React, { useState } from 'react';
import {
  PiggyBank,
  Sparkles,
  AlertCircle,
  Plus,
  Edit2,
  Check,
  TrendingDown,
  Loader2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { CategoryBudget, ExpenseCategory, Transaction } from '../types/finance';
import { CATEGORY_COLORS } from '../data/initialData';
import { optimizeBudgetWithAI } from '../services/api';
import { UserProfile, CURRENCY_SYMBOLS } from '../types/auth';
import { formatCurrency, convertFromUSD, convertToUSD } from '../utils/currency';

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  currency?: UserProfile['currency'];
  onUpdateBudget: (category: ExpenseCategory, newLimit: number) => void;
  onApplyOptimizedBudgets: (newBudgets: CategoryBudget[]) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  transactions,
  currency = 'USD',
  onUpdateBudget,
  onApplyOptimizedBudgets,
}) => {
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizerResults, setOptimizerResults] = useState<{
    suggestedBudgets: Array<{ category: string; monthlyLimit: number; rational: string }>;
    targetSavingsRate: number;
    monthlySavingsTarget: number;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute live spending per category for current month
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate());

  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentMonthStr)
  );

  const totalMonthlyIncome = transactions
    .filter((t) => t.type === 'income' && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + t.amount, 0) || 5000;

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);

  // Map category spent
  const categorySpentMap: Record<string, number> = {};
  currentMonthExpenses.forEach((t) => {
    categorySpentMap[t.category] = (categorySpentMap[t.category] || 0) + t.amount;
  });

  const totalActualSpent = Object.values(categorySpentMap).reduce((s, v) => s + v, 0);

  const handleStartEdit = (b: CategoryBudget) => {
    setEditingCategory(b.category);
    const converted = convertFromUSD(b.monthlyLimit, currency);
    setEditLimitValue(
      currency === 'JPY' ? Math.round(converted).toString() : (Math.round(converted * 100) / 100).toString()
    );
  };

  const handleSaveEdit = (category: ExpenseCategory) => {
    const val = parseFloat(editLimitValue);
    if (!isNaN(val) && val >= 0) {
      const baseUSDVal = convertToUSD(val, currency);
      onUpdateBudget(category, baseUSDVal);
      showToast(`Updated budget limit for ${category} to ${formatCurrency(baseUSDVal, currency)}`);
    }
    setEditingCategory(null);
  };

  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    try {
      const res = await optimizeBudgetWithAI({
        monthlyIncome: totalMonthlyIncome,
        currentBudgets: budgets,
        expenses: currentMonthExpenses,
      });
      setOptimizerResults(res);
      showToast('AI generated an optimized 50/30/20 budget framework!');
    } catch (err: any) {
      console.error(err);
      alert('Could not generate budget recommendations: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimizer = () => {
    if (!optimizerResults) return;
    const updated: CategoryBudget[] = budgets.map((b) => {
      const match = optimizerResults.suggestedBudgets.find((s) => s.category === b.category);
      if (match) {
        return {
          ...b,
          monthlyLimit: match.monthlyLimit,
        };
      }
      return b;
    });

    onApplyOptimizedBudgets(updated);
    setOptimizerResults(null);
    showToast('Applied AI optimized budget limits!');
  };

  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Category Budgets</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Set monthly guardrails to keep expenses under control and maximize your savings runway.
          </p>
        </div>

        {/* AI Optimizer Trigger */}
        <button
          onClick={handleRunOptimizer}
          disabled={isOptimizing}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
        >
          {isOptimizing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{isOptimizing ? 'Analyzing with Gemini...' : 'AI Budget Optimizer'}</span>
        </button>
      </div>

      {/* AI Optimizer Results Modal / Banner */}
      {optimizerResults && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Gemini 50/30/20 Optimized Recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOptimizerResults(null)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white rounded-lg transition"
              >
                Dismiss
              </button>
              <button
                onClick={handleApplyOptimizer}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
              >
                Apply All Changes
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Based on your monthly net income ({formatCurrency(totalMonthlyIncome, currency)}), Gemini has calculated limits that will unlock a{' '}
            <span className="text-emerald-400 font-bold">{optimizerResults.targetSavingsRate}% savings rate</span> ({formatCurrency(optimizerResults.monthlySavingsTarget, currency)}/mo in wealth building):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {optimizerResults.suggestedBudgets.map((item) => (
              <div key={item.category} className="p-3 rounded-xl bg-slate-950/70 border border-slate-700/60 text-xs">
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span>{item.category}</span>
                  <span className="text-emerald-400">{formatCurrency(item.monthlyLimit, currency)}</span>
                </div>
                <p className="text-[11px] text-slate-400">{item.rational}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Monthly Cap</div>
          <div className="text-2xl font-bold text-white mt-2">
            {formatCurrency(totalBudgeted, currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across {budgets.length} spending categories</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Month Spent</div>
          <div className="text-2xl font-bold text-white mt-2">
            {formatCurrency(totalActualSpent, currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {Math.round((totalActualSpent / (totalBudgeted || 1)) * 100)}% of total budget used
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Remaining Buffer</div>
          <div
            className={`text-2xl font-bold mt-2 ${
              totalBudgeted - totalActualSpent >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(Math.abs(totalBudgeted - totalActualSpent), currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {daysRemaining} days remaining in billing cycle
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const spent = categorySpentMap[b.category] || b.spent || 0;
          const percentage = Math.round((spent / (b.monthlyLimit || 1)) * 100);
          const remaining = b.monthlyLimit - spent;
          const dailyAllowance = Math.max(0, remaining / daysRemaining);
          const isOverBudget = spent > b.monthlyLimit;
          const isNearBudget = percentage >= 80 && !isOverBudget;
          const color = CATEGORY_COLORS[b.category] || '#10b981';

          return (
            <div
              key={b.category}
              className={`bg-slate-900/90 border rounded-2xl p-5 space-y-3.5 shadow-sm transition hover:border-slate-700 ${
                isOverBudget
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : isNearBudget
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <h3 className="text-sm font-bold text-white">{b.category}</h3>
                </div>

                {isOverBudget ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
                    Over Cap
                  </span>
                ) : isNearBudget ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    Near Limit
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    On Track
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverBudget ? 'bg-rose-500' : isNearBudget ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                  <span>{formatCurrency(spent, currency)} spent</span>
                  <span className="font-semibold text-white">{percentage}%</span>
                </div>
              </div>

              {/* Limit & Edit */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {editingCategory === b.category ? (
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-slate-400 text-xs">{currencySymbol}</span>
                    <input
                      type="number"
                      value={editLimitValue}
                      onChange={(e) => setEditLimitValue(e.target.value)}
                      className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(b.category)}
                      className="p-1 rounded bg-emerald-500 text-slate-950 font-bold"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="text-slate-500 hover:text-slate-300 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <div className="text-slate-400 text-[11px]">
                        Monthly Cap: <span className="font-semibold text-white">{formatCurrency(b.monthlyLimit, currency)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {remaining >= 0 ? (
                          <>
                            <span className="text-emerald-400 font-semibold">{formatCurrency(remaining, currency)}</span> left (~{formatCurrency(dailyAllowance, currency)}/day)
                          </>
                        ) : (
                          <span className="text-rose-400 font-semibold">
                            {formatCurrency(Math.abs(remaining), currency)} over budget
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartEdit(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Adjust limit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
