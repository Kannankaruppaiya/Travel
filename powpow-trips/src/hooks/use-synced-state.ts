import { useState } from 'react';

/**
 * Local editable copy of a value that resets whenever the source value changes
 * (e.g. a text field showing stored data that can also change elsewhere).
 * Uses the "adjust state during render" pattern instead of an effect.
 */
export function useSyncedState<T>(source: T): [T, (value: T) => void] {
  const [value, setValue] = useState(source);
  const [prevSource, setPrevSource] = useState(source);
  if (prevSource !== source) {
    setPrevSource(source);
    setValue(source);
  }
  return [value, setValue];
}
