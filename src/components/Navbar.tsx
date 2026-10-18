import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Target,
  Bot,
  Plus,
  Camera,
  RotateCcw,
  Wallet,
  LogOut,
  LogIn,
  Shield,
  ChevronDown,
  Globe,
  Check,
  User,
} from 'lucide-react';
import { UserProfile, CURRENCY_SYMBOLS } from '../types/auth';
import { formatCurrency, CURRENCY_NAMES } from '../utils/currency';

interface NavbarProps {
  activeTab: 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'ai-advisor';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'ai-advisor') => void;
  onOpenQuickAdd: () => void;
  onOpenReceiptScanner: () => void;
  onResetData: () => void;
  netWorth: number;
  user: UserProfile | null;
  currentCurrency: UserProfile['currency'];
  onLogout: () => void;
  onOpenLogin: () => void;
  onUpdateCurrency: (currency: UserProfile['currency']) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  onOpenReceiptScanner,
  onResetData,
  netWorth,
  user,
  currentCurrency,
  onLogout,
  onOpenLogin,
  onUpdateCurrency,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isMobileCurrencyOpen, setIsMobileCurrencyOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const mobileCurrencyRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(target)) {
        setIsCurrencyDropdownOpen(false);
      }
      if (mobileCurrencyRef.current && !mobileCurrencyRef.current.contains(target)) {
        setIsMobileCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs: Array<{
    id: 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'ai-advisor';
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    isAi?: boolean;
  }> = [
    { id: 'dashboard', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', shortLabel: 'Txs', icon: Receipt },
    { id: 'budgets', label: 'Budgets', shortLabel: 'Budgets', icon: PiggyBank },
    { id: 'goals', label: 'Goals', shortLabel: 'Goals', icon: Target },
    { id: 'ai-advisor', label: 'SpendWise AI', shortLabel: 'AI Advisor', icon: Bot, isAi: true },
  ];

  const currencies: Array<UserProfile['currency']> = ['USD', 'EUR', 'GBP', 'CAD', 'INR', 'JPY'];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 max-w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6">
        {/* ROW 1: TOP BAR (Brand + Desktop Nav + Actions or Mobile Top Controls) */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-slate-950 font-black shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  SpendWise<span className="text-emerald-400 font-black">.ai</span>
                </span>
                <span className="hidden xl:inline text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Gemini
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">50+ Multi-User Wealth Engine</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Visible on large screens) */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-800/70 p-1 rounded-xl border border-slate-700/60 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? tab.isAi
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold shadow-sm'
                        : 'bg-slate-700 text-white shadow-sm'
                      : tab.isAi
                      ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.isAi && !isActive ? 'text-emerald-400' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* DESKTOP Action Bar (Visible on lg+) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Net Flow Indicator */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Net:</span>
              <span className={`font-semibold ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netWorth >= 0 ? '+' : ''}
                {formatCurrency(Math.abs(netWorth), currentCurrency)}
              </span>
            </div>

            {/* Quick Add Button */}
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition shrink-0"
              title="Quick Add Transaction"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add</span>
            </button>

            {/* Receipt Scan Button */}
            <button
              onClick={onOpenReceiptScanner}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition shrink-0"
              title="Scan Receipt with Gemini Vision"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan</span>
            </button>

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition shrink-0"
              title="Reset to fresh demo data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Currency Selector (Desktop) */}
            <div className="relative shrink-0" ref={currencyRef}>
              <button
                type="button"
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 text-xs font-semibold text-white transition shadow-sm"
                title={`Selected Currency: ${currentCurrency} (${CURRENCY_SYMBOLS[currentCurrency]})`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-emerald-300 font-bold">
                  {currentCurrency} ({CURRENCY_SYMBOLS[currentCurrency]})
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
              </button>

              {/* Currency Dropdown */}
              {isCurrencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    Select Currency
                  </div>
                  <div className="space-y-0.5">
                    {currencies.map((curr) => {
                      const isSelected = currentCurrency === curr;
                      return (
                        <button
                          key={curr}
                          onClick={() => {
                            onUpdateCurrency(curr);
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition text-left ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400 w-5">
                              {CURRENCY_SYMBOLS[curr]}
                            </span>
                            <span>{CURRENCY_NAMES[curr]}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Login / Account Command Button */}
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition shadow-sm shrink-0"
              title="Open 50 People Directory / Switch Account"
            >
              <LogIn className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{user ? 'Switch Account' : 'Login'}</span>
            </button>

            {/* Desktop Profile Avatar */}
            {user && (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
                  title={`${user.name} (${user.plan})`}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/50"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.name}</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {user.plan}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    </div>

                    <div className="py-1 space-y-0.5 text-xs text-slate-300">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-400">
                        <span className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Currency</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-300">
                          {currentCurrency} ({CURRENCY_SYMBOLS[currentCurrency]})
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-800 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenLogin();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>50 Users Directory / Switch</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MOBILE TOP CONTROLS: Prominently displays LOGIN and active account */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            {/* Prominent Mobile Login Button - Always Visible, Never Pushed Off */}
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition shadow-sm active:scale-95"
              title="Open Login Screen / 50 Team Accounts"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{user ? user.name.split(' ')[0] : 'Login'}</span>
            </button>

            {/* Mobile User Profile Avatar (if logged in) */}
            {user && (
              <div className="relative shrink-0" ref={mobileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 rounded-lg object-cover ring-1 ring-emerald-500/50"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </button>

                {/* Mobile Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-800">
                      <div className="text-xs font-bold text-white truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    </div>
                    <div className="py-1 border-b border-slate-800">
                      <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-300">
                        <span>Currency</span>
                        <span className="font-mono font-bold text-emerald-300">
                          {currentCurrency} ({CURRENCY_SYMBOLS[currentCurrency]})
                        </span>
                      </div>
                    </div>
                    <div className="pt-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenLogin();
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition text-left"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Switch Account / 50 Users</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: MOBILE ACTION GRID (4-Column Grid for Tools & Currency) */}
        <div className="lg:hidden pb-2 pt-1 border-t border-slate-800/80">
          <div className="grid grid-cols-4 gap-1.5">
            {/* Action 1: Quick Add */}
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
              title="Quick Add Transaction"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Add</span>
            </button>

            {/* Action 2: Scan Receipt */}
            <button
              onClick={onOpenReceiptScanner}
              className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
              title="Scan Receipt with Gemini"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>Scan</span>
            </button>

            {/* Action 3: Currency Switcher Grid Cell */}
            <div className="relative w-full" ref={mobileCurrencyRef}>
              <button
                type="button"
                onClick={() => setIsMobileCurrencyOpen(!isMobileCurrencyOpen)}
                className="w-full flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 text-slate-200 text-xs font-semibold transition"
                title={`Currency: ${currentCurrency}`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-emerald-300 font-bold truncate">
                  {currentCurrency} {CURRENCY_SYMBOLS[currentCurrency]}
                </span>
              </button>

              {/* Mobile Currency Dropdown */}
              {isMobileCurrencyOpen && (
                <div className="fixed inset-x-2 top-28 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-1 sm:w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    <span>Select Workspace Currency</span>
                    <span className="text-emerald-400 font-mono">{currentCurrency}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {currencies.map((curr) => {
                      const isSelected = currentCurrency === curr;
                      return (
                        <button
                          key={curr}
                          onClick={() => {
                            onUpdateCurrency(curr);
                            setIsMobileCurrencyOpen(false);
                          }}
                          className={`flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition text-left ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                              : 'text-slate-300 hover:text-white bg-slate-800/70 border border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-400">
                              {CURRENCY_SYMBOLS[curr]}
                            </span>
                            <span>{curr}</span>
                          </div>
                          {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action 4: Reset Demo Data */}
            <button
              onClick={onResetData}
              className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
              title="Reset Sample Data"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ROW 3: MOBILE NAVIGATION GRID (6-Column Grid: Overview, Txs, Budgets, Goals, AI, Login/Account) */}
        <div className="lg:hidden border-t border-slate-800/90 py-1.5">
          <nav className="grid grid-cols-6 gap-0.5 text-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-lg transition ${
                    isActive
                      ? tab.isAi
                        ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-white font-bold bg-slate-800 border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive && tab.isAi ? 'text-emerald-400' : ''}`} />
                  <span className="text-[10px] leading-tight font-medium truncate w-full">
                    {tab.shortLabel}
                  </span>
                </button>
              );
            })}

            {/* 6th Item in Mobile Grid: Login / Account Switcher */}
            <button
              onClick={onOpenLogin}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition active:scale-95"
              title="Login / Switch to any of 50 accounts"
            >
              {user ? (
                <User className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="text-[10px] leading-tight font-bold text-emerald-300 truncate w-full">
                {user ? 'Account' : 'Login'}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
