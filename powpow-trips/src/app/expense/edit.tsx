import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, Chip, EmptyState, Field, Txt } from '@/components/ui';
import { ExpenseCategories, Spacing } from '@/constants/theme';
import { CategoryPicker } from '@/features/trip/category-picker';
import { confirmDelete, notify } from '@/lib/confirm';
import { todayISO } from '@/lib/dates';
import type { ExpenseCategory } from '@/lib/types';
import { newId, useStore, useTrip } from '@/store/trips-store';

export default function ExpenseScreen() {
  const { tripId, expenseId } = useLocalSearchParams<{ tripId: string; expenseId?: string }>();
  const trip = useTrip(tripId);
  const existing = trip?.expenses.find((e) => e.id === expenseId);
  const { dispatch } = useStore();

  const travelers = trip?.travelers.length ? trip.travelers : ['Me'];
  const defaultDate =
    trip && todayISO() >= trip.startDate && todayISO() <= trip.endDate ? todayISO() : (trip?.startDate ?? todayISO());

  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? 'food');
  const [paidBy, setPaidBy] = useState(existing?.paidBy ?? travelers[0]);
  const [splitWith, setSplitWith] = useState<string[]>(existing?.splitWith.length ? existing.splitWith : travelers);
  const [date, setDate] = useState(existing?.date ?? defaultDate);

  if (!trip) return <EmptyState icon="alert-circle-outline" title="Trip not found" message="It may have been deleted." />;

  const toggleSplit = (name: string) =>
    setSplitWith((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));

  const save = () => {
    const value = Number(amount.replace(/,/g, ''));
    if (!value || value <= 0) {
      notify('Enter an amount', 'The amount must be more than zero.');
      return;
    }
    if (splitWith.length === 0) {
      notify('Who is sharing?', 'Pick at least one person to split this expense with.');
      return;
    }
    const fields = {
      title: title.trim() || ExpenseCategories[category].label,
      amount: value,
      category,
      paidBy,
      // Store "everyone" as an empty list so new travellers are included automatically.
      splitWith: splitWith.length === travelers.length ? [] : splitWith,
      date,
    };
    if (existing) {
      dispatch({ type: 'updateExpense', tripId: trip.id, expenseId: existing.id, patch: fields });
    } else {
      dispatch({ type: 'addExpense', tripId: trip.id, expense: { id: newId(), createdAt: Date.now(), ...fields } });
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existing ? 'Edit expense' : 'Add expense' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label={`Amount (${trip.currency})`}
          placeholder="0"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          autoFocus={!existing}
          style={{ fontSize: 28, fontWeight: '700' }}
        />
        <Field label="Description" placeholder="Dinner at the beach shack" value={title} onChangeText={setTitle} />
        <CategoryPicker label="Category" options={ExpenseCategories} value={category} onChange={setCategory} />
        <DateField label="Date" value={date} onChange={setDate} />

        {travelers.length > 1 ? (
          <>
            <View style={{ gap: Spacing.xs }}>
              <Txt variant="label" muted>Paid by</Txt>
              <View style={styles.wrap}>
                {travelers.map((t) => (
                  <Chip key={t} label={t} selected={paidBy === t} onPress={() => setPaidBy(t)} />
                ))}
              </View>
            </View>
            <View style={{ gap: Spacing.xs }}>
              <Txt variant="label" muted>Split between</Txt>
              <View style={styles.wrap}>
                {travelers.map((t) => (
                  <Chip key={t} label={t} icon={splitWith.includes(t) ? 'checkmark' : undefined} selected={splitWith.includes(t)} onPress={() => toggleSplit(t)} />
                ))}
              </View>
            </View>
          </>
        ) : null}

        <Button title={existing ? 'Save changes' : 'Add expense'} icon="checkmark" onPress={save} />
        {existing ? (
          <Button
            title="Delete expense"
            icon="trash-outline"
            variant="ghost"
            onPress={() =>
              confirmDelete('Delete expense?', `"${existing.title}" will be removed.`, () => {
                router.back();
                dispatch({ type: 'deleteExpense', tripId: trip.id, expenseId: existing.id });
              })
            }
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 60 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
