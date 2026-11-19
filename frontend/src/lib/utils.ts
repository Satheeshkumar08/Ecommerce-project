import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  price: number | string,
  options: {
    currency?: 'USD' | 'EUR' | 'GBP' | 'INR';
    notation?: Intl.NumberFormatOptions['notation'];
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
) {
  const {
    currency = 'INR',
    notation = 'standard',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;
  const numericPrice = typeof price === 'string' ? parseFloat(price) : Number(price || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    notation,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericPrice);
}

export function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
