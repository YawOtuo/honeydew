import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';
import { BottomSheet } from './BottomSheet';

export type SelectOption = { label: string; value: string };
type SelectProps = { label?: string; value: string; onChange: (value: string) => void; options: SelectOption[]; placeholder?: string; emptyMessage?: string; disabled?: boolean };

export function Select({ label, value, onChange, options, placeholder = 'Select an option', emptyMessage = 'No options available.', disabled = false }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return <View style={styles.wrapper}>{label ? <Text style={styles.label}>{label}</Text> : null}<Pressable style={[styles.trigger, open && styles.openTrigger, disabled && styles.disabled]} onPress={() => !disabled && setOpen(true)} accessibilityRole="button"><Text style={[styles.value, !selected && styles.placeholder]}>{selected?.label ?? placeholder}</Text><Ionicons name="chevron-down" size={17} color={colors.slate} /></Pressable><BottomSheet visible={open} onClose={() => setOpen(false)} title={label ?? placeholder} height={360}>{options.length ? options.map((option) => { const isSelected = option.value === value; return <Pressable key={option.value} style={styles.option} onPress={() => { onChange(option.value); setOpen(false); }}><Text style={[styles.optionText, isSelected && styles.selectedText]}>{option.label}</Text>{isSelected ? <Ionicons name="checkmark" size={19} color={colors.forest} /> : null}</Pressable>; }) : <Text style={styles.empty}>{emptyMessage}</Text>}</BottomSheet></View>;
}

const styles = StyleSheet.create({ wrapper: { marginTop: 12 }, label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 7 }, trigger: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.canvas }, openTrigger: { borderColor: colors.forest }, disabled: { opacity: 0.5 }, value: { flex: 1, color: colors.ink, fontSize: 14 }, placeholder: { color: colors.muted }, option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line }, optionText: { flex: 1, color: colors.ink, fontSize: 15 }, selectedText: { color: colors.forest, fontWeight: '800' }, empty: { color: colors.slate, paddingVertical: 20, textAlign: 'center' } });
