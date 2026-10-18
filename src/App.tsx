/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetsView } from './components/BudgetsView';
import { GoalsView } from './components/GoalsView';
import { AIAdvisorView } from './components/AIAdvisorView';
import { TransactionModal } from './components/TransactionModal';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { QuickAddModal } from './components/QuickAddModal';
import { AuthScreen } from './components/AuthScreen';
import {
  Transaction,
  CategoryBudget,
  SavingsGoal,
  FinancialAuditReport,
  ExpenseCategory,
} from './types/finance';
import { UserProfile, DEMO_USER, CURRENCY_SYMBOLS } from './types/auth';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
} from './data/initialData';
import {
  parseNaturalLanguageTransaction,
  fetchUserDataFromBackend,
  saveUserDataToBackend,
  updateBackendUserCurrency,
} from './services/api';
import { triggerConfetti } from './utils/confetti';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Independent, persistent currency state
  const [currentCurrency, setCurrentCurrency] = useState<UserProfile['currency']>(() => {
    try {
      const saved = localStorage.getItem('spendwise_currency');
      if (saved && ['USD', 'EUR', 'GBP', 'CAD', 'INR', 'JPY'].includes(saved)) {
        return saved as UserProfile['currency'];
      }
    } catch {}
    return 'USD';
  });

  // Authentication state - restored from localStorage or initialized with DEMO_USER
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('spendwise_auth_user');
      const savedCurr = (localStorage.getItem('spendwise_currency') as UserProfile['currency']) || 'USD';
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          currency: savedCurr,
          currencySymbol: CURRENCY_SYMBOLS[savedCurr] || '$',
        };
      }
    } catch {}
    // Default to demo user with saved currency preference
    const defaultCurr = (localStorage.getItem('spendwise_currency') as UserProfile['currency']) || 'USD';
    return {
      ...DEMO_USER,
      currency: defaultCurr,
      currencySymbol: CURRENCY_SYMBOLS[defaultCurr] || '$',
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'transactions' | 'budgets' | 'goals' | 'ai-advisor'
  >('dashboard');

  // Local storage state with initial rich datasets
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('spendwise_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      const saved = localStorage.getItem('spendwise_budgets');
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem('spendwise_goals');
      return saved ? JSON.parse(saved) : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  });

  const [auditReport, setAuditReport] = useState<FinancialAuditReport | null>(() => {
    try {
      const saved = localStorage.getItem('spendwise_audit_report');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('spendwise_currency', currentCurrency);
  }, [currentCurrency]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('spendwise_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('spendwise_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('spendwise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('spendwise_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('spendwise_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (auditReport) {
      localStorage.setItem('spendwise_audit_report', JSON.stringify(auditReport));
    }
  }, [auditReport]);

  // Overall Net Cash Flow across all time (in base USD)
  const netWorth = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  // Multi-user dataset sync effect
  useEffect(() => {
    if (currentUser?.id) {
      const timer = setTimeout(() => {
        saveUserDataToBackend(currentUser.id, {
          transactions,
          budgets,
          goals,
        }).catch(() => {});
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [transactions, budgets, goals, currentUser?.id]);

  // Auth handlers
  const handleLoginSuccess = (
    user: UserProfile,
    userData?: {
      transactions: Transaction[];
      budgets: CategoryBudget[];
      goals: SavingsGoal[];
    }
  ) => {
    const effectiveCurrency = user.currency || currentCurrency;
    setCurrentCurrency(effectiveCurrency);
    localStorage.setItem('spendwise_currency', effectiveCurrency);

    const userWithCurrency: UserProfile = {
      ...user,
      currency: effectiveCurrency,
      currencySymbol: CURRENCY_SYMBOLS[effectiveCurrency] || '$',
    };
    setCurrentUser(userWithCurrency);
    localStorage.setItem('spendwise_auth_user', JSON.stringify(userWithCurrency));

    if (userData) {
      if (userData.transactions) setTransactions(userData.transactions);
      if (userData.budgets) setBudgets(userData.budgets);
      if (userData.goals) setGoals(userData.goals);
      setAuditReport(null);
    }

    setIsAuthModalOpen(false);
    showToast(`Signed in as ${user.name} (${effectiveCurrency} ${CURRENCY_SYMBOLS[effectiveCurrency] || '$'})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('spendwise_auth_user');
    setIsAuthModalOpen(true);
    showToast('Signed out of SpendWise AI');
  };

  // Currency Update Handler - immediately propagates to all views & storage
  const handleUpdateCurrency = (currency: UserProfile['currency']) => {
    setCurrentCurrency(currency);
    localStorage.setItem('spendwise_currency', currency);

    setCurrentUser((prev) => {
      if (!prev) {
        return {
          ...DEMO_USER,
          currency,
          currencySymbol: CURRENCY_SYMBOLS[currency] || '$',
        };
      }
      const updatedUser: UserProfile = {
        ...prev,
        currency,
        currencySymbol: CURRENCY_SYMBOLS[currency] || '$',
      };
      localStorage.setItem('spendwise_auth_user', JSON.stringify(updatedUser));
      if (prev.id) {
        updateBackendUserCurrency(prev.id, currency).catch(() => {});
      }
      return updatedUser;
    });

    showToast(`Currency changed to ${currency} (${CURRENCY_SYMBOLS[currency] || '$'})`);
  };

  // Handlers for transactions
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>, existingId?: string) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === existingId ? { ...txData, id: existingId } : t))
      );
      showToast('Updated transaction record!');
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      showToast(`Logged transaction for ${txData.merchant}!`);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Deleted transaction');
  };

  const handleImportCSV = (imported: Transaction[]) => {
    setTransactions((prev) => [...imported, ...prev]);
    showToast(`Added ${imported.length} imported records.`);
  };

  // Handlers for budgets
  const handleUpdateBudget = (category: ExpenseCategory, newLimit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, monthlyLimit: newLimit } : b))
    );
  };

  const handleApplyOptimizedBudgets = (newBudgets: CategoryBudget[]) => {
    setBudgets(newBudgets);
  };

  // Handlers for goals
  const handleAddGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    setGoals((prev) => [...prev, newGoal]);
    showToast(`Created savings goal: "${goalData.title}"!`);
  };

  const handleContributeGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updated = g.currentAmount + amount;
          return {
            ...g,
            currentAmount: updated,
            isCompleted: updated >= g.targetAmount,
          };
        }
        return g;
      })
    );
    triggerConfetti();
    showToast(`Deposited ${CURRENCY_SYMBOLS[currentCurrency]}${amount} to vault!`);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    showToast('Removed goal');
  };

  // Reset to rich sample data
  const handleResetData = () => {
    if (window.confirm('Reset all transactions, budgets, and savings goals to fresh sample data?')) {
      setTransactions(INITIAL_TRANSACTIONS);
      setBudgets(INITIAL_BUDGETS);
      setGoals(INITIAL_GOALS);
      setAuditReport(null);
      localStorage.removeItem('spendwise_transactions');
      localStorage.removeItem('spendwise_budgets');
      localStorage.removeItem('spendwise_goals');
      localStorage.removeItem('spendwise_audit_report');
      showToast('Reset to demo dataset successfully!');
    }
  };

  // Quick natural language transaction parser from dashboard
  const handleQuickNaturalAdd = async (text: string) => {
    const parsed = await parseNaturalLanguageTransaction(text);
    if (parsed.amount && parsed.merchant) {
      handleSaveTransaction({
        type: parsed.type || 'expense',
        amount: parsed.amount,
        merchant: parsed.merchant,
        category: parsed.category || ('Food & Dining' as any),
        date: parsed.date || new Date().toISOString().split('T')[0],
        paymentMethod: parsed.paymentMethod || ('Credit Card' as any),
        notes: parsed.notes,
      });
    } else {
      showToast('Could not extract amount or merchant. Opening manual entry...');
      setIsTxModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden max-w-full">
      {/* Global Navigation with in-frame controls & prominent currency & login buttons */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddModalOpen(true)}
        onOpenReceiptScanner={() => setIsReceiptModalOpen(true)}
        onResetData={handleResetData}
        netWorth={netWorth}
        user={currentUser}
        currentCurrency={currentCurrency}
        onLogout={handleLogout}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onUpdateCurrency={handleUpdateCurrency}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            auditReport={auditReport}
            currency={currentCurrency}
            onNavigateToTab={setActiveTab}
            onOpenQuickAdd={() => setIsTxModalOpen(true)}
            onOpenReceiptScanner={() => setIsReceiptModalOpen(true)}
            onQuickNaturalAdd={handleQuickNaturalAdd}
            onContributeGoal={handleContributeGoal}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            currency={currentCurrency}
            onAddTransaction={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTx(tx);
              setIsTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onImportCSV={handleImportCSV}
            onOpenQuickAdd={() => setIsQuickAddModalOpen(true)}
            onOpenReceiptScanner={() => setIsReceiptModalOpen(true)}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsView
            budgets={budgets}
            transactions={transactions}
            currency={currentCurrency}
            onUpdateBudget={handleUpdateBudget}
            onApplyOptimizedBudgets={handleApplyOptimizedBudgets}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            currency={currentCurrency}
            onAddGoal={handleAddGoal}
            onContributeGoal={handleContributeGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'ai-advisor' && (
          <AIAdvisorView
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            auditReport={auditReport}
            setAuditReport={setAuditReport}
            currency={currentCurrency}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-bottom-2 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTx}
        currency={currentCurrency}
        currencySymbol={CURRENCY_SYMBOLS[currentCurrency] || '$'}
      />

      <ReceiptScannerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onAddTransaction={(tx) => handleSaveTransaction(tx)}
      />

      <QuickAddModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onAddTransaction={(tx) => handleSaveTransaction(tx)}
      />

      {/* Auth / Switch Account Modal */}
      {isAuthModalOpen && (
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          onExploreGuest={() => {
            handleLoginSuccess({
              ...DEMO_USER,
              currency: currentCurrency,
              currencySymbol: CURRENCY_SYMBOLS[currentCurrency],
            });
            setIsAuthModalOpen(false);
          }}
          onClose={() => setIsAuthModalOpen(false)}
          initialCurrency={currentCurrency}
          onSelectCurrency={handleUpdateCurrency}
        />
      )}
    </div>
  );
}
