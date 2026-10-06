import { StyleSheet, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import { daysUntil, formatRange, tripLength, tripStatus } from '@/lib/dates';
import type { Trip } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';
import { Card, Icon, Txt } from './ui';

const BANNER_COLORS = [Brand.orange, Brand.ocean, Brand.navy, Brand.coral, '#7B4FD6', '#1E9E5A'];

function bannerColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return BANNER_COLORS[h % BANNER_COLORS.length];
}

function statusLabel(trip: Trip): string {
  const status = tripStatus(trip.startDate, trip.endDate);
  if (status === 'ongoing') return 'Happening now';
  if (status === 'past') return 'Completed';
  const d = daysUntil(trip.startDate);
  return d === 1 ? 'Starts tomorrow' : `In ${d} days`;
}

export function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const theme = useTheme();
  const days = tripLength(trip.startDate, trip.endDate);
  const color = bannerColor(trip.id);
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={[styles.banner, { backgroundColor: color }]}>
        <Txt variant="heading" color="#fff" numberOfLines={1}>{trip.title}</Txt>
        <View style={styles.badge}>
          <Txt variant="caption" color="#fff" style={{ fontWeight: '700' }}>{statusLabel(trip)}</Txt>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.line}>
          <Icon name="location" size={16} color={theme.primary} />
          <Txt numberOfLines={1} style={{ flex: 1 }}>{trip.destination}</Txt>
        </View>
        <View style={styles.line}>
          <Icon name="calendar" size={16} color={theme.textSecondary} />
          <Txt muted variant="caption">
            {formatRange(trip.startDate, trip.endDate)} · {days} {days === 1 ? 'day' : 'days'}
          </Txt>
        </View>
        <View style={styles.line}>
          <Icon name="pin" size={16} color={theme.textSecondary} />
          <Txt muted variant="caption">
            {trip.places.length} places
            {trip.travelers.length > 1 ? ` · ${trip.travelers.length} travellers` : ''}
          </Txt>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  banner: { padding: Spacing.lg, gap: Spacing.sm, minHeight: 84, justifyContent: 'space-between' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  body: { padding: Spacing.lg, gap: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
