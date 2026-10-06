import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TripCard } from '@/components/trip-card';
import { Button, Chip, EmptyState, Icon, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { tripStatus } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/trips-store';

type Filter = 'upcoming' | 'past';

export default function TripsScreen() {
  const theme = useTheme();
  const { data } = useStore();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const { current, upcoming, past } = useMemo(() => {
    const byStart = [...data.trips].sort((a, b) => a.startDate.localeCompare(b.startDate));
    return {
      current: byStart.filter((t) => tripStatus(t.startDate, t.endDate) === 'ongoing'),
      upcoming: byStart.filter((t) => tripStatus(t.startDate, t.endDate) === 'upcoming'),
      past: byStart.filter((t) => tripStatus(t.startDate, t.endDate) === 'past').reverse(),
    };
  }, [data.trips]);

  const list = filter === 'upcoming' ? upcoming : past;
  const open = (id: string) => router.push({ pathname: '/trip/[id]', params: { id } });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
          <View style={{ flex: 1 }}>
            <Txt muted>Hello, {data.settings.userName} 👋</Txt>
            <Txt variant="title">Where to next?</Txt>
          </View>
        </View>

        {current.length > 0 ? (
          <View style={styles.section}>
            <Txt variant="heading">On a trip right now</Txt>
            {current.map((t) => (
              <TripCard key={t.id} trip={t} onPress={() => open(t.id)} />
            ))}
          </View>
        ) : null}

        <View style={styles.filters}>
          <Chip label={`Upcoming (${upcoming.length})`} selected={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
          <Chip label={`Past (${past.length})`} selected={filter === 'past'} onPress={() => setFilter('past')} />
        </View>

        {list.length === 0 ? (
          <EmptyState
            icon={filter === 'upcoming' ? 'airplane-outline' : 'time-outline'}
            title={filter === 'upcoming' ? 'No upcoming trips' : 'No past trips yet'}
            message={
              filter === 'upcoming'
                ? 'Plan your next getaway: add places, build a day-by-day itinerary and track your budget.'
                : 'Trips you finish will show up here.'
            }
            action={
              filter === 'upcoming' ? (
                <Button title="Plan a new trip" icon="add" onPress={() => router.push('/trip/new')} />
              ) : undefined
            }
          />
        ) : (
          <View style={styles.section}>
            {list.map((t) => (
              <TripCard key={t.id} trip={t} onPress={() => open(t.id)} />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        accessibilityLabel="Plan a new trip"
        onPress={() => router.push('/trip/new')}
        style={({ pressed }) => [styles.fab, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}>
        <Icon name="add" size={30} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  logo: { width: 76, height: 74 },
  section: { gap: Spacing.md },
  filters: { flexDirection: 'row', gap: Spacing.sm },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
