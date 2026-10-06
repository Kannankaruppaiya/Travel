import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, EmptyState, Field, Icon, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { DESTINATIONS } from '@/lib/destinations';
import { useTheme } from '@/hooks/use-theme';

const ALL_TAGS = [...new Set(DESTINATIONS.flatMap((d) => d.tags))].sort();

export default function ExploreScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DESTINATIONS.filter(
      (d) =>
        (!tag || d.tags.includes(tag)) &&
        (!q || d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }, [query, tag]);

  const plan = (destination: string) => router.push({ pathname: '/trip/new', params: { destination } });

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Txt variant="title">Get inspired</Txt>
      <Field placeholder="Search destinations or themes (beach, hills…)" value={query} onChangeText={setQuery} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
        <Chip label="All" selected={tag == null} onPress={() => setTag(null)} />
        {ALL_TAGS.map((t) => (
          <Chip key={t} label={t} selected={tag === t} onPress={() => setTag(tag === t ? null : t)} />
        ))}
      </ScrollView>

      {results.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title="No matches"
          message={query.trim() ? `You can still plan a trip to "${query.trim()}".` : 'Try a different filter.'}
          action={query.trim() ? <Button title={`Plan a trip to ${query.trim()}`} icon="airplane" onPress={() => plan(query.trim())} /> : undefined}
        />
      ) : (
        results.map((d) => (
          <Card key={d.name} style={{ padding: 0, overflow: 'hidden' }}>
            <View style={[styles.banner, { backgroundColor: d.color }]}>
              <Txt variant="heading" color="#fff">{d.name}</Txt>
              <Txt variant="caption" color="rgba(255,255,255,0.9)">{d.region}</Txt>
            </View>
            <View style={styles.body}>
              <Txt>{d.blurb}</Txt>
              <View style={styles.meta}>
                <View style={styles.inline}>
                  <Icon name="sunny-outline" size={16} color={theme.primary} />
                  <Txt variant="caption" muted>Best: {d.bestTime}</Txt>
                </View>
                <View style={styles.inline}>
                  <Icon name="time-outline" size={16} color={theme.primary} />
                  <Txt variant="caption" muted>{d.idealDays}</Txt>
                </View>
              </View>
              <View style={styles.tags}>
                {d.tags.map((t) => (
                  <Chip key={t} label={t} onPress={() => setTag(t)} />
                ))}
              </View>
              <Button title="Plan a trip here" icon="airplane" onPress={() => plan(d.name)} />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  banner: { padding: Spacing.lg, gap: 2 },
  body: { padding: Spacing.lg, gap: Spacing.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
