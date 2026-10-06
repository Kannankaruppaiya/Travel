import type { Expense, Trip } from './types';

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'MYR', 'THB', 'LKR', 'JPY', 'AUD'];

const SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  SGD: 'S$',
};

export function formatMoney(amount: number, currency: string): string {
  const symbol = SYMBOLS[currency];
  const rounded = Math.round(amount * 100) / 100;
  const text = rounded.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return symbol ? `${symbol}${text}` : `${currency} ${text}`;
}

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/** Positive balance = this person should receive money; negative = owes money. */
export function balances(trip: Trip): Record<string, number> {
  const people = trip.travelers.length > 0 ? trip.travelers : ['Me'];
  const result: Record<string, number> = Object.fromEntries(people.map((p) => [p, 0]));
  for (const e of trip.expenses) {
    const sharers = e.splitWith.length > 0 ? e.splitWith : people;
    const share = e.amount / sharers.length;
    result[e.paidBy] = (result[e.paidBy] ?? 0) + e.amount;
    for (const p of sharers) result[p] = (result[p] ?? 0) - share;
  }
  return result;
}

export type Settlement = { from: string; to: string; amount: number };

/** Greedy settle-up: fewest payments that bring everyone to zero. */
export function settleUp(balance: Record<string, number>): Settlement[] {
  const debtors = Object.entries(balance)
    .filter(([, v]) => v < -0.005)
    .map(([name, v]) => ({ name, amount: -v }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(balance)
    .filter(([, v]) => v > 0.005)
    .map(([name, v]) => ({ name, amount: v }))
    .sort((a, b) => b.amount - a.amount);

  const out: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    out.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.005) i++;
    if (creditors[j].amount < 0.005) j++;
  }
  return out;
}
