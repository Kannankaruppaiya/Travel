import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, Field, Icon, SectionHeader, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { daysUntil, formatRange, tripLength, tripStatus } from '@/lib/dates';
import { formatMoney, totalSpent } from '@/lib/money';
import type { Trip } from '@/lib/types';
import { useSyncedState } from '@/hooks/use-synced-state';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/trips-store';
import { PlaceRow } from './place-row';

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={20} color={theme.primary} />
      <Txt variant="heading">{value}</Txt>
      <Txt variant="caption" muted>{label}</Txt>
    </View>
  );
}

export function OverviewTab({ trip }: { trip: Trip }) {
  const { dispatch } = useStore();
  const [notes, setNotes] = useSyncedState(trip.notes);

  const days = tripLength(trip.startDate, trip.endDate);
  const status = tripStatus(trip.startDate, trip.endDate);
  const unscheduled = trip.places.filter((p) => p.dayIndex == null);
  const scheduled = trip.places.length - unscheduled.length;
  const packed = trip.checklist.filter((c) => c.done).length;

  const countdown =
    status === 'upcoming'
      ? `${daysUntil(trip.startDate)} days to go`
      : status === 'ongoing'
        ? 'Enjoy your trip!'
        : 'Trip completed';

  return (
    <View style={styles.wrap}>
      <Card style={{ gap: Spacing.md }}>
        <Txt muted>{formatRange(trip.startDate, trip.endDate)}</Txt>
        <Txt variant="heading">{countdown}</Txt>
        <View style={styles.stats}>
          <Stat icon="calendar-outline" value={String(days)} label="days" />
          <Stat icon="pin-outline" value={`${scheduled}/${trip.places.length}`} label="planned" />
          <Stat icon="wallet-outline" value={formatMoney(totalSpent(trip.expenses), trip.currency)} label="spent" />
          <Stat icon="checkbox-outline" value={`${packed}/${trip.checklist.length}`} label="packed" />
        </View>
      </Card>

      <View>
        <SectionHeader
          title={`Places to visit (${unscheduled.length})`}
          right={
            <Button
              title="Add"
              icon="add"
              variant="ghost"
              onPress={() => router.push({ pathname: '/place/add', params: { tripId: trip.id } })}
            />
          }
        />
        <Txt variant="caption" muted style={{ marginBottom: Spacing.sm }}>
          Save ideas here, then assign them to a day from the place screen.
        </Txt>
        {unscheduled.length === 0 ? (
          <EmptyState
            icon="bookmark-outline"
            title="No saved places"
            message="Search for sights, restaurants and hotels to add them to this trip."
            action={
              <Button
                title="Find places"
                icon="search"
                onPress={() => router.push({ pathname: '/place/add', params: { tripId: trip.id } })}
              />
            }
          />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {unscheduled.map((p) => (
              <PlaceRow key={p.id} tripId={trip.id} place={p} />
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Trip notes" />
        <Field
          multiline
          placeholder="Flight numbers, hotel confirmation, ideas…"
          value={notes}
          onChangeText={setNotes}
          onBlur={() => notes !== trip.notes && dispatch({ type: 'updateTrip', tripId: trip.id, patch: { notes } })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xl },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', gap: 2, flex: 1 },
});
