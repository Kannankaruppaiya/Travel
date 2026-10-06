import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';

import type { AppData, Trip } from '@/lib/types';
import { initialData, parseBackup, reducer, type Action } from './reducer';

const STORAGE_KEY = 'powpow-trips/data/v1';

type Store = {
  data: AppData;
  ready: boolean;
  dispatch: (action: Action) => void;
};

const StoreContext = createContext<Store | null>(null);

export function newId(): string {
  return Crypto.randomUUID();
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, initialData);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'load', data: parseBackup(JSON.parse(raw)) });
      })
      .catch((err) => console.warn('Could not load saved trips', err))
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    // Don't overwrite saved data with the empty initial state before it has loaded.
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((err) =>
      console.warn('Could not save trips', err),
    );
  }, [data]);

  return <StoreContext.Provider value={{ data, ready, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <TripsProvider>');
  return store;
}

export function useTrip(tripId: string | undefined): Trip | undefined {
  const { data } = useStore();
  return data.trips.find((t) => t.id === tripId);
}
