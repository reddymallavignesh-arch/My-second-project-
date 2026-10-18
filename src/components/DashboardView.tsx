import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Send,
  Loader2,
  Calendar,
  Layers,
  Flame,
} from 'lucide-react';
import {
  Transaction,
  CategoryBudget,
  SavingsGoal,
  FinancialAuditReport,
} from '../types/finance';
import { CATEGORY_COLORS } from '../data/initialData';
import { UserProfile } from '../types/auth';
import { formatCurrency } from '../utils/currency';

interface DashboardViewProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  auditReport: FinancialAuditReport | null;
  currency?: UserProfile['currency'];
  onNavigateToTab: (tab: 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'ai-advisor') => void;
  onOpenQuickAdd: () => void;
  onOpenReceiptScanner: () => void;
  onQuickNaturalAdd: (text: string) => Promise<void>;
  onContributeGoal: (goalId: string, amount: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  budgets,
  goals,
  auditReport,
  currency = 'USD',
  onNavigateToTab,
  onOpenQuickAdd,
  onOpenReceiptScanner,
  onQuickNaturalAdd,
  onContributeGoal,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Compute metrics for current month
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthStr));

  const totalIncome = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category spending aggregation
  const categorySpending: Record<string, number> = {};
  currentMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);

  // Needs vs Wants vs Savings estimation (50/30/20)
  const needsCategories = ['Housing & Rent', 'Groceries', 'Utilities & Bills', 'Transportation', 'Health & Wellness'];
  const needsAmount = currentMonthTxs
    .filter((t) => t.type === 'expense' && needsCategories.includes(t.category))
    .reduce((s, t) => s + t.amount, 0);

  const wantsAmount = totalExpense - needsAmount;
  const effectiveIncome = totalIncome || 1;
  const needsPercent = Math.min(100, Math.round((needsAmount / effectiveIncome) * 100));
  const wantsPercent = Math.min(100, Math.round((wantsAmount / effectiveIncome) * 100));
  const savingsPercent = Math.max(0, Math.min(100, Math.round((netSavings / effectiveIncome) * 100)));

  // Budget warnings
  const budgetAlerts = budgets.filter((b) => {
    const spent = categorySpending[b.category] || b.spent || 0;
    return spent >= b.monthlyLimit * 0.8;
  });

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || isSubmittingQuick) return;
    setIsSubmittingQuick(true);
    try {
      await onQuickNaturalAdd(quickInput.trim());
      setQuickInput('');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & AI Quick Prompt Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SpendWise Financial Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Good day! Here is your financial snapshot.
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Cash flow is positive this month with a <span className="text-emerald-400 font-semibold">{savingsRate}% savings rate</span>.
            </p>
          </div>

          {/* Natural Language Quick-Add Input */}
          <form
            onSubmit={handleQuickSubmit}
            className="w-full md:max-w-md bg-slate-950/70 border border-slate-700/80 rounded-xl p-1.5 flex items-center shadow-inner focus-within:border-emerald-500/80 transition"
          >
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="AI Quick Log: 'Dinner $42 with card' or 'Salary $2,400'"
              className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              disabled={isSubmittingQuick}
            />
            <button
              type="submit"
              disabled={isSubmittingQuick || !quickInput.trim()}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shrink-0"
            >
              {isSubmittingQuick ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Log</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      {/* Primary KPI Metric Cards - Grid Layout (2x2 on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Monthly Income */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-5 hover:border-slate-700 transition shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Income</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight break-words">
              {formatCurrency(totalIncome, currency)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-emerald-400 font-medium truncate">
            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">Active income</span>
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-5 hover:border-slate-700 transition shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Outflow</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight break-words">
              {formatCurrency(totalExpense, currency)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 truncate">
            <span className="truncate">{currentMonthTxs.filter((t) => t.type === 'expense').length} logged expenses</span>
          </div>
        </div>

        {/* Net Savings & Savings Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-5 hover:border-slate-700 transition shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Net Savings</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight ${netSavings >= 0 ? 'text-white' : 'text-rose-400'} break-words`}>
              {formatCurrency(Math.abs(netSavings), currency)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {savingsRate}%
            </span>
          </div>
          <div className="mt-1.5 text-[11px] sm:text-xs text-slate-400 truncate">
            {savingsRate >= 20 ? 'Target achieved' : 'Building wealth'}
          </div>
        </div>

        {/* AI Financial Health Score */}
        <div
          onClick={() => onNavigateToTab('ai-advisor')}
          className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-5 hover:border-emerald-500/60 cursor-pointer transition shadow-lg shadow-emerald-950/20 group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>AI Health</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition" />
          </div>
          <div className="mt-2 sm:mt-3 flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-base sm:text-xl shadow-md shadow-emerald-500/20 shrink-0">
              {auditReport?.overallHealthScore ?? 84}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400 font-medium">Grade {auditReport?.scoreGrade ?? 'B+'}</div>
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition truncate">
                {auditReport ? 'View Report' : 'Analyze AI'}
              </div>
            </div>
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
            {auditReport?.statusSummary ?? 'Strong cash flow.'}
          </div>
        </div>
      </div>

      {/* Budget Overrun Warnings (if any) */}
      {budgetAlerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {budgetAlerts.length} Category {budgetAlerts.length === 1 ? 'Budget' : 'Budgets'} Near Limit
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {budgetAlerts.map((b) => b.category).join(', ')} has reached &gt;80% of monthly cap.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('budgets')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
          >
            <span>Manage Budgets</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Visual Analytics Grid: 50/30/20 Framework & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 50/30/20 Balanced Framework */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>50 / 30 / 20 Framework</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Needs vs Wants vs Savings allocation</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Target
            </span>
          </div>

          <div className="space-y-4">
            {/* Needs */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Needs (Rent, Groceries, Utilities)</span>
                <span className="text-white font-bold">{needsPercent}% <span className="text-slate-500">/ 50%</span></span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    needsPercent <= 50 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, needsPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{formatCurrency(needsAmount, currency)} spent</span>
                <span>{needsPercent <= 50 ? 'Under target limit' : 'Slightly high'}</span>
              </div>
            </div>

            {/* Wants */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Wants (Dining, Shopping, Leisure)</span>
                <span className="text-white font-bold">{wantsPercent}% <span className="text-slate-500">/ 30%</span></span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    wantsPercent <= 30 ? 'bg-teal-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, wantsPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{formatCurrency(wantsAmount, currency)} spent</span>
                <span>{wantsPercent <= 30 ? 'Controlled spending' : 'Exceeding target'}</span>
              </div>
            </div>

            {/* Savings */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Savings & Investments</span>
                <span className="text-white font-bold">{savingsPercent}% <span className="text-slate-500">/ 20%</span></span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, savingsPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{formatCurrency(Math.max(0, netSavings), currency)} saved</span>
                <span className="text-emerald-400 font-semibold">{savingsPercent >= 20 ? 'Goal exceeded!' : 'Building buffer'}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {auditReport?.rule503020?.analysis ??
                'Your cash reserves are strong. Allocating a steady portion to your emergency fund will protect against unexpected expenses.'}
            </span>
          </div>
        </div>

        {/* Top Spending Categories Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Top Spending Categories</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Where your money went this month</p>
            </div>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {sortedCategories.slice(0, 5).map(([category, amount]) => {
              const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
              const color = CATEGORY_COLORS[category] || '#10b981';

              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-semibold text-slate-200">{category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {formatCurrency(amount, currency)}
                      </span>
                      <span className="text-slate-400 text-[11px] font-medium w-9 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, percentage)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenQuickAdd}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
              >
                + Manual Transaction
              </button>
              <button
                onClick={onOpenReceiptScanner}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scan Receipt</span>
              </button>
            </div>
            <button
              onClick={() => onNavigateToTab('budgets')}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium"
            >
              Adjust Category Budgets &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Savings Goals & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Savings Goals Snapshot */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-400" />
                <span>Active Savings Goals</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Tracking milestones toward targets</p>
            </div>
            <button
              onClick={() => onNavigateToTab('goals')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              All Goals
            </button>
          </div>

          <div className="space-y-4">
            {goals.slice(0, 3).map((goal) => {
              const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

              return (
                <div key={goal.id} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{goal.title}</span>
                    <span className="text-xs font-bold text-emerald-400">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>
                      {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
                    </span>
                    <button
                      onClick={() => onContributeGoal(goal.id, 50)}
                      className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-[10px] font-semibold transition"
                    >
                      + {formatCurrency(50, currency)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Recent Transactions</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest recorded cash inflows and outflows</p>
            </div>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Manage ({transactions.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {transactions.slice(0, 5).map((t) => {
              const isIncome = t.type === 'income';
              const color = CATEGORY_COLORS[t.category] || '#64748b';

              return (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-white truncate">
                        {t.merchant}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                          {t.category}
                        </span>
                        <span>•</span>
                        <span>{t.date}</span>
                        {t.isRecurring && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                              Recurring
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs sm:text-sm font-bold ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(t.amount, currency)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">{t.paymentMethod}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
