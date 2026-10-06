import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, IconButton, Txt } from '@/components/ui';
import { PlaceCategories, Radius, Spacing } from '@/constants/theme';
import type { Place } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  tripId: string;
  place: Place;
  index?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleVisited?: () => void;
};

export function PlaceRow({ tripId, place, index, onMoveUp, onMoveDown, onToggleVisited }: Props) {
  const theme = useTheme();
  const cat = PlaceCategories[place.category];
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/place/[placeId]', params: { placeId: place.id, tripId } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.badge, { backgroundColor: cat.color }]}>
        {index != null ? (
          <Txt color="#fff" style={{ fontWeight: '800' }}>{index + 1}</Txt>
        ) : (
          <Icon name={cat.icon} size={18} color="#fff" />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt
          numberOfLines={1}
          style={[{ fontWeight: '700' }, place.visited && { textDecorationLine: 'line-through', opacity: 0.6 }]}>
          {place.name}
        </Txt>
        <Txt variant="caption" muted numberOfLines={1}>
          {[place.time, cat.label, place.address?.split(',').slice(0, 2).join(',')].filter(Boolean).join(' · ')}
        </Txt>
        {place.notes ? (
          <Txt variant="caption" numberOfLines={2}>{place.notes}</Txt>
        ) : null}
      </View>
      <View style={styles.actions}>
        {onToggleVisited ? (
          <IconButton
            icon={place.visited ? 'checkmark-circle' : 'ellipse-outline'}
            color={place.visited ? theme.success : theme.textSecondary}
            label={place.visited ? 'Mark as not visited' : 'Mark as visited'}
            onPress={onToggleVisited}
          />
        ) : null}
        {onMoveUp || onMoveDown ? (
          <View>
            {onMoveUp ? <IconButton icon="chevron-up" label="Move up" color={theme.textSecondary} onPress={onMoveUp} /> : null}
            {onMoveDown ? <IconButton icon="chevron-down" label="Move down" color={theme.textSecondary} onPress={onMoveDown} /> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
