import { ScrollView, View } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export function CategoryPicker<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<K, { label: string; icon: string; color: string }>;
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <View style={{ gap: Spacing.xs }}>
      <Txt variant="label" muted>{label}</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
        {(Object.keys(options) as K[]).map((key) => (
          <Chip
            key={key}
            label={options[key].label}
            icon={options[key].icon}
            color={options[key].color}
            selected={value === key}
            onPress={() => onChange(key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
