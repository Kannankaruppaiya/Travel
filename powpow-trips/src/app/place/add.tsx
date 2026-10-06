import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, EmptyState, Field, Icon, Txt } from '@/components/ui';
import { PlaceCategories, Radius, Spacing } from '@/constants/theme';
import { DayPicker } from '@/features/trip/day-picker';
import { searchPlaces, type SearchResult } from '@/lib/geo';
import type { PlaceCategory } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';
import { newId, useStore, useTrip } from '@/store/trips-store';

const QUICK_SEARCHES: { label: string; query: string; icon: string }[] = [
  { label: 'Attractions', query: 'tourist attraction', icon: 'camera-outline' },
  { label: 'Restaurants', query: 'restaurant', icon: 'restaurant-outline' },
  { label: 'Hotels', query: 'hotel', icon: 'bed-outline' },
  { label: 'Beaches', query: 'beach', icon: 'sunny-outline' },
  { label: 'Temples', query: 'temple', icon: 'business-outline' },
  { label: 'Cafes', query: 'cafe', icon: 'cafe-outline' },
];

export default function AddPlaceScreen() {
  const params = useLocalSearchParams<{ tripId: string; day?: string; q?: string }>();
  const trip = useTrip(params.tripId);
  const { dispatch } = useStore();
  const theme = useTheme();

  const [day, setDay] = useState<number | null>(params.day != null ? Number(params.day) : null);
  const [query, setQuery] = useState(params.q ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const requestNo = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || !trip) return;
    const n = ++requestNo.current;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await searchPlaces(q, trip.destination);
        if (n === requestNo.current) setResults(r);
      } catch {
        if (n === requestNo.current) setError('Could not search right now. Check your internet connection.');
      } finally {
        if (n === requestNo.current) setLoading(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [query, trip]);

  if (!trip) return <EmptyState icon="alert-circle-outline" title="Trip not found" message="It may have been deleted." />;

  const addPlace = (p: { name: string; address?: string; latitude?: number; longitude?: number; category: PlaceCategory }, key: string) => {
    dispatch({
      type: 'addPlace',
      tripId: trip.id,
      place: { id: newId(), ...p, dayIndex: day, createdAt: Date.now() },
    });
    setAdded((s) => new Set(s).add(key));
  };

  const addCustom = () => {
    const name = query.trim();
    if (!name) return;
    addPlace({ name, category: 'other' }, `custom:${name}`);
    router.back();
  };

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      data={query.trim().length >= 3 ? results : []}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={
        <View style={{ gap: Spacing.lg }}>
          <Field
            label={`Search in ${trip.destination}`}
            placeholder="Beach, museum, restaurant name…"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          <View style={styles.quick}>
            {QUICK_SEARCHES.map((q) => (
              <Chip key={q.label} label={q.label} icon={q.icon} onPress={() => setQuery(q.query)} />
            ))}
          </View>
          <DayPicker trip={trip} value={day} onChange={setDay} />
          {loading ? <ActivityIndicator color={theme.primary} /> : null}
          {error ? <Txt color={theme.danger}>{error}</Txt> : null}
          {query.trim().length > 0 ? (
            <Button title={`Add "${query.trim()}" as a custom place`} icon="create-outline" variant="secondary" onPress={addCustom} />
          ) : null}
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      renderItem={({ item }) => {
        const cat = PlaceCategories[item.category];
        const isAdded = added.has(item.id);
        return (
          <Pressable
            disabled={isAdded}
            onPress={() => addPlace(item, item.id)}
            style={[styles.result, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.icon, { backgroundColor: cat.color }]}>
              <Icon name={cat.icon} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '700' }} numberOfLines={1}>{item.name}</Txt>
              <Txt variant="caption" muted numberOfLines={2}>{item.address}</Txt>
            </View>
            <Icon name={isAdded ? 'checkmark-circle' : 'add-circle'} size={28} color={isAdded ? theme.success : theme.primary} />
          </Pressable>
        );
      }}
      ListFooterComponent={
        added.size > 0 ? (
          <Button title={`Done (${added.size} added)`} icon="checkmark" onPress={() => router.back()} style={{ marginTop: Spacing.lg }} />
        ) : (
          <Txt variant="caption" muted style={{ marginTop: Spacing.lg, textAlign: 'center' }}>
            Search results © OpenStreetMap contributors
          </Txt>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 60 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
