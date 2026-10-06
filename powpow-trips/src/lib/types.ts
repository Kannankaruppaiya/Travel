export type PlaceCategory = 'sight' | 'food' | 'stay' | 'shopping' | 'transport' | 'other';

export type Place = {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category: PlaceCategory;
  notes?: string;
  /** null = saved to the trip but not scheduled on a day yet */
  dayIndex: number | null;
  /** Free-text time such as "09:30" */
  time?: string;
  visited?: boolean;
  createdAt: number;
};

export type ExpenseCategory = 'stay' | 'food' | 'transport' | 'activities' | 'shopping' | 'other';

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string;
  /** Travellers sharing this expense; empty means everyone on the trip */
  splitWith: string[];
  date: string;
  createdAt: number;
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  /** ISO dates, YYYY-MM-DD */
  startDate: string;
  endDate: string;
  currency: string;
  budget: number;
  travelers: string[];
  notes: string;
  places: Place[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  createdAt: number;
  updatedAt: number;
};

export type Settings = {
  userName: string;
  defaultCurrency: string;
};

export type AppData = {
  version: 1;
  trips: Trip[];
  settings: Settings;
};
