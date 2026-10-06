import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const theme = useTheme();
  return <Ionicons name={name as IconName} size={size} color={color ?? theme.text} />;
}

type TxtProps = TextProps & {
  variant?: 'title' | 'heading' | 'body' | 'label' | 'caption';
  muted?: boolean;
  color?: string;
};

export function Txt({ variant = 'body', muted, color, style, ...rest }: TxtProps) {
  const theme = useTheme();
  return (
    <Text
      style={[styles[variant], { color: color ?? (muted ? theme.textSecondary : theme.text) }, style]}
      {...rest}
    />
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const theme = useTheme();
  const base = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, icon, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const theme = useTheme();
  const bg =
    variant === 'primary' ? theme.primary : variant === 'danger' ? theme.danger : variant === 'secondary' ? theme.chip : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? theme.primaryText : variant === 'ghost' ? theme.primary : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color, label }: { icon: string; onPress: () => void; color?: string; label: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={22} color={color} />
    </Pressable>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      {label ? <Txt variant="label" muted>{label}</Txt> : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
          props.multiline && { minHeight: 96, textAlignVertical: 'top' },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  color,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  color?: string;
}) {
  const theme = useTheme();
  const active = color ?? theme.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? active : theme.chip, borderColor: selected ? active : theme.border },
      ]}>
      {icon ? <Icon name={icon} size={14} color={selected ? '#fff' : theme.text} /> : null}
      <Text style={[styles.chipText, { color: selected ? '#fff' : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: string; title: string; message: string; action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.chip }]}>
        <Icon name={icon} size={32} color={theme.primary} />
      </View>
      <Txt variant="heading" style={{ textAlign: 'center' }}>{title}</Txt>
      <Txt muted style={{ textAlign: 'center' }}>{message}</Txt>
      {action}
    </View>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Txt variant="heading">{title}</Txt>
      {right}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  heading: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18, textTransform: 'uppercase', letterSpacing: 0.4 },
  caption: { fontSize: 13, lineHeight: 18 },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  button: {
    minHeight: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  iconButton: { padding: Spacing.xs },
  field: { gap: Spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', gap: Spacing.md, padding: Spacing.xxl },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
