import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { formatLong, parseISODate, toISODate } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { Icon, Txt } from './ui';

type Props = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: string;
};

export function DateField({ label, value, onChange, minimumDate }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: Spacing.xs }}>
      <Txt variant="label" muted>{label}</Txt>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Icon name="calendar-outline" size={18} color={theme.primary} />
        <Txt>{formatLong(value)}</Txt>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={parseISODate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate ? parseISODate(minimumDate) : undefined}
          onChange={(event, date) => {
            if (Platform.OS !== 'ios') setOpen(false);
            if (event.type === 'set' && date) onChange(toISODate(date));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
});
