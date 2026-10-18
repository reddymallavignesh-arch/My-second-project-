import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types/finance';
import { UserProfile } from '../types/auth';
import { formatCurrency } from '../utils/currency';
import { CATEGORY_COLORS } from '../data/initialData';

interface TransactionsViewProps {
  transactions: Transaction[];
  currency?: UserProfile['currency'];
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportCSV: (transactions: Transaction[]) => void;
  onOpenQuickAdd: () => void;
  onOpenReceiptScanner: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  currency = 'USD',
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onImportCSV,
  onOpenQuickAdd,
  onOpenReceiptScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'this-month' | 'last-30'>('this-month');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Extract all categories present
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    return transactions
      .filter((t) => {
        // Type filter
        if (selectedType !== 'all' && t.type !== selectedType) return false;

        // Category filter
        if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

        // Date filter
        if (dateRange === 'this-month' && !t.date.startsWith(currentMonthStr)) return false;
        if (dateRange === 'last-30' && t.date < thirtyDaysAgoStr) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchMerchant = t.merchant.toLowerCase().includes(q);
          const matchCategory = t.category.toLowerCase().includes(q);
          const matchNotes = t.notes?.toLowerCase().includes(q) || false;
          const matchPayment = t.paymentMethod.toLowerCase().includes(q);
          if (!matchMerchant && !matchCategory && !matchNotes && !matchPayment) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, selectedType, selectedCategory, dateRange, searchQuery, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Amount', 'Merchant', 'Category', 'Date', 'Payment Method', 'Notes', 'Recurring'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.type,
      t.amount.toFixed(2),
      `"${t.merchant.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.date,
      `"${t.paymentMethod}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.isRecurring ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `spendwise_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredTransactions.length} transactions as CSV`);
  };

  // Import CSV
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert('CSV file is empty or missing headers.');
          return;
        }

        const newTxs: Transaction[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 5) {
            const amount = parseFloat(cols[2]) || 0;
            if (amount > 0) {
              newTxs.push({
                id: `import-${Date.now()}-${i}`,
                type: (cols[1]?.toLowerCase() === 'income' ? 'income' : 'expense') as TransactionType,
                amount: amount,
                merchant: cols[3] || 'Imported Transaction',
                category: (cols[4] as any) || 'Miscellaneous',
                date: cols[5] || new Date().toISOString().split('T')[0],
                paymentMethod: (cols[6] as any) || 'Credit Card',
                notes: cols[7] || 'Imported from CSV',
                isRecurring: cols[8]?.toLowerCase() === 'yes',
              });
            }
          }
        }

        if (newTxs.length > 0) {
          onImportCSV(newTxs);
          showToast(`Successfully imported ${newTxs.length} transactions!`);
        } else {
          alert('Could not parse any valid transactions from CSV.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            View, search, edit, and organize all your financial inflows and outflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick AI Add */}
          <button
            onClick={onOpenQuickAdd}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Quick Add</span>
          </button>

          {/* Receipt Scanner */}
          <button
            onClick={onOpenReceiptScanner}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>Scan Receipt</span>
          </button>

          {/* Standard Add */}
          <button
            onClick={onAddTransaction}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Chips of Active Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400">Records Found</div>
          <div className="text-lg font-bold text-white mt-0.5">{filteredTransactions.length}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400">Filtered Outflow</div>
          <div className="text-lg font-bold text-rose-400 mt-0.5">
            {formatCurrency(totalFilteredExpense, currency)}
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400">Filtered Inflow</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">
            {formatCurrency(totalFilteredIncome, currency)}
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400">Net Balance</div>
          <div
            className={`text-lg font-bold mt-0.5 ${
              totalFilteredIncome - totalFilteredExpense >= 0 ? 'text-teal-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(totalFilteredIncome - totalFilteredExpense, currency)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by merchant, category, notes, or payment method..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
            />
          </div>

          {/* Type Toggle */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-700/80 shrink-0">
            {(['all', 'expense', 'income'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                  selectedType === type
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/80"
          >
            <option value="all">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Date Range Dropdown */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/80"
          >
            <option value="this-month">This Month</option>
            <option value="last-30">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/80"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>

        {/* CSV Tools */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          </div>

          <div>
            Showing <span className="text-white font-semibold">{filteredTransactions.length}</span> of{' '}
            <span className="text-white font-semibold">{transactions.length}</span> entries
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No transactions found</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your filter, search keyword, or log a new transaction.
            </p>
            <button
              onClick={onAddTransaction}
              className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              + Add Transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredTransactions.map((t) => {
              const isIncome = t.type === 'income';
              const color = CATEGORY_COLORS[t.category] || '#64748b';

              return (
                <div
                  key={t.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-850/50 transition group"
                >
                  {/* Left: icon & details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isIncome ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white truncate">{t.merchant}</span>
                        {t.isRecurring && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                            Recurring
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          {t.category}
                        </span>
                        <span>•</span>
                        <span>{t.date}</span>
                        <span>•</span>
                        <span className="text-slate-400">{t.paymentMethod}</span>
                      </div>

                      {t.notes && (
                        <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-1">{t.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: amount & quick actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-bold ${
                          isIncome ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(t.amount, currency)}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEditTransaction(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
