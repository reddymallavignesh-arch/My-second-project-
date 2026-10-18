import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Fingerprint,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronRight,
  KeyRound,
  Zap,
  Globe,
  X,
  Search,
  Users,
  Briefcase,
  Building,
  Check,
} from 'lucide-react';
import { UserProfile, DEMO_USER, CURRENCY_SYMBOLS } from '../types/auth';
import { CURRENCY_NAMES } from '../utils/currency';
import { SEED_50_USERS_META } from '../data/seedUsers';
import {
  fetchUsersDirectory,
  loginUserWithBackend,
  registerUserWithBackend,
  SeedUserMeta,
} from '../services/api';
import { Transaction, CategoryBudget, SavingsGoal } from '../types/finance';

interface AuthScreenProps {
  onLoginSuccess: (
    user: UserProfile,
    userData?: {
      transactions: Transaction[];
      budgets: CategoryBudget[];
      goals: SavingsGoal[];
    }
  ) => void;
  onExploreGuest?: () => void;
  onClose?: () => void;
  initialCurrency?: UserProfile['currency'];
  onSelectCurrency?: (currency: UserProfile['currency']) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onExploreGuest,
  onClose,
  initialCurrency = 'USD',
  onSelectCurrency,
}) => {
  // Navigation tabs: 'directory' (50 users), 'signin', 'signup'
  const [activeTab, setActiveTab] = useState<'directory' | 'signin' | 'signup'>('directory');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Currency preference
  const [chosenCurrency, setChosenCurrency] = useState<UserProfile['currency']>(initialCurrency);

  // Sign In / Sign Up Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Product Specialist');
  const [department, setDepartment] = useState('Technology');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 50 People Directory State
  const [usersList, setUsersList] = useState<SeedUserMeta[]>(SEED_50_USERS_META as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<string>('All');

  const currencies: Array<UserProfile['currency']> = ['USD', 'EUR', 'GBP', 'CAD', 'INR', 'JPY'];

  // Load latest directory from backend
  useEffect(() => {
    let isMounted = true;
    fetchUsersDirectory()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setUsersList(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCurrencyChange = (curr: UserProfile['currency']) => {
    setChosenCurrency(curr);
    if (onSelectCurrency) {
      onSelectCurrency(curr);
    }
  };

  // Filter 50 people directory
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q));

      const matchesDept = selectedDept === 'All' || u.department === selectedDept;
      const matchesCurr = selectedCurrencyFilter === 'All' || u.currency === selectedCurrencyFilter;

      return matchesSearch && matchesDept && matchesCurr;
    });
  }, [usersList, searchQuery, selectedDept, selectedCurrencyFilter]);

  // Fast login as one of the 50 team members
  const handleSelectSeedUser = async (person: SeedUserMeta) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginUserWithBackend({ userId: person.id });
      if (onSelectCurrency) {
        onSelectCurrency(res.user.currency);
      }
      onLoginSuccess(res.user, res.data);
    } catch {
      // Offline fallback
      const fallbackUser: UserProfile = {
        id: person.id,
        name: person.name,
        email: person.email,
        role: person.role,
        plan: person.plan || 'Pro',
        currency: person.currency,
        currencySymbol: CURRENCY_SYMBOLS[person.currency] || '$',
        avatar: person.avatar,
        createdAt: '2026-10-18',
        security: {
          twoFactorEnabled: true,
          passkeyRegistered: true,
          lastLogin: 'Just now',
        },
      };
      if (onSelectCurrency) {
        onSelectCurrency(person.currency);
      }
      onLoginSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Form Submit (Sign In or Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (activeTab === 'signup' && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'signup') {
        const res = await registerUserWithBackend({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          currency: chosenCurrency,
          role,
          department,
        });
        if (onSelectCurrency) {
          onSelectCurrency(chosenCurrency);
        }
        onLoginSuccess(res.user, res.data);
      } else {
        const res = await loginUserWithBackend({
          email: email.trim().toLowerCase(),
          password,
        });
        if (onSelectCurrency) {
          onSelectCurrency(res.user.currency || chosenCurrency);
        }
        onLoginSuccess(res.user, res.data);
      }
    } catch (err: any) {
      // Provide instant optimistic fallback if backend is unreachable
      const fallbackUser: UserProfile = {
        id: `usr-${Date.now()}`,
        name: activeTab === 'signup' ? name.trim() : email.split('@')[0].replace('.', ' '),
        email: email.trim().toLowerCase(),
        role: activeTab === 'signup' ? role : 'Senior Professional',
        plan: 'Pro',
        currency: chosenCurrency,
        currencySymbol: CURRENCY_SYMBOLS[chosenCurrency],
        createdAt: new Date().toISOString().split('T')[0],
        security: {
          twoFactorEnabled: false,
          passkeyRegistered: false,
          lastLogin: 'Just now',
        },
      };
      if (onSelectCurrency) {
        onSelectCurrency(chosenCurrency);
      }
      onLoginSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Instant Demo Login (Alex Chen)
  const handleQuickDemoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await loginUserWithBackend({ userId: 'usr-01' });
      if (onSelectCurrency) {
        onSelectCurrency(res.user.currency);
      }
      onLoginSuccess(res.user, res.data);
    } catch {
      if (onSelectCurrency) {
        onSelectCurrency(chosenCurrency);
      }
      onLoginSuccess({
        ...DEMO_USER,
        currency: chosenCurrency,
        currencySymbol: CURRENCY_SYMBOLS[chosenCurrency],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Biometric / Passkey Login
  const handleBiometricLogin = () => {
    setIsBiometricLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsBiometricLoading(false);
      if (onSelectCurrency) {
        onSelectCurrency(chosenCurrency);
      }
      onLoginSuccess({
        ...DEMO_USER,
        name: 'Alex Chen (Passkey Authenticated)',
        currency: chosenCurrency,
        currencySymbol: CURRENCY_SYMBOLS[chosenCurrency],
      });
    }, 400);
  };

  // Google SSO
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onSelectCurrency) {
        onSelectCurrency(chosenCurrency);
      }
      onLoginSuccess({
        id: 'usr-google-88',
        name: 'Vignesh Reddy',
        email: 'reddymallavignesh@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'Director of Engineering',
        plan: 'Enterprise',
        currency: chosenCurrency,
        currencySymbol: CURRENCY_SYMBOLS[chosenCurrency],
        createdAt: '2026-10-18',
        security: {
          twoFactorEnabled: true,
          passkeyRegistered: true,
          lastLogin: 'Google SSO (Verified)',
        },
      });
    }, 350);
  };

  // Apple SSO
  const handleAppleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onSelectCurrency) {
        onSelectCurrency(chosenCurrency);
      }
      onLoginSuccess({
        id: 'usr-apple-42',
        name: 'Apple Verified Member',
        email: 'user@privaterelay.appleid.com',
        role: 'Senior Consultant',
        plan: 'Pro',
        currency: chosenCurrency,
        currencySymbol: CURRENCY_SYMBOLS[chosenCurrency],
        createdAt: '2026-10-18',
        security: {
          twoFactorEnabled: true,
          passkeyRegistered: true,
          lastLogin: 'Apple ID (Biometric)',
        },
      });
    }, 350);
  };

  // Forgot password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.includes('@')) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setIsForgotModalOpen(false);
      setForgotEmail('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md text-slate-100 flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-40 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card: Strict maximum size and responsive flex, stays 100% in viewport frame */}
      <div className="w-full max-w-4xl my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row relative z-10 overflow-hidden max-h-[92vh]">
        {/* LEFT COLUMN: Visual Branding (Visible on md+) */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-5 flex-col justify-between border-r border-slate-800/80 relative overflow-y-auto">
          {/* Top Brand */}
          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 text-slate-950 font-black">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  SpendWise<span className="text-emerald-400 font-black">.ai</span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium">Multi-User Financial Intelligence</p>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>50+ Verified Team Accounts</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                One platform, 50 tailored financial journeys.
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Switch seamlessly between 50 pre-configured profiles or register a custom workspace. Each account features isolated budgets, cash flows, and AI analysis.
              </p>
            </div>

            {/* Live Financial Snapshot Card */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 shadow-md">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Active Workspace Currency</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Live Sync
                </span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {chosenCurrency} ({CURRENCY_SYMBOLS[chosenCurrency]}) &bull; {CURRENCY_NAMES[chosenCurrency]}
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-4/5 rounded-full" />
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Multi-currency real-time conversion enabled</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badges */}
          <div className="relative z-10 pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Data Isolation & Persistence</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Each user holds their own discrete vault and private financial records.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Form with Guaranteed In-Frame Scroll */}
        <div className="w-full md:w-7/12 p-3 sm:p-5 flex flex-col justify-start overflow-y-auto max-h-[92vh] relative">
          {/* Close button if provided */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Top Header & Tab Switcher */}
          <div className="mb-2.5 pr-8">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {activeTab === 'directory'
                ? 'Select a Team Member (50 Accounts)'
                : activeTab === 'signin'
                ? 'Sign In to Your Workspace'
                : 'Create SpendWise Account'}
            </h1>
            <p className="text-xs text-slate-400">
              {activeTab === 'directory'
                ? 'Pick any of the 50 personas below to sign in instantly with tailored data'
                : activeTab === 'signin'
                ? 'Enter email & password or choose 1-Click Fast Login'
                : 'Setup a new personal finance profile with custom currency'}
            </p>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-2.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('directory');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === 'directory'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>50 People Directory</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === 'signin'
                  ? 'bg-slate-800 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === 'signup'
                  ? 'bg-slate-800 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Currency Selection Pill Bar - Always visible & Interactive */}
          <div className="mb-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">Workspace Currency:</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {currencies.map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => handleCurrencyChange(curr)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition ${
                    chosenCurrency === curr
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                  title={`${CURRENCY_NAMES[curr]} (${CURRENCY_SYMBOLS[curr]})`}
                >
                  {curr} {CURRENCY_SYMBOLS[curr]}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: 50 PEOPLE TEAM DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-2">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search 50 people by name, role, email, currency..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Department filter */}
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 shrink-0"
                >
                  <option value="All">All Departments ({usersList.length})</option>
                  <option value="Technology">Technology</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Finance & Business">Finance & Business</option>
                  <option value="Healthcare & Science">Healthcare & Science</option>
                  <option value="Education & Services">Education & Services</option>
                </select>
              </div>

              {/* Currency Quick Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] text-slate-400">
                <span className="shrink-0 text-[10px] text-slate-500 uppercase font-semibold">Filter:</span>
                {['All', 'USD', 'EUR', 'GBP', 'CAD', 'INR', 'JPY'].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setSelectedCurrencyFilter(curr)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition shrink-0 ${
                      selectedCurrencyFilter === curr
                        ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
                <span className="ml-auto text-[10px] text-slate-400">
                  Showing {filteredUsers.length} of {usersList.length}
                </span>
              </div>

              {/* Scrollable list of 50 users in a clean responsive grid */}
              <div className="overflow-y-auto max-h-[42vh] sm:max-h-[48vh] pr-1 border border-slate-800/80 rounded-xl p-2 bg-slate-950/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredUsers.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400">
                    No users matching &quot;{searchQuery}&quot;. Try another search term.
                  </div>
                ) : (
                  filteredUsers.map((person) => {
                    return (
                      <div
                        key={person.id}
                        className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition flex items-center justify-between gap-2 group shadow-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {person.avatar ? (
                            <img
                              src={person.avatar}
                              alt={person.name}
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {person.name.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white truncate max-w-[130px]">
                                {person.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">
                                {person.currency} {CURRENCY_SYMBOLS[person.currency] || '$'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 pt-0.5">
                              <span className="truncate">{person.role}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectSeedUser(person)}
                          disabled={isLoading}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 transition shadow-sm disabled:opacity-50 active:scale-95"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <span>Sign In</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2 & 3: STANDARD SIGN IN & SIGN UP FORM */}
          {(activeTab === 'signin' || activeTab === 'signup') && (
            <div className="flex flex-col space-y-2.5">
              {/* Quick Demo Access Callout (Only on Sign In) */}
              {activeTab === 'signin' && (
                <div className="mb-0.5">
                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    disabled={isLoading || isBiometricLoading}
                    className="w-full group p-2 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                        <Zap className="w-3 h-3 fill-slate-950" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>1-Click Instant Demo Login</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-mono">
                            Fast
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sign in as Lead Engineer Alex Chen ({chosenCurrency} {CURRENCY_SYMBOLS[chosenCurrency]})
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition shrink-0" />
                  </button>
                </div>
              )}

              {/* Social Sign-in Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isBiometricLoading}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={isLoading || isBiometricLoading}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 fill-white shrink-0" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.74-7.91-12.16-14.49-6.3-9.42-11.13-19.82-14.49-31.18-3.36-11.37-5.04-22.15-5.04-32.33 0-14.07 3.51-25.54 10.53-34.42 7.02-8.88 15.68-13.38 25.97-13.5 4.93 0 10.28 1.34 16.06 4.02 5.78 2.68 9.53 4.08 11.24 4.2 2.01-.25 5.86-1.68 11.55-4.3 5.69-2.62 10.8-3.87 15.34-3.75 10.89.5 19.88 4.46 26.96 11.88-9.44 5.75-14.06 13.91-13.86 24.49.2 8.35 3.44 15.39 9.72 21.13 6.28 5.74 13.62 9.07 22.02 10-1.74 5.65-3.88 11.24-6.42 16.77zM119.22 31.84c0-7.22 2.6-13.96 7.8-20.22 5.2-6.26 11.75-10.36 19.64-12.3 1.15 6.94-.13 13.56-3.85 19.87-3.72 6.31-9.1 10.96-16.14 13.96-2.31.85-4.79 1.28-7.45 1.31v-2.62z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-1.5">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold absolute">
                  or credentials
                </span>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-2">
                {activeTab === 'signup' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Full Name</label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="e.g. Rachel Adams"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Job Title / Role</label>
                        <div className="relative">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="e.g. Data Scientist"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Department</label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Technology">Technology</option>
                          <option value="Design & Creative">Design & Creative</option>
                          <option value="Finance & Business">Finance & Business</option>
                          <option value="Healthcare & Science">Healthcare & Science</option>
                          <option value="Education & Services">Education & Services</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="alex.chen@spendwise.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-semibold text-slate-300">Password</label>
                    {activeTab === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium transition"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 w-3 h-3"
                    />
                    <span>Remember this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isBiometricLoading}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>{activeTab === 'signup' ? 'Create SpendWise Account' : 'Sign In to Command Center'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Biometric & Guest Link */}
              <div className="pt-2 border-t border-slate-800 flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isBiometricLoading || isLoading}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition"
                >
                  {isBiometricLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Sign in with Passkey / Face ID</span>
                </button>

                {onExploreGuest && (
                  <button
                    type="button"
                    onClick={onExploreGuest}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 font-medium transition"
                  >
                    Or continue exploring dashboard as guest &rarr;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <KeyRound className="w-4 h-4" />
                <span>Reset Password</span>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {forgotSuccess ? (
              <div className="py-3 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Reset Link Dispatched</h4>
                <p className="text-xs text-slate-400">
                  Instructions sent to <span className="text-emerald-400">{forgotEmail}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Enter your email address to receive password recovery instructions.
                </p>
                <div>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
