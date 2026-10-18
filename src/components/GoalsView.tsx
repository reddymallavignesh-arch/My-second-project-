import React, { useState } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  Trophy,
} from 'lucide-react';
import { SavingsGoal } from '../types/finance';
import { triggerConfetti } from '../utils/confetti';
import { UserProfile, CURRENCY_SYMBOLS } from '../types/auth';
import { formatCurrency, convertToUSD } from '../utils/currency';

interface GoalsViewProps {
  goals: SavingsGoal[];
  currency?: UserProfile['currency'];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onContributeGoal: (goalId: string, amount: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  currency = 'USD',
  onAddGoal,
  onContributeGoal,
  onDeleteGoal,
}) => {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newCurrentAmount, setNewCurrentAmount] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('2026-12-31');
  const [newCategory, setNewCategory] = useState('Savings Vault');
  const [newNotes, setNewNotes] = useState('');
  const [customAmountId, setCustomAmountId] = useState<string | null>(null);
  const [customAmountValue, setCustomAmountValue] = useState('');

  const totalSavedAcrossGoals = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTargetAcrossGoals = goals.reduce((s, g) => s + g.targetAmount, 0);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newTargetAmount);
    const initial = parseFloat(newCurrentAmount) || 0;

    if (!newTitle.trim() || isNaN(target) || target <= 0) {
      alert('Please enter a valid title and target amount.');
      return;
    }

    onAddGoal({
      title: newTitle.trim(),
      targetAmount: convertToUSD(target, currency),
      currentAmount: convertToUSD(initial, currency),
      targetDate: newTargetDate,
      category: newCategory,
      color: '#10b981',
      notes: newNotes.trim() || undefined,
    });

    setIsAddingGoal(false);
    setNewTitle('');
    setNewTargetAmount('');
    setNewCurrentAmount('');
    setNewNotes('');
  };

  const handleContribute = (goalId: string, amountInBaseUSD: number) => {
    onContributeGoal(goalId, amountInBaseUSD);
    triggerConfetti();
  };

  const handleCustomContributeSubmit = (goalId: string) => {
    const val = parseFloat(customAmountValue);
    if (!isNaN(val) && val > 0) {
      const baseVal = convertToUSD(val, currency);
      handleContribute(goalId, baseVal);
      setCustomAmountValue('');
      setCustomAmountId(null);
    }
  };

  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Savings Vaults & Goals</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Turn discretionary savings into high-impact life milestones.
          </p>
        </div>

        <button
          onClick={() => setIsAddingGoal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate Vault Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Saved Across Goals</div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {formatCurrency(totalSavedAcrossGoals, currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Accumulated in vaults</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Target Objective</div>
          <div className="text-2xl font-bold text-white mt-2">
            {formatCurrency(totalTargetAcrossGoals, currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalTargetAcrossGoals > 0
              ? `${Math.round((totalSavedAcrossGoals / totalTargetAcrossGoals) * 100)}% overall milestone reached`
              : '0% completed'}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Vaults</div>
          <div className="text-2xl font-bold text-white mt-2">{goals.length}</div>
          <div className="text-xs text-slate-500 mt-1">Milestones tracked</div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((g) => {
          const progress = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          const isFinished = g.currentAmount >= g.targetAmount;

          return (
            <div
              key={g.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 space-y-4 shadow-sm transition hover:border-slate-700 ${
                isFinished ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">{g.title}</h3>
                    {isFinished && (
                      <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                        <Trophy className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">{g.category}</span>
                </div>

                <button
                  onClick={() => onDeleteGoal(g.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition"
                  title="Delete goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">{formatCurrency(g.currentAmount, currency)}</span>
                  <span className="text-slate-400 font-medium">
                    {formatCurrency(g.targetAmount, currency)} ({progress}%)
                  </span>
                </div>
              </div>

              {/* Details & Target Date */}
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <span>Target Date:</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {g.targetDate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining:</span>
                  <span className="text-slate-300 font-medium">
                    {isFinished ? 'Fully Funded!' : `${formatCurrency(remaining, currency)} left`}
                  </span>
                </div>
                {g.notes && <p className="text-[11px] text-slate-500 italic pt-1">{g.notes}</p>}
              </div>

              {/* Contribution Buttons */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 mb-2">Deposit to Vault:</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[25, 50, 100, 250].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleContribute(g.id, amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      +{formatCurrency(amt, currency)}
                    </button>
                  ))}

                  <button
                    onClick={() => setCustomAmountId(customAmountId === g.id ? null : g.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition"
                  >
                    Custom
                  </button>
                </div>

                {customAmountId === g.id && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-xs text-slate-400">{currencySymbol}</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={customAmountValue}
                      onChange={(e) => setCustomAmountValue(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white w-28 focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleCustomContributeSubmit(g.id)}
                      className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-400 transition"
                    >
                      Deposit
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {isAddingGoal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>Create Savings Goal</span>
              </h3>
              <button
                onClick={() => setIsAddingGoal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 6-Month Emergency Fund, Japan Trip"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={newTargetAmount}
                    onChange={(e) => setNewTargetAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Current Saved ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1200"
                    value={newCurrentAmount}
                    onChange={(e) => setNewCurrentAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Emergency Vault">Emergency Vault</option>
                    <option value="Travel">Travel</option>
                    <option value="Tech & Career">Tech & Career</option>
                    <option value="Investment">Investment</option>
                    <option value="Home & Real Estate">Home & Real Estate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Motivation</label>
                <textarea
                  rows={2}
                  placeholder="Optional motivation or account details..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
