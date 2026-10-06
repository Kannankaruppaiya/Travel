import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { Chip, EmptyState, Icon, IconButton, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { BudgetTab } from '@/features/trip/budget-tab';
import { ChecklistTab } from '@/features/trip/checklist-tab';
import { ItineraryTab } from '@/features/trip/itinerary-tab';
import { MapTab } from '@/features/trip/map-tab';
import { OverviewTab } from '@/features/trip/overview-tab';
import { confirmDelete } from '@/lib/confirm';
import { tripToText } from '@/lib/share';
import { useTheme } from '@/hooks/use-theme';
import { newId, useStore, useTrip } from '@/store/trips-store';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'albums-outline' },
  { key: 'itinerary', label: 'Itinerary', icon: 'list-outline' },
  { key: 'map', label: 'Map', icon: 'map-outline' },
  { key: 'budget', label: 'Budget', icon: 'wallet-outline' },
  { key: 'checklist', label: 'Checklist', icon: 'checkbox-outline' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(id);
  const { dispatch } = useStore();
  const theme = useTheme();
  const [tab, setTab] = useState<TabKey>('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  if (!trip) {
    return <EmptyState icon="alert-circle-outline" title="Trip not found" message="It may have been deleted." />;
  }

  const menu = [
    {
      icon: 'create-outline',
      label: 'Edit trip details',
      onPress: () => router.push({ pathname: '/trip/edit/[id]', params: { id: trip.id } }),
    },
    {
      icon: 'share-social-outline',
      label: 'Share itinerary',
      onPress: () => Share.share({ title: trip.title, message: tripToText(trip) }),
    },
    {
      icon: 'copy-outline',
      label: 'Duplicate trip',
      onPress: () => {
        const copyId = newId();
        dispatch({ type: 'duplicateTrip', tripId: trip.id, newId: copyId, idFactory: newId });
        router.replace({ pathname: '/trip/[id]', params: { id: copyId } });
      },
    },
    {
      icon: 'trash-outline',
      label: 'Delete trip',
      danger: true,
      onPress: () =>
        confirmDelete('Delete trip?', `"${trip.title}" and all its places and expenses will be removed.`, () => {
          router.back();
          dispatch({ type: 'deleteTrip', tripId: trip.id });
        }),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: trip.title,
          headerRight: () => <IconButton icon="ellipsis-horizontal-circle" label="Trip options" color={theme.text} onPress={() => setMenuOpen(true)} />,
        }}
      />

      <View style={[styles.tabsBar, { borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => (
            <Chip key={t.key} label={t.label} icon={t.icon} selected={tab === t.key} onPress={() => setTab(t.key)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          <Icon name="location" color={theme.primary} />
          <Txt variant="heading" style={{ flex: 1 }}>{trip.destination}</Txt>
        </View>
        {tab === 'overview' && <OverviewTab trip={trip} />}
        {tab === 'itinerary' && <ItineraryTab trip={trip} />}
        {tab === 'map' && <MapTab trip={trip} />}
        {tab === 'budget' && <BudgetTab trip={trip} />}
        {tab === 'checklist' && <ChecklistTab trip={trip} />}
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            {menu.map((m) => (
              <Pressable
                key={m.label}
                style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: theme.chip }]}
                onPress={() => {
                  setMenuOpen(false);
                  m.onPress();
                }}>
                <Icon name={m.icon} color={m.danger ? theme.danger : theme.text} />
                <Txt color={m.danger ? theme.danger : undefined}>{m.label}</Txt>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabs: { gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 80 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
});
