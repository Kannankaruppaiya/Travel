import type { ExpenseCategory, PlaceCategory } from '@/lib/types';

/** Brand colours taken from the PowPow Trips logo. */
export const Brand = {
  navy: '#13235B',
  orange: '#F26B1D',
  sun: '#FDB813',
  ocean: '#0AA5D8',
  coral: '#E8452C',
} as const;

export const Colors = {
  light: {
    text: '#13192E',
    textSecondary: '#5D6478',
    background: '#F7F8FB',
    card: '#FFFFFF',
    border: '#E3E6EE',
    primary: Brand.orange,
    primaryText: '#FFFFFF',
    accent: Brand.navy,
    danger: '#D93025',
    success: '#1E9E5A',
    chip: '#EEF1F7',
  },
  dark: {
    text: '#F2F4FA',
    textSecondary: '#A3AAC0',
    background: '#0B1533',
    card: '#14214A',
    border: '#24335F',
    primary: Brand.orange,
    primaryText: '#FFFFFF',
    accent: Brand.sun,
    danger: '#FF6B5E',
    success: '#4CD38A',
    chip: '#1E2C5A',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

export const PlaceCategories: Record<PlaceCategory, { label: string; icon: string; color: string }> = {
  sight: { label: 'Sightseeing', icon: 'camera-outline', color: '#0AA5D8' },
  food: { label: 'Food & drink', icon: 'restaurant-outline', color: '#F26B1D' },
  stay: { label: 'Stay', icon: 'bed-outline', color: '#7B4FD6' },
  shopping: { label: 'Shopping', icon: 'bag-handle-outline', color: '#E8452C' },
  transport: { label: 'Transport', icon: 'airplane-outline', color: '#13235B' },
  other: { label: 'Other', icon: 'location-outline', color: '#5D6478' },
};

export const ExpenseCategories: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  stay: { label: 'Stay', icon: 'bed-outline', color: '#7B4FD6' },
  food: { label: 'Food', icon: 'restaurant-outline', color: '#F26B1D' },
  transport: { label: 'Transport', icon: 'car-outline', color: '#0AA5D8' },
  activities: { label: 'Activities', icon: 'ticket-outline', color: '#1E9E5A' },
  shopping: { label: 'Shopping', icon: 'bag-handle-outline', color: '#E8452C' },
  other: { label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#5D6478' },
};
