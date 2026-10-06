import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, Chip, Field, Icon, IconButton, Row, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addDays, todayISO } from '@/lib/dates';
import { CURRENCIES } from '@/lib/money';
import { notify } from '@/lib/confirm';
import { useTheme } from '@/hooks/use-theme';

export type TripFormValues = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  currency: string;
  budget: number;
  travelers: string[];
};

export function defaultTripValues(userName: string, currency: string): TripFormValues {
  const start = addDays(todayISO(), 14);
  return {
    title: '',
    destination: '',
    startDate: start,
    endDate: addDays(start, 3),
    currency,
    budget: 0,
    travelers: [userName || 'Me'],
  };
}

type Props = {
  initial: TripFormValues;
  submitLabel: string;
  onSubmit: (values: TripFormValues) => void;
  /** Travellers who already appear in expenses and so can't be removed. */
  lockedTravelers?: string[];
};

export function TripForm({ initial, submitLabel, onSubmit, lockedTravelers = [] }: Props) {
  const theme = useTheme();
  const [v, setV] = useState(initial);
  const [budgetText, setBudgetText] = useState(initial.budget ? String(initial.budget) : '');
  const [newTraveler, setNewTraveler] = useState('');

  const set = <K extends keyof TripFormValues>(key: K, value: TripFormValues[K]) => setV((s) => ({ ...s, [key]: value }));

  const addTraveler = () => {
    const name = newTraveler.trim();
    if (!name) return;
    if (v.travelers.some((t) => t.toLowerCase() === name.toLowerCase())) {
      notify('Already added', `${name} is already on this trip.`);
      return;
    }
    set('travelers', [...v.travelers, name]);
    setNewTraveler('');
  };

  const submit = () => {
    const destination = v.destination.trim();
    if (!destination) {
      notify('Where are you going?', 'Please enter a destination.');
      return;
    }
    const budget = Number(budgetText.replace(/,/g, '')) || 0;
    onSubmit({
      ...v,
      destination,
      title: v.title.trim() || `Trip to ${destination}`,
      budget: Math.max(0, budget),
      travelers: v.travelers.length > 0 ? v.travelers : ['Me'],
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="Destination"
          placeholder="e.g. Goa, Bali, Paris"
          value={v.destination}
          onChangeText={(t) => set('destination', t)}
          autoFocus={!initial.destination}
        />
        <Field
          label="Trip name (optional)"
          placeholder={v.destination ? `Trip to ${v.destination}` : 'Summer escape'}
          value={v.title}
          onChangeText={(t) => set('title', t)}
        />
        <DateField
          label="Start date"
          value={v.startDate}
          onChange={(d) => setV((s) => ({ ...s, startDate: d, endDate: s.endDate < d ? d : s.endDate }))}
        />
        <DateField label="End date" value={v.endDate} minimumDate={v.startDate} onChange={(d) => set('endDate', d)} />

        <View style={{ gap: Spacing.xs }}>
          <Txt variant="label" muted>Currency</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            {CURRENCIES.map((c) => (
              <Chip key={c} label={c} selected={v.currency === c} onPress={() => set('currency', c)} />
            ))}
          </ScrollView>
        </View>
        <Field
          label="Budget (optional)"
          placeholder="0"
          keyboardType="decimal-pad"
          value={budgetText}
          onChangeText={setBudgetText}
        />

        <View style={{ gap: Spacing.sm }}>
          <Txt variant="label" muted>Travellers</Txt>
          {v.travelers.map((name) => {
            const locked = lockedTravelers.includes(name);
            return (
              <Row key={name} style={[styles.traveler, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Icon name="person-circle-outline" color={theme.primary} />
                <Txt style={{ flex: 1 }}>{name}</Txt>
                {!locked && v.travelers.length > 1 ? (
                  <IconButton
                    icon="close-circle"
                    label={`Remove ${name}`}
                    color={theme.textSecondary}
                    onPress={() => set('travelers', v.travelers.filter((t) => t !== name))}
                  />
                ) : null}
              </Row>
            );
          })}
          <Row>
            <View style={{ flex: 1 }}>
              <Field placeholder="Add a friend's name" value={newTraveler} onChangeText={setNewTraveler} onSubmitEditing={addTraveler} returnKeyType="done" />
            </View>
            <Button title="Add" variant="secondary" onPress={addTraveler} />
          </Row>
        </View>

        <Button title={submitLabel} icon="checkmark" onPress={submit} style={{ marginTop: Spacing.md }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 60 },
  traveler: { borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
});
