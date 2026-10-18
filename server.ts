import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ALL_50_USER_FINANCES, SEED_50_USERS_META, UserFinanceData } from './src/data/seedUsers';
import { CURRENCY_SYMBOLS, UserProfile } from './src/types/auth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Persistent multi-user database storage
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'users_db.json');

let usersDb: Record<string, UserFinanceData> = {};

function initDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      usersDb = JSON.parse(raw);
      console.log(`[Database] Loaded ${Object.keys(usersDb).length} registered users from disk.`);
    } else {
      usersDb = { ...ALL_50_USER_FINANCES };
      fs.writeFileSync(DB_FILE, JSON.stringify(usersDb, null, 2), 'utf-8');
      console.log(`[Database] Initialized new persistent store with ${Object.keys(usersDb).length} pre-configured seed users.`);
    }
  } catch (err) {
    console.error('[Database] Initialization error, falling back to seed users in memory:', err);
    usersDb = { ...ALL_50_USER_FINANCES };
  }
}

initDatabase();

function persistDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(usersDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Failed to write data to disk:', err);
  }
}

// Body parsing with support for image base64 receipt scans
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize Google Gemini SDK on the server with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Ensure Gemini API key is configured
function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
}

// -------------------------------------------------------------
// Endpoint 1: Comprehensive Financial Audit (POST /api/ai/audit)
// -------------------------------------------------------------
app.post('/api/ai/audit', async (req: Request, res: Response) => {
  try {
    const { transactions = [], budgets = [], goals = [] } = req.body;

    if (!hasGeminiKey()) {
      return res.status(200).json({
        overallHealthScore: 84,
        scoreGrade: 'B+',
        statusSummary: 'Strong cash flow with 28% savings rate. Recommended tweaking food and subscription leakages to unlock an extra $210/month.',
        rule503020: {
          needs: { amount: 1970, percentage: 51, targetPercentage: 50 },
          wants: { amount: 820, percentage: 21, targetPercentage: 30 },
          savings: { amount: 1060, percentage: 28, targetPercentage: 20 },
          analysis: 'Your core needs (housing + utilities) are comfortably at 51%, and your savings rate (28%) is exceeding the 20% benchmark.',
        },
        topLeakages: [
          {
            title: 'Multiple Overlapping Video & AI Subscriptions',
            category: 'Subscriptions',
            estimatedMonthlySaving: 55,
            description: 'You have 3 recurring subscriptions totaling ~$55/mo. Consolidating or pausing unused tiers saves ~$660/yr.',
            urgency: 'medium',
          },
          {
            title: 'Frequent Mid-Day Coffee & Quick Dining Orders',
            category: 'Food & Dining',
            estimatedMonthlySaving: 120,
            description: 'Mid-week casual lunch and cafe stops average $28/visit across 8 visits this month.',
            urgency: 'high',
          },
        ],
        actionableTips: [
          {
            title: 'Automate 20% Split on Payday',
            impact: 'high',
            advice: 'Route $970 directly to your High-Yield Emergency Vault on direct deposit morning to prevent discretionary lifestyle creep.',
          },
          {
            title: 'Lock In Groceries Meal Prep Cap',
            impact: 'medium',
            advice: 'Pre-order grocery baskets once weekly to eliminate $40-60 impromptu midweek trips.',
          },
        ],
        runwayMonths: 5.8,
        projectedAnnualSavings: 12720,
        topCategories: [
          { category: 'Housing & Rent', amount: 1650, percentage: 59 },
          { category: 'Food & Dining', amount: 206, percentage: 7.4 },
          { category: 'Groceries', amount: 201, percentage: 7.2 },
          { category: 'Utilities & Bills', amount: 195, percentage: 7.0 },
        ],
      });
    }

    const txSummary = transactions.slice(0, 35).map((t: any) => ({
      type: t.type,
      amount: t.amount,
      merchant: t.merchant,
      category: t.category,
      date: t.date,
    }));

    const prompt = `You are a certified senior financial advisor specializing in personal budgeting, cash flow optimization, and wealth building.
Analyze the following personal finance data for this user:
Transactions: ${JSON.stringify(txSummary)}
Category Budgets: ${JSON.stringify(budgets)}
Savings Goals: ${JSON.stringify(goals)}

Generate a rigorous, realistic, and motivating financial audit report.
Return valid JSON matching this schema:
{
  "overallHealthScore": number (0 to 100),
  "scoreGrade": string (e.g. "A+", "A", "B+", "B", "C", "D"),
  "statusSummary": string (1-2 sharp sentences with specific takeaway),
  "rule503020": {
    "needs": { "amount": number, "percentage": number, "targetPercentage": 50 },
    "wants": { "amount": number, "percentage": number, "targetPercentage": 30 },
    "savings": { "amount": number, "percentage": number, "targetPercentage": 20 },
    "analysis": string (explanation of needs vs wants vs savings allocation)
  },
  "topLeakages": [
    {
      "title": string,
      "category": string,
      "estimatedMonthlySaving": number,
      "description": string,
      "urgency": "high" | "medium" | "low"
    }
  ],
  "actionableTips": [
    {
      "title": string,
      "impact": "high" | "medium" | "low",
      "advice": string
    }
  ],
  "runwayMonths": number,
  "projectedAnnualSavings": number,
  "topCategories": [
    { "category": string, "amount": number, "percentage": number }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Audit Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate financial audit.' });
  }
});

// -------------------------------------------------------------
// Endpoint 2: Financial Copilot Chat (POST /api/ai/chat)
// -------------------------------------------------------------
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages = [], financialContext = {} } = req.body;

    if (!hasGeminiKey()) {
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      return res.json({
        reply: `Here's my financial breakdown for your query regarding "${lastUserMsg}": Based on your current monthly cash flow, your income exceeds expenses by roughly $1,800/month (a 32% savings rate). Your highest discretionary spending is Food & Dining ($206) and Shopping ($157). If you allocate $300 more to your emergency vault, you'll hit your 6-month safety net 2 months ahead of schedule! Let me know if you want to optimize any specific category limit.`,
        suggestions: [
          'Can I afford a $1,200 travel expense next month?',
          'How can I cut $200 from my grocery and dining bills?',
          'What is my recommended 50/30/20 budget breakdown?',
        ],
      });
    }

    const systemInstruction = `You are "SpendWise AI", an empathetic, razor-sharp certified financial planner and expense advisor.
You have access to the user's active financial context:
- Monthly Income: $${financialContext.totalIncome || 0}
- Monthly Expenses: $${financialContext.totalExpense || 0}
- Net Monthly Savings: $${financialContext.netSavings || 0}
- Active Budgets: ${JSON.stringify(financialContext.budgets || [])}
- Active Goals: ${JSON.stringify(financialContext.goals || [])}
- Recent Transactions Sample: ${JSON.stringify((financialContext.recentTransactions || []).slice(0, 15))}

Provide clear, encouraging, mathematically accurate financial guidance.
Keep responses concise, formatted with clean bullet points or numbers when helpful.
Do not invent fictitious bank balances unless referenced in context.
Return JSON with this structure:
{
  "reply": string (markdown text response),
  "suggestions": string[] (2-3 contextual next follow-up questions the user can tap)
}`;

    // Format conversation history for Gemini
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Chat Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process chat message.' });
  }
});

// -------------------------------------------------------------
// Endpoint 3: Multimodal Receipt Scanning (POST /api/ai/scan-receipt)
// -------------------------------------------------------------
app.post('/api/ai/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    if (!hasGeminiKey()) {
      // Mock fallback if user has not entered key yet
      return res.json({
        merchant: 'Trader Joe’s Market',
        amount: 54.35,
        date: new Date().toISOString().split('T')[0],
        category: 'Groceries',
        paymentMethod: 'Credit Card',
        tax: 3.25,
        lineItems: [
          { name: 'Organic Honeycrisp Apples', price: 4.99, quantity: 1 },
          { name: 'Almond Milk Unsweetened', price: 3.49, quantity: 1 },
          { name: 'Cold Brew Coffee Concentrate', price: 7.99, quantity: 1 },
          { name: 'Atlantic Salmon Fillets', price: 12.99, quantity: 1 },
          { name: 'Dark Chocolate Almonds', price: 5.49, quantity: 1 },
        ],
        notes: 'AI scanned receipt from Trader Joe’s',
      });
    }

    // Clean up base64 prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Analyze this receipt image. Extract all financial details accurately:
- Merchant/Store name
- Total amount paid (number, e.g. 42.50)
- Date of transaction (YYYY-MM-DD format; if not clearly visible, use today's date ${new Date().toISOString().split('T')[0]})
- Suggested category from: [Food & Dining, Groceries, Housing & Rent, Utilities & Bills, Transportation, Entertainment, Shopping & Retail, Health & Wellness, Subscriptions, Personal Care, Travel & Vacation, Education, Miscellaneous]
- Likely payment method from: [Credit Card, Debit Card, Cash, Bank Transfer, Apple Pay / Google Pay, Other]
- Tax amount (if listed)
- Individual line items with item name, price, and quantity (if itemized)
- Brief notes summarizing the purchase

Return strictly a valid JSON object matching:
{
  "merchant": string,
  "amount": number,
  "date": string,
  "category": string,
  "paymentMethod": string,
  "tax": number,
  "lineItems": [
    { "name": string, "price": number, "quantity": number }
  ],
  "notes": string
}`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Scan Receipt Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to parse receipt image.' });
  }
});

