import { useSyncedState } from '@/hooks/use-synced-state';
import { isValidISODate } from '@/lib/dates';
import { Field } from './ui';

type Props = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: string;
};

/** Web has no native date picker module, so accept YYYY-MM-DD text. */
export function DateField({ label, value, onChange, minimumDate }: Props) {
  const [text, setText] = useSyncedState(value);

  return (
    <Field
      label={`${label} (YYYY-MM-DD)`}
      value={text}
      onChangeText={(t) => {
        setText(t);
        if (isValidISODate(t) && (!minimumDate || t >= minimumDate)) onChange(t);
      }}
      placeholder="2026-12-24"
      autoCapitalize="none"
    />
  );
}
