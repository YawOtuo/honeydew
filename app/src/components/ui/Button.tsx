import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { colors } from '@/theme';

type ButtonProps = {
  children: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ children, onPress, loading = false, disabled = false, style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color={colors.forestDark} /> : <Text style={styles.text}>{children}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 14, backgroundColor: colors.honey, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.6 },
  text: { color: colors.forestDark, fontSize: 15, fontWeight: '800' },
});
