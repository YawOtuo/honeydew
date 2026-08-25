import { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '@/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
};

export function Input({ label, error, rightElement, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <TextInput {...props} style={[styles.input, style]} placeholderTextColor={props.placeholderTextColor ?? colors.muted} />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 12 },
  label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 7 },
  inputWrapper: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 13, flexDirection: 'row', alignItems: 'center' },
  inputError: { borderColor: colors.expense },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 14, color: colors.ink, fontSize: 14 },
  rightElement: { paddingRight: 6 },
  error: { color: colors.expense, fontSize: 12, lineHeight: 17, marginTop: 6 },
});
