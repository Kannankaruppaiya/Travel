import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, Field, Icon, Txt } from '@/components/ui';
import { PlaceCategories, Spacing } from '@/constants/theme';
import { CategoryPicker } from '@/features/trip/category-picker';
import { DayPicker } from '@/features/trip/day-picker';
import { confirmDelete } from '@/lib/confirm';
import { mapsUrl } from '@/lib/geo';
import type { Place } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';
import { useStore, useTrip } from '@/store/trips-store';

export default function PlaceScreen() {
  const { tripId, placeId } = useLocalSearchParams<{ tripId: string; placeId: string }>();
  const trip = useTrip(tripId);
  const place = trip?.places.find((p) => p.id === placeId);
  const { dispatch } = useStore();
  const theme = useTheme();

  const [name, setName] = useState(place?.name ?? '');
  const [time, setTime] = useState(place?.time ?? '');
  const [notes, setNotes] = useState(place?.notes ?? '');

  if (!trip || !place) {
    return <EmptyState icon="alert-circle-outline" title="Place not found" message="It may have been removed." />;
  }

  const update = (patch: Partial<Omit<Place, 'id'>>) =>
    dispatch({ type: 'updatePlace', tripId: trip.id, placeId: place.id, patch });

  const saveText = () => {
    const trimmed = name.trim();
    const patch: Partial<Place> = {};
    if (trimmed && trimmed !== place.name) patch.name = trimmed;
    if (time.trim() !== (place.time ?? '')) patch.time = time.trim() || undefined;
    if (notes !== (place.notes ?? '')) patch.notes = notes || undefined;
    if (Object.keys(patch).length > 0) update(patch);
  };

  const cat = PlaceCategories[place.category];

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: place.name }} />

      <Card style={{ gap: Spacing.sm }}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: cat.color }]}>
            <Icon name={cat.icon} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="heading">{place.name}</Txt>
            <Txt variant="caption" muted>{cat.label}</Txt>
          </View>
        </View>
        {place.address ? <Txt muted>{place.address}</Txt> : null}
        <View style={styles.row}>
          <Button title="Open in Maps" icon="map-outline" variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(mapsUrl(place))} />
          <Button
            title={place.visited ? 'Visited' : 'Mark visited'}
            icon={place.visited ? 'checkmark-circle' : 'ellipse-outline'}
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => update({ visited: !place.visited })}
          />
        </View>
      </Card>

      <DayPicker trip={trip} value={place.dayIndex} onChange={(d) => update({ dayIndex: d })} />
      <CategoryPicker label="Category" options={PlaceCategories} value={place.category} onChange={(c) => update({ category: c })} />

      <Field label="Name" value={name} onChangeText={setName} onBlur={saveText} />
      <Field label="Time (optional)" placeholder="e.g. 09:30 or Morning" value={time} onChangeText={setTime} onBlur={saveText} />
      <Field
        label="Notes"
        multiline
        placeholder="Opening hours, tickets, what to order…"
        value={notes}
        onChangeText={setNotes}
        onBlur={saveText}
      />

      <Button title="Save" icon="checkmark" onPress={() => { saveText(); router.back(); }} />
      <Button
        title="Remove from trip"
        icon="trash-outline"
        variant="ghost"
        onPress={() =>
          confirmDelete('Remove place?', `"${place.name}" will be removed from this trip.`, () => {
            router.back();
            dispatch({ type: 'deletePlace', tripId: trip.id, placeId: place.id });
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 60 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
