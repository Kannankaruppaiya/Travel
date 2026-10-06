import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Field, SectionHeader, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { confirmDelete, notify } from '@/lib/confirm';
import { CURRENCIES } from '@/lib/money';
import { useSyncedState } from '@/hooks/use-synced-state';
import { useTheme } from '@/hooks/use-theme';
import { initialData, parseBackup } from '@/store/reducer';
import { useStore } from '@/store/trips-store';

export default function SettingsScreen() {
  const theme = useTheme();
  const { data, dispatch } = useStore();
  const [name, setName] = useSyncedState(data.settings.userName);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const totalPlaces = data.trips.reduce((n, t) => n + t.places.length, 0);

  const exportBackup = () =>
    Share.share({ title: 'PowPow Trips backup', message: JSON.stringify(data) });

  const importBackup = () => {
    try {
      const parsed = parseBackup(JSON.parse(importText));
      dispatch({ type: 'replaceAll', data: parsed });
      setImportText('');
      setShowImport(false);
      notify('Backup restored', `${parsed.trips.length} trips imported.`);
    } catch (e) {
      notify('Could not import', e instanceof Error ? e.message : 'The text is not a valid backup.');
    }
  };

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.profile}>
        <Image source={require('@/assets/images/logo-mark.png')} style={styles.mark} contentFit="contain" />
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{data.settings.userName}</Txt>
          <Txt variant="caption" muted>
            {data.trips.length} trips · {totalPlaces} places saved
          </Txt>
        </View>
      </Card>

      <View style={{ gap: Spacing.md }}>
        <SectionHeader title="Profile" />
        <Field
          label="Your name"
          value={name}
          onChangeText={setName}
          onBlur={() => name.trim() && dispatch({ type: 'updateSettings', patch: { userName: name.trim() } })}
        />
        <View style={{ gap: Spacing.xs }}>
          <Txt variant="label" muted>Default currency for new trips</Txt>
          <View style={styles.wrap}>
            {CURRENCIES.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={data.settings.defaultCurrency === c}
                onPress={() => dispatch({ type: 'updateSettings', patch: { defaultCurrency: c } })}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={{ gap: Spacing.md }}>
        <SectionHeader title="Backup & restore" />
        <Txt muted>
          Your trips are saved on this phone. Export a backup regularly (for example to WhatsApp or email to yourself) so you never lose
          your plans.
        </Txt>
        <Button title="Export backup" icon="cloud-upload-outline" variant="secondary" onPress={exportBackup} />
        <Button
          title={showImport ? 'Cancel import' : 'Import backup'}
          icon="cloud-download-outline"
          variant="secondary"
          onPress={() => setShowImport((s) => !s)}
        />
        {showImport ? (
          <>
            <Field multiline placeholder="Paste the backup text here" value={importText} onChangeText={setImportText} autoCapitalize="none" />
            <Txt variant="caption" color={theme.danger}>Importing replaces all trips currently on this phone.</Txt>
            <Button title="Restore from backup" icon="refresh" onPress={importBackup} disabled={!importText.trim()} />
          </>
        ) : null}
      </View>

      <View style={{ gap: Spacing.md }}>
        <SectionHeader title="Danger zone" />
        <Button
          title="Delete all data"
          icon="trash-outline"
          variant="danger"
          onPress={() =>
            confirmDelete('Delete everything?', 'All trips, places and expenses on this phone will be erased.', () =>
              dispatch({ type: 'replaceAll', data: { ...initialData, settings: data.settings } }),
            )
          }
        />
      </View>

      <View style={styles.about}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <Txt variant="caption" muted>Version {Constants.expoConfig?.version ?? '1.0.0'}</Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 60 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mark: { width: 64, height: 38 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  about: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  logo: { width: 160, height: 155 },
});