// -------------------------------------------------------------
// Endpoint 4: Natural Language Transaction Parser (POST /api/ai/parse-transaction)
// -------------------------------------------------------------
app.post('/api/ai/parse-transaction', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (!hasGeminiKey()) {
      // Regex / rule fallback
      const amountMatch = text.match(/\$?(\d+(?:\.\d{1,2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 25.0;
      const isIncome = /salary|payroll|deposit|earned|freelance|bonus|received/i.test(text);

      return res.json({
        type: isIncome ? 'income' : 'expense',
        amount: amount,
        merchant: text.slice(0, 30).trim() || 'Quick Expense',
        category: isIncome ? 'Salary & Wages' : 'Food & Dining',
        date: todayStr,
        paymentMethod: 'Credit Card',
        notes: text,
      });
    }

    const prompt = `Parse this natural language transaction entry into a structured financial transaction:
"${text}"

Context:
- Today's date is: ${todayStr}
- Valid types: "expense" or "income"
- Valid Expense Categories: ["Food & Dining", "Groceries", "Housing & Rent", "Utilities & Bills", "Transportation", "Entertainment", "Shopping & Retail", "Health & Wellness", "Subscriptions", "Personal Care", "Travel & Vacation", "Education", "Miscellaneous"]
- Valid Income Categories: ["Salary & Wages", "Freelance & Consulting", "Investments & Dividends", "Business", "Rental Income", "Gifts & Refunds", "Other Income"]
- Valid Payment Methods: ["Credit Card", "Debit Card", "Cash", "Bank Transfer", "Apple Pay / Google Pay", "Other"]

Return strictly valid JSON:
{
  "type": "expense" | "income",
  "amount": number,
  "merchant": string,
  "category": string,
  "date": "YYYY-MM-DD",
  "paymentMethod": string,
  "notes": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Parse Transaction Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to parse natural language transaction.' });
  }
});

// -------------------------------------------------------------
// Endpoint 5: AI Smart Budget Optimizer (POST /api/ai/optimize-budget)
// -------------------------------------------------------------
app.post('/api/ai/optimize-budget', async (req: Request, res: Response) => {
  try {
    const { monthlyIncome = 5000, currentBudgets = [], expenses = [] } = req.body;

    if (!hasGeminiKey()) {
      return res.json({
        suggestedBudgets: [
          { category: 'Housing & Rent', monthlyLimit: Math.round(monthlyIncome * 0.32), rational: 'Max 30-35% of net income for rent/housing' },
          { category: 'Groceries', monthlyLimit: Math.round(monthlyIncome * 0.09), rational: 'Essential nutritious home cooking balance' },
          { category: 'Food & Dining', monthlyLimit: Math.round(monthlyIncome * 0.06), rational: 'Controlled social meals & weekend dining' },
          { category: 'Utilities & Bills', monthlyLimit: Math.round(monthlyIncome * 0.05), rational: 'Average power, water & gigabit fiber' },
          { category: 'Transportation', monthlyLimit: Math.round(monthlyIncome * 0.05), rational: 'Fuel, transit pass, occasional rideshares' },
          { category: 'Shopping & Retail', monthlyLimit: Math.round(monthlyIncome * 0.05), rational: 'Discretionary apparel & lifestyle buffer' },
          { category: 'Health & Wellness', monthlyLimit: Math.round(monthlyIncome * 0.03), rational: 'Gym membership and health maintenance' },
          { category: 'Subscriptions', monthlyLimit: Math.round(monthlyIncome * 0.02), rational: 'Streamlined streaming & digital tools' },
          { category: 'Entertainment', monthlyLimit: Math.round(monthlyIncome * 0.03), rational: 'Cinema, concerts, and leisure' },
        ],
        targetSavingsRate: 30,
        monthlySavingsTarget: Math.round(monthlyIncome * 0.30),
      });
    }

    const prompt = `Based on a net monthly income of $${monthlyIncome} and recent expenses, provide an optimized budget following the 50/30/20 balanced framework.
Current budget config: ${JSON.stringify(currentBudgets)}
Expense history sample: ${JSON.stringify(expenses.slice(0, 20))}

Return strictly valid JSON:
{
  "suggestedBudgets": [
    {
      "category": string,
      "monthlyLimit": number,
      "rational": string
    }
  ],
  "targetSavingsRate": number,
  "monthlySavingsTarget": number
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Optimize Budget Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to optimize budget.' });
  }
});

// -------------------------------------------------------------
// Endpoint 5: Multi-User Directory (GET /api/users)
// -------------------------------------------------------------
app.get('/api/users', (_req: Request, res: Response) => {
  try {
    const list = Object.values(usersDb).map((entry) => ({
      id: entry.user.id,
      name: entry.user.name,
      email: entry.user.email,
      role: entry.user.role || 'Senior Professional',
      department: (entry.user as any).department || 'General',
      currency: entry.user.currency,
      currencySymbol: entry.user.currencySymbol,
      plan: entry.user.plan,
      avatar: entry.user.avatar,
      monthlyIncome: (entry.user as any).monthlyIncome || 5000,
      txCount: entry.transactions?.length || 0,
      budgetsCount: entry.budgets?.length || 0,
      goalsCount: entry.goals?.length || 0,
    }));
    return res.json({ users: list, total: list.length });
  } catch (error: any) {
    console.error('List Users Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list users' });
  }
});

// -------------------------------------------------------------
// Endpoint 6: Authenticate User (POST /api/auth/login)
// -------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password, userId } = req.body;
    let target: UserFinanceData | undefined;

    if (userId && usersDb[userId]) {
      target = usersDb[userId];
    } else if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      target = Object.values(usersDb).find(
        (u) => u.user.email.toLowerCase() === cleanEmail
      );
    }

    if (!target) {
      return res.status(404).json({
        error: 'Account not found. Select from the 50 team members directory or create a new account.',
      });
    }

    // Update last login
    if (target.user.security) {
      target.user.security.lastLogin = 'Just now';
    }

    return res.json({
      user: target.user,
      data: {
        transactions: target.transactions,
        budgets: target.budgets,
        goals: target.goals,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// -------------------------------------------------------------
// Endpoint 7: Register User (POST /api/auth/register)
// -------------------------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      currency = 'USD',
      role = 'Team Member',
      department = 'General',
      plan = 'Pro',
      monthlyIncome = 5000,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Full name and email are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = Object.values(usersDb).find((u) => u.user.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const newId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const curr = (currency in CURRENCY_SYMBOLS ? currency : 'USD') as UserProfile['currency'];

    const newUser: UserProfile = {
      id: newId,
      name: name.trim(),
      email: cleanEmail,
      role: role.trim(),
      plan: plan as any,
      currency: curr,
      currencySymbol: CURRENCY_SYMBOLS[curr],
      createdAt: new Date().toISOString().split('T')[0],
      security: {
        twoFactorEnabled: false,
        passkeyRegistered: false,
        lastLogin: 'Just now',
      },
    };

    const newUserData: UserFinanceData = {
      user: newUser,
      password: password || 'password123',
      transactions: [
        {
          id: `tx-${newId}-1`,
          type: 'income',
          amount: Number(monthlyIncome) || 5000,
          merchant: 'Direct Deposit / Monthly Salary',
          category: 'Salary & Wages',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer',
          notes: 'Initial monthly payroll deposit',
        },
        {
          id: `tx-${newId}-2`,
          type: 'expense',
          amount: Math.round((Number(monthlyIncome) || 5000) * 0.28),
          merchant: 'City View Residential Apartments',
          category: 'Housing & Rent',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer',
          notes: 'Primary monthly lease payment',
        },
        {
          id: `tx-${newId}-3`,
          type: 'expense',
          amount: 95,
          merchant: 'Organic Market & Groceries',
          category: 'Groceries',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Credit Card',
          notes: 'Weekly nutrition and kitchen provisions',
        },
      ],
      budgets: [
        { category: 'Housing & Rent', monthlyLimit: Math.round((Number(monthlyIncome) || 5000) * 0.3), spent: Math.round((Number(monthlyIncome) || 5000) * 0.28), color: '#3b82f6' },
        { category: 'Groceries', monthlyLimit: 550, spent: 95, color: '#10b981' },
        { category: 'Food & Dining', monthlyLimit: 400, spent: 0, color: '#f59e0b' },
        { category: 'Transportation', monthlyLimit: 250, spent: 0, color: '#6366f1' },
        { category: 'Utilities & Bills', monthlyLimit: 220, spent: 0, color: '#06b6d4' },
        { category: 'Subscriptions', monthlyLimit: 75, spent: 0, color: '#ec4899' },
      ],
      goals: [
        {
          id: `goal-${newId}-1`,
          title: 'Emergency Reserve Fund (6 Months)',
          targetAmount: Math.round((Number(monthlyIncome) || 5000) * 3),
          currentAmount: Math.round((Number(monthlyIncome) || 5000) * 0.8),
          targetDate: '2026-12-31',
          category: 'Emergency',
          color: '#3b82f6',
          isAutomated: true,
          monthlyContribution: Math.round((Number(monthlyIncome) || 5000) * 0.1),
        },
      ],
    };

    usersDb[newId] = newUserData;
    persistDb();

    return res.status(201).json({
      user: newUser,
      data: {
        transactions: newUserData.transactions,
        budgets: newUserData.budgets,
        goals: newUserData.goals,
      },
    });
  } catch (error: any) {
    console.error('Register Error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// -------------------------------------------------------------
// Endpoint 8: Get User Specific Data (GET /api/users/:userId/data)
// -------------------------------------------------------------
app.get('/api/users/:userId/data', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const target = usersDb[userId];
    if (!target) {
      return res.status(404).json({ error: 'User data not found.' });
    }
    return res.json({
      user: target.user,
      transactions: target.transactions,
      budgets: target.budgets,
      goals: target.goals,
    });
  } catch (error: any) {
    console.error('Get User Data Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch user data' });
  }
});

// -------------------------------------------------------------
// Endpoint 9: Save User Specific Data (PUT /api/users/:userId/data)
// -------------------------------------------------------------
app.put('/api/users/:userId/data', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const target = usersDb[userId];
    if (!target) {
      return res.status(404).json({ error: 'User not found in system.' });
    }

    const { transactions, budgets, goals } = req.body;
    if (Array.isArray(transactions)) {
      target.transactions = transactions;
    }
    if (Array.isArray(budgets)) {
      target.budgets = budgets;
    }
    if (Array.isArray(goals)) {
      target.goals = goals;
    }

    persistDb();
    return res.json({
      success: true,
      transactionsCount: target.transactions.length,
      budgetsCount: target.budgets.length,
      goalsCount: target.goals.length,
    });
  } catch (error: any) {
    console.error('Save User Data Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save user data' });
  }
});

// -------------------------------------------------------------
// Endpoint 10: Update User Currency (PATCH /api/users/:userId/currency)
// -------------------------------------------------------------
app.patch('/api/users/:userId/currency', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { currency } = req.body;
    const target = usersDb[userId];
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (!currency || !(currency in CURRENCY_SYMBOLS)) {
      return res.status(400).json({ error: 'Invalid currency specified.' });
    }

    target.user.currency = currency as UserProfile['currency'];
    target.user.currencySymbol = CURRENCY_SYMBOLS[currency as UserProfile['currency']];
    persistDb();

    return res.json({ success: true, user: target.user });
  } catch (error: any) {
    console.error('Update Currency Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update currency' });
  }
});

// -------------------------------------------------------------
// Endpoint 11: Reset All Users to Seed Defaults (POST /api/users/reset)
// -------------------------------------------------------------
app.post('/api/users/reset', (_req: Request, res: Response) => {
  try {
    usersDb = { ...ALL_50_USER_FINANCES };
    persistDb();
    return res.json({ success: true, count: Object.keys(usersDb).length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to reset database' });
  }
});

// -------------------------------------------------------------
// Vite Middleware setup for full-stack SPA
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SpendWise AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
