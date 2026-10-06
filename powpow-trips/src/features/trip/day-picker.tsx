import { ScrollView, View } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addDays, formatShort, tripLength } from '@/lib/dates';
import type { Trip } from '@/lib/types';

export function DayPicker({
  trip,
  value,
  onChange,
}: {
  trip: Trip;
  value: number | null;
  onChange: (day: number | null) => void;
}) {
  const days = tripLength(trip.startDate, trip.endDate);
  return (
    <View style={{ gap: Spacing.xs }}>
      <Txt variant="label" muted>Schedule</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
        <Chip label="Not scheduled" icon="bookmark-outline" selected={value == null} onPress={() => onChange(null)} />
        {Array.from({ length: days }, (_, i) => (
          <Chip
            key={i}
            label={`Day ${i + 1} · ${formatShort(addDays(trip.startDate, i))}`}
            selected={value === i}
            onPress={() => onChange(i)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
