import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, EmptyState, Field, Icon, IconButton, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import type { Trip } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';
import { newId, useStore } from '@/store/trips-store';

export function ChecklistTab({ trip }: { trip: Trip }) {
  const theme = useTheme();
  const { dispatch } = useStore();
  const [text, setText] = useState('');

  const add = () => {
    const value = text.trim();
    if (!value) return;
    dispatch({ type: 'addChecklistItem', tripId: trip.id, item: { id: newId(), text: value, done: false } });
    setText('');
  };

  const done = trip.checklist.filter((c) => c.done).length;
  const ordered = [...trip.checklist.filter((c) => !c.done), ...trip.checklist.filter((c) => c.done)];

  return (
    <View style={{ gap: Spacing.lg }}>
      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <Field placeholder="Add an item (e.g. Sunscreen)" value={text} onChangeText={setText} onSubmitEditing={add} returnKeyType="done" />
        </View>
        <Button title="Add" onPress={add} />
      </View>

      {trip.checklist.length > 0 ? (
        <Txt muted>{done} of {trip.checklist.length} done</Txt>
      ) : (
        <EmptyState icon="checkbox-outline" title="Packing & to-do list" message="Keep track of what to pack and what to book before you go." />
      )}

      <View style={{ gap: Spacing.sm }}>
        {ordered.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => dispatch({ type: 'toggleChecklistItem', tripId: trip.id, itemId: item.id })}
            style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Icon
              name={item.done ? 'checkbox' : 'square-outline'}
              size={24}
              color={item.done ? theme.success : theme.textSecondary}
            />
            <Txt style={[{ flex: 1 }, item.done && { textDecorationLine: 'line-through', opacity: 0.55 }]}>{item.text}</Txt>
            <IconButton
              icon="trash-outline"
              label={`Delete ${item.text}`}
              color={theme.textSecondary}
              onPress={() => dispatch({ type: 'deleteChecklistItem', tripId: trip.id, itemId: item.id })}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
