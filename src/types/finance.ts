export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Housing & Rent'
  | 'Utilities & Bills'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping & Retail'
  | 'Health & Wellness'
  | 'Subscriptions'
  | 'Personal Care'
  | 'Travel & Vacation'
  | 'Education'
  | 'Miscellaneous';

export type IncomeCategory =
  | 'Salary & Wages'
  | 'Freelance & Consulting'
  | 'Investments & Dividends'
  | 'Business'
  | 'Rental Income'
  | 'Gifts & Refunds'
  | 'Other Income';

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'Cash'
  | 'Bank Transfer'
  | 'Apple Pay / Google Pay'
  | 'Other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  merchant: string;
  category: TransactionCategory;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  receiptUrl?: string;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  monthlyLimit: number;
  spent: number;
  color: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
  color: string;
  notes?: string;
  isCompleted?: boolean;
  isAutomated?: boolean;
  monthlyContribution?: number;
}

export interface Rule503020 {
  needs: { amount: number; percentage: number; targetPercentage: number };
  wants: { amount: number; percentage: number; targetPercentage: number };
  savings: { amount: number; percentage: number; targetPercentage: number };
  analysis: string;
}

export interface SpendingLeakage {
  title: string;
  category: string;
  estimatedMonthlySaving: number;
  description: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface ActionableTip {
  title: string;
  impact: 'high' | 'medium' | 'low';
  advice: string;
}

export interface FinancialAuditReport {
  overallHealthScore: number; // 0 - 100
  scoreGrade: string; // A+, A, B, C, etc.
  statusSummary: string;
  rule503020: Rule503020;
  topLeakages: SpendingLeakage[];
  actionableTips: ActionableTip[];
  runwayMonths: number;
  projectedAnnualSavings: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  generatedAt?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export interface ParsedReceipt {
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  tax?: number;
  lineItems?: Array<{ name: string; price: number; quantity?: number }>;
  notes?: string;
}
