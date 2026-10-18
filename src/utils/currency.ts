import { UserProfile, CURRENCY_SYMBOLS } from '../types/auth';

// Standard conversion rates relative to USD (1 USD = rate * Currency)
export const CURRENCY_RATES: Record<UserProfile['currency'], number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.38,
  INR: 86.5,
  JPY: 154.0,
};

export const CURRENCY_NAMES: Record<UserProfile['currency'], string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  CAD: 'Canadian Dollar',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
};

export function convertFromUSD(
  amountInUSD: number,
  currency: UserProfile['currency'] = 'USD'
): number {
  const rate = CURRENCY_RATES[currency] || 1;
  return amountInUSD * rate;
}

export function convertToUSD(
  amountInCurrency: number,
  currency: UserProfile['currency'] = 'USD'
): number {
  const rate = CURRENCY_RATES[currency] || 1;
  return amountInCurrency / rate;
}

export function formatCurrency(
  amountInUSD: number,
  currency: UserProfile['currency'] = 'USD',
  convert: boolean = true
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  const rate = convert ? CURRENCY_RATES[currency] || 1 : 1;
  const converted = amountInUSD * rate;

  if (currency === 'JPY') {
    return `${symbol}${Math.round(converted).toLocaleString()}`;
  }

  return `${symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
