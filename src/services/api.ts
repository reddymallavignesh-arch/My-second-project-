import {
  Transaction,
  CategoryBudget,
  SavingsGoal,
  FinancialAuditReport,
  ParsedReceipt,
} from '../types/finance';
import { UserProfile } from '../types/auth';

export async function requestFinancialAudit(params: {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
}): Promise<FinancialAuditReport> {
  const res = await fetch('/api/ai/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate financial audit');
  }

  return res.json();
}

export async function sendAIChatMessage(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  financialContext: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    budgets: CategoryBudget[];
    goals: SavingsGoal[];
    recentTransactions: Transaction[];
  };
}): Promise<{ reply: string; suggestions?: string[] }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to chat with AI');
  }

  return res.json();
}

export async function scanReceiptWithAI(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ParsedReceipt> {
  const res = await fetch('/api/ai/scan-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to scan receipt image');
  }

  return res.json();
}

export async function parseNaturalLanguageTransaction(
  text: string
): Promise<Partial<Transaction>> {
  const res = await fetch('/api/ai/parse-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to parse natural language transaction');
  }

  return res.json();
}

export async function optimizeBudgetWithAI(params: {
  monthlyIncome: number;
  currentBudgets: CategoryBudget[];
  expenses: Transaction[];
}): Promise<{
  suggestedBudgets: Array<{ category: string; monthlyLimit: number; rational: string }>;
  targetSavingsRate: number;
  monthlySavingsTarget: number;
}> {
  const res = await fetch('/api/ai/optimize-budget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to optimize budget');
  }

  return res.json();
}

// -------------------------------------------------------------
// Multi-User & Persistent Account API Methods
// -------------------------------------------------------------

export interface SeedUserMeta {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  currency: UserProfile['currency'];
  currencySymbol: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  avatar: string;
  monthlyIncome: number;
  txCount: number;
  budgetsCount: number;
  goalsCount: number;
}

export async function fetchUsersDirectory(): Promise<SeedUserMeta[]> {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch user directory');
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.warn('Falling back to empty user directory:', err);
    return [];
  }
}

export async function loginUserWithBackend(params: {
  email?: string;
  password?: string;
  userId?: string;
}): Promise<{
  user: UserProfile;
  data: {
    transactions: Transaction[];
    budgets: CategoryBudget[];
    goals: SavingsGoal[];
  };
}> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Authentication failed');
  }

  return res.json();
}

export async function registerUserWithBackend(params: {
  name: string;
  email: string;
  password?: string;
  currency?: UserProfile['currency'];
  role?: string;
  department?: string;
  plan?: 'Free' | 'Pro' | 'Enterprise';
  monthlyIncome?: number;
}): Promise<{
  user: UserProfile;
  data: {
    transactions: Transaction[];
    budgets: CategoryBudget[];
    goals: SavingsGoal[];
  };
}> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }

  return res.json();
}

export async function fetchUserDataFromBackend(userId: string): Promise<{
  user: UserProfile;
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
}> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}/data`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch user financial dataset');
  }
  return res.json();
}

export async function saveUserDataToBackend(
  userId: string,
  data: {
    transactions?: Transaction[];
    budgets?: CategoryBudget[];
    goals?: SavingsGoal[];
  }
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}/data`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to sync user data');
  }
  return res.json();
}

export async function updateBackendUserCurrency(
  userId: string,
  currency: UserProfile['currency']
): Promise<{ success: boolean; user: UserProfile }> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}/currency`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update currency on server');
  }
  return res.json();
}

export async function resetServerDatabase(): Promise<{ success: boolean; count: number }> {
  const res = await fetch('/api/users/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset system database');
  return res.json();
}
