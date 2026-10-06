import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, Icon, SectionHeader, Txt } from '@/components/ui';
import { ExpenseCategories, Radius, Spacing } from '@/constants/theme';
import { formatShort } from '@/lib/dates';
import { balances, formatMoney, settleUp, totalSpent } from '@/lib/money';
import type { ExpenseCategory, Trip } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';

export function BudgetTab({ trip }: { trip: Trip }) {
  const theme = useTheme();
  const spent = totalSpent(trip.expenses);
  const money = (n: number) => formatMoney(n, trip.currency);
  const pct = trip.budget > 0 ? Math.min(1, spent / trip.budget) : 0;
  const over = trip.budget > 0 && spent > trip.budget;

  const byCategory = Object.entries(
    trip.expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]) as [ExpenseCategory, number][];

  const settlements = trip.travelers.length > 1 ? settleUp(balances(trip)) : [];
  const expenses = [...trip.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const addExpense = () => router.push({ pathname: '/expense/edit', params: { tripId: trip.id } });

  return (
    <View style={{ gap: Spacing.xl }}>
      <Card style={{ gap: Spacing.sm }}>
        <Txt muted>Total spent</Txt>
        <Txt variant="title">{money(spent)}</Txt>
        {trip.budget > 0 ? (
          <>
            <View style={[styles.track, { backgroundColor: theme.chip }]}>
              <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: over ? theme.danger : theme.primary }]} />
            </View>
            <Txt variant="caption" color={over ? theme.danger : theme.textSecondary}>
              {over
                ? `${money(spent - trip.budget)} over your ${money(trip.budget)} budget`
                : `${money(trip.budget - spent)} left of ${money(trip.budget)}`}
            </Txt>
          </>
        ) : (
          <Txt variant="caption" muted>Set a budget from Edit trip to track how much is left.</Txt>
        )}
        {trip.travelers.length > 1 && spent > 0 ? (
          <Txt variant="caption" muted>≈ {money(spent / trip.travelers.length)} per person</Txt>
        ) : null}
      </Card>

      <Button title="Add expense" icon="add" onPress={addExpense} />

      {byCategory.length > 0 ? (
        <View>
          <SectionHeader title="By category" />
          <Card style={{ gap: Spacing.md }}>
            {byCategory.map(([cat, amount]) => {
              const meta = ExpenseCategories[cat];
              return (
                <View key={cat} style={{ gap: 4 }}>
                  <View style={styles.between}>
                    <View style={styles.inline}>
                      <Icon name={meta.icon} size={16} color={meta.color} />
                      <Txt>{meta.label}</Txt>
                    </View>
                    <Txt style={{ fontWeight: '700' }}>{money(amount)}</Txt>
                  </View>
                  <View style={[styles.track, { backgroundColor: theme.chip, height: 6 }]}>
                    <View style={[styles.fill, { width: `${(amount / spent) * 100}%`, backgroundColor: meta.color }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}

      {trip.travelers.length > 1 && trip.expenses.length > 0 ? (
        <View>
          <SectionHeader title="Settle up" />
          <Card style={{ gap: Spacing.sm }}>
            {settlements.length === 0 ? (
              <Txt muted>Everyone is settled up 🎉</Txt>
            ) : (
              settlements.map((s, i) => (
                <View key={i} style={styles.between}>
                  <Txt style={{ flex: 1 }}>
                    <Txt style={{ fontWeight: '700' }}>{s.from}</Txt> pays <Txt style={{ fontWeight: '700' }}>{s.to}</Txt>
                  </Txt>
                  <Txt style={{ fontWeight: '700' }} color={theme.primary}>{money(s.amount)}</Txt>
                </View>
              ))
            )}
          </Card>
        </View>
      ) : null}

      <View>
        <SectionHeader title={`Expenses (${trip.expenses.length})`} />
        {expenses.length === 0 ? (
          <EmptyState icon="receipt-outline" title="No expenses yet" message="Log hotels, food, tickets and more. Split costs with your travel buddies." />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {expenses.map((e) => {
              const meta = ExpenseCategories[e.category];
              return (
                <Pressable
                  key={e.id}
                  onPress={() => router.push({ pathname: '/expense/edit', params: { tripId: trip.id, expenseId: e.id } })}
                  style={({ pressed }) => [
                    styles.expense,
                    { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <View style={[styles.catIcon, { backgroundColor: meta.color }]}>
                    <Icon name={meta.icon} size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontWeight: '700' }} numberOfLines={1}>{e.title}</Txt>
                    <Txt variant="caption" muted numberOfLines={1}>
                      {formatShort(e.date)}
                      {trip.travelers.length > 1 ? ` · paid by ${e.paidBy}` : ''}
                    </Txt>
                  </View>
                  <Txt style={{ fontWeight: '800' }}>{money(e.amount)}</Txt>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  expense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  catIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
