export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'INR' | 'JPY';
  currencySymbol: string;
  createdAt: string;
  security: {
    twoFactorEnabled: boolean;
    passkeyRegistered: boolean;
    lastLogin: string;
  };
}

export type AuthMode = 'login' | 'signup' | 'forgot-password';

export const DEMO_USER: UserProfile = {
  id: 'usr-demo-01',
  name: 'Alex Chen',
  email: 'alex.chen@spendwise.ai',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  plan: 'Pro',
  currency: 'USD',
  currencySymbol: '$',
  createdAt: '2026-01-15',
  security: {
    twoFactorEnabled: true,
    passkeyRegistered: true,
    lastLogin: 'Just now',
  },
};

export const CURRENCY_SYMBOLS: Record<UserProfile['currency'], string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  INR: '₹',
  JPY: '¥',
};
