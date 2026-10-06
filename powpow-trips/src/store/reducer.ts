import type { AppData, ChecklistItem, Expense, Place, Settings, Trip } from '@/lib/types';
import { tripLength } from '@/lib/dates';

export const initialData: AppData = {
  version: 1,
  trips: [],
  settings: { userName: 'Me', defaultCurrency: 'INR' },
};

export type Action =
  | { type: 'load'; data: AppData }
  | { type: 'addTrip'; trip: Trip }
  | { type: 'updateTrip'; tripId: string; patch: Partial<Omit<Trip, 'id'>> }
  | { type: 'deleteTrip'; tripId: string }
  | { type: 'duplicateTrip'; tripId: string; newId: string; idFactory: () => string }
  | { type: 'addPlace'; tripId: string; place: Place }
  | { type: 'updatePlace'; tripId: string; placeId: string; patch: Partial<Omit<Place, 'id'>> }
  | { type: 'deletePlace'; tripId: string; placeId: string }
  | { type: 'movePlace'; tripId: string; placeId: string; direction: -1 | 1 }
  | { type: 'addExpense'; tripId: string; expense: Expense }
  | { type: 'updateExpense'; tripId: string; expenseId: string; patch: Partial<Omit<Expense, 'id'>> }
  | { type: 'deleteExpense'; tripId: string; expenseId: string }
  | { type: 'addChecklistItem'; tripId: string; item: ChecklistItem }
  | { type: 'toggleChecklistItem'; tripId: string; itemId: string }
  | { type: 'deleteChecklistItem'; tripId: string; itemId: string }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'replaceAll'; data: AppData };

function mapTrip(data: AppData, tripId: string, fn: (t: Trip) => Trip): AppData {
  return {
    ...data,
    trips: data.trips.map((t) => (t.id === tripId ? { ...fn(t), updatedAt: Date.now() } : t)),
  };
}

/** Places on days that no longer exist (trip shortened) go back to "unscheduled". */
function clampPlaces(trip: Trip): Trip {
  const days = tripLength(trip.startDate, trip.endDate);
  return {
    ...trip,
    places: trip.places.map((p) => (p.dayIndex != null && p.dayIndex >= days ? { ...p, dayIndex: null } : p)),
  };
}

export function reducer(data: AppData, action: Action): AppData {
  switch (action.type) {
    case 'load':
    case 'replaceAll':
      return action.data;

    case 'addTrip':
      return { ...data, trips: [action.trip, ...data.trips] };

    case 'updateTrip':
      return mapTrip(data, action.tripId, (t) => clampPlaces({ ...t, ...action.patch }));

    case 'deleteTrip':
      return { ...data, trips: data.trips.filter((t) => t.id !== action.tripId) };

    case 'duplicateTrip': {
      const src = data.trips.find((t) => t.id === action.tripId);
      if (!src) return data;
      const now = Date.now();
      const copy: Trip = {
        ...src,
        id: action.newId,
        title: `${src.title} (copy)`,
        places: src.places.map((p) => ({ ...p, id: action.idFactory(), visited: false })),
        checklist: src.checklist.map((c) => ({ ...c, id: action.idFactory(), done: false })),
        expenses: [],
        createdAt: now,
        updatedAt: now,
      };
      return { ...data, trips: [copy, ...data.trips] };
    }

    case 'addPlace':
      return mapTrip(data, action.tripId, (t) => ({ ...t, places: [...t.places, action.place] }));

    case 'updatePlace':
      return mapTrip(data, action.tripId, (t) => {
        const moving = action.patch.dayIndex !== undefined;
        const target = t.places.find((p) => p.id === action.placeId);
        if (!target) return t;
        const updated = { ...target, ...action.patch };
        // When a place changes day, put it at the end of that day's list.
        const rest = t.places.filter((p) => p.id !== action.placeId);
        const places =
          moving && action.patch.dayIndex !== target.dayIndex
            ? [...rest, updated]
            : t.places.map((p) => (p.id === action.placeId ? updated : p));
        return { ...t, places };
      });

    case 'deletePlace':
      return mapTrip(data, action.tripId, (t) => ({
        ...t,
        places: t.places.filter((p) => p.id !== action.placeId),
      }));

    case 'movePlace':
      return mapTrip(data, action.tripId, (t) => {
        const idx = t.places.findIndex((p) => p.id === action.placeId);
        if (idx < 0) return t;
        const day = t.places[idx].dayIndex;
        // Find the neighbour within the same day bucket.
        let j = idx + action.direction;
        while (j >= 0 && j < t.places.length && t.places[j].dayIndex !== day) j += action.direction;
        if (j < 0 || j >= t.places.length) return t;
        const places = [...t.places];
        [places[idx], places[j]] = [places[j], places[idx]];
        return { ...t, places };
      });

    case 'addExpense':
      return mapTrip(data, action.tripId, (t) => ({ ...t, expenses: [...t.expenses, action.expense] }));

    case 'updateExpense':
      return mapTrip(data, action.tripId, (t) => ({
        ...t,
        expenses: t.expenses.map((e) => (e.id === action.expenseId ? { ...e, ...action.patch } : e)),
      }));

    case 'deleteExpense':
      return mapTrip(data, action.tripId, (t) => ({
        ...t,
        expenses: t.expenses.filter((e) => e.id !== action.expenseId),
      }));

    case 'addChecklistItem':
      return mapTrip(data, action.tripId, (t) => ({ ...t, checklist: [...t.checklist, action.item] }));

    case 'toggleChecklistItem':
      return mapTrip(data, action.tripId, (t) => ({
        ...t,
        checklist: t.checklist.map((c) => (c.id === action.itemId ? { ...c, done: !c.done } : c)),
      }));

    case 'deleteChecklistItem':
      return mapTrip(data, action.tripId, (t) => ({
        ...t,
        checklist: t.checklist.filter((c) => c.id !== action.itemId),
      }));

    case 'updateSettings':
      return { ...data, settings: { ...data.settings, ...action.patch } };
  }
}

/** Accepts unknown JSON (e.g. an imported backup) and returns valid AppData or throws. */
export function parseBackup(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('Backup is empty or not JSON');
  const obj = raw as Partial<AppData>;
  if (!Array.isArray(obj.trips)) throw new Error('Backup has no trips list');
  for (const t of obj.trips) {
    if (!t || typeof t.id !== 'string' || typeof t.title !== 'string') {
      throw new Error('Backup contains an invalid trip');
    }
  }
  return {
    version: 1,
    trips: obj.trips.map((t) => ({
      ...t,
      travelers: t.travelers ?? [],
      notes: t.notes ?? '',
      places: t.places ?? [],
      expenses: t.expenses ?? [],
      checklist: t.checklist ?? [],
    })),
    settings: { ...initialData.settings, ...obj.settings },
  };
}
