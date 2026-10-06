import { Linking, View } from 'react-native';

import { Button, Card, EmptyState, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { mapsUrl } from '@/lib/geo';
import type { Trip } from '@/lib/types';

/** react-native-maps has no web support, so the web build links out to Google Maps. */
export function MapTab({ trip }: { trip: Trip }) {
  const located = trip.places.filter((p) => p.latitude != null && p.longitude != null);
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
    <View style={{ gap: Spacing.sm }}>
      <Txt muted>The interactive map is available in the mobile app.</Txt>
      {located.map((p) => (
        <Card key={p.id} style={{ gap: Spacing.sm }}>
          <Txt style={{ fontWeight: '700' }}>{p.name}</Txt>
          <Txt variant="caption" muted>{p.dayIndex != null ? `Day ${p.dayIndex + 1}` : 'Saved place'}</Txt>
          <Button title="Open in Google Maps" icon="map-outline" variant="secondary" onPress={() => Linking.openURL(mapsUrl(p))} />
        </Card>
      ))}
    </View>
  );
}
