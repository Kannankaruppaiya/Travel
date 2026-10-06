import { router } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { Button, Icon, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { addDays, formatLong, todayISO, tripLength } from '@/lib/dates';
import { directionsUrl, distanceKm } from '@/lib/geo';
import type { Place, Trip } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/trips-store';
import { PlaceRow } from './place-row';

function routeDistance(places: Place[]): number {
  const pts = places.filter(
    (p): p is Place & { latitude: number; longitude: number } => p.latitude != null && p.longitude != null,
  );
  let km = 0;
  for (let i = 1; i < pts.length; i++) km += distanceKm(pts[i - 1], pts[i]);
  return km;
}

export function ItineraryTab({ trip }: { trip: Trip }) {
  const theme = useTheme();
  const { dispatch } = useStore();
  const days = tripLength(trip.startDate, trip.endDate);
  const today = todayISO();

  return (
    <View style={{ gap: Spacing.xl }}>
      {Array.from({ length: days }, (_, dayIndex) => {
        const date = addDays(trip.startDate, dayIndex);
        const places = trip.places.filter((p) => p.dayIndex === dayIndex);
        const km = routeDistance(places);
        const url = directionsUrl(places);
        const isToday = date === today;
        return (
          <View key={dayIndex} style={{ gap: Spacing.sm }}>
            <View style={styles.dayHeader}>
              <View style={[styles.dayBadge, { backgroundColor: isToday ? theme.primary : theme.accent }]}>
                <Txt color={theme.dark && !isToday ? '#13235B' : '#fff'} style={{ fontWeight: '800' }}>
                  Day {dayIndex + 1}
                </Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '700' }}>{formatLong(date)}</Txt>
                {places.length > 0 ? (
                  <Txt variant="caption" muted>
                    {places.length} {places.length === 1 ? 'stop' : 'stops'}
                    {km > 0 ? ` · ~${km < 10 ? km.toFixed(1) : Math.round(km)} km` : ''}
                  </Txt>
                ) : null}
              </View>
              {isToday ? <Txt variant="caption" color={theme.primary} style={{ fontWeight: '700' }}>TODAY</Txt> : null}
            </View>

            {places.map((p, i) => (
              <PlaceRow
                key={p.id}
                tripId={trip.id}
                place={p}
                index={i}
                onToggleVisited={() =>
                  dispatch({ type: 'updatePlace', tripId: trip.id, placeId: p.id, patch: { visited: !p.visited } })
                }
                onMoveUp={i > 0 ? () => dispatch({ type: 'movePlace', tripId: trip.id, placeId: p.id, direction: -1 }) : undefined}
                onMoveDown={
                  i < places.length - 1
                    ? () => dispatch({ type: 'movePlace', tripId: trip.id, placeId: p.id, direction: 1 })
                    : undefined
                }
              />
            ))}

            {places.length === 0 ? (
              <View style={[styles.emptyDay, { borderColor: theme.border }]}>
                <Icon name="sunny-outline" color={theme.textSecondary} />
                <Txt muted variant="caption">Nothing planned yet: a free day!</Txt>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Button
                title="Add place"
                icon="add"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() =>
                  router.push({ pathname: '/place/add', params: { tripId: trip.id, day: String(dayIndex) } })
                }
              />
              {url ? (
                <Button
                  title="Route"
                  icon="navigate-outline"
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={() => Linking.openURL(url)}
                />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dayBadge: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill },
  emptyDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm },
});
