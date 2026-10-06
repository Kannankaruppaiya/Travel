import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { Chip, EmptyState, Txt } from '@/components/ui';
import { PlaceCategories, Radius, Spacing } from '@/constants/theme';
import type { Place, Trip } from '@/lib/types';
import { tripLength } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';

type Located = Place & { latitude: number; longitude: number };

export function MapTab({ trip }: { trip: Trip }) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  // 'all' | 'saved' | day index
  const [filter, setFilter] = useState<'all' | 'saved' | number>('all');
  const days = tripLength(trip.startDate, trip.endDate);

  const located = useMemo(
    () => trip.places.filter((p): p is Located => p.latitude != null && p.longitude != null),
    [trip.places],
  );
  const visible = useMemo(
    () =>
      located.filter((p) =>
        filter === 'all' ? true : filter === 'saved' ? p.dayIndex == null : p.dayIndex === filter,
      ),
    [located, filter],
  );

  useEffect(() => {
    if (visible.length === 0) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(visible, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [visible]);

  if (located.length === 0) {
    return (
      <EmptyState
        icon="map-outline"
        title="Nothing on the map yet"
        message="Places you add from search come with a location and appear here."
      />
    );
  }

  return (
    <View style={{ gap: Spacing.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Saved" selected={filter === 'saved'} onPress={() => setFilter('saved')} />
        {Array.from({ length: days }, (_, i) => (
          <Chip key={i} label={`Day ${i + 1}`} selected={filter === i} onPress={() => setFilter(i)} />
        ))}
      </ScrollView>

      <View style={[styles.mapWrap, { borderColor: theme.border }]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: located[0].latitude,
            longitude: located[0].longitude,
            latitudeDelta: 0.2,
            longitudeDelta: 0.2,
          }}
          showsUserLocation>
          {visible.map((p) => (
            <Marker
              key={p.id}
              coordinate={p}
              title={p.name}
              description={p.dayIndex != null ? `Day ${p.dayIndex + 1}` : 'Saved place'}
              pinColor={PlaceCategories[p.category].color}
              onCalloutPress={() =>
                router.push({ pathname: '/place/[placeId]', params: { placeId: p.id, tripId: trip.id } })
              }
            />
          ))}
          {typeof filter === 'number' && visible.length > 1 ? (
            <Polyline coordinates={visible} strokeColor={theme.primary} strokeWidth={4} lineDashPattern={[8, 6]} />
          ) : null}
        </MapView>
      </View>
      <Txt variant="caption" muted>
        {visible.length} of {located.length} places shown. Tap a pin, then its label to open the place.
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { height: 460, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1 },
});
