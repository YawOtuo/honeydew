import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme';
import { BottomSheet } from './BottomSheet';

export type SelectOption = { label: string; value: string };
type SelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  options: SelectOption[];
  disabled?: boolean;
  searchable?: boolean;
};

export function Select({ label, value, onChange, placeholder = 'Choose an option', emptyMessage = 'No options available.', options, disabled, searchable }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? options.filter((option) => option.label.toLocaleLowerCase().includes(query)) : options;
  }, [options, search]);

  function close() {
    setOpen(false);
    setSearch('');
  }

  return <>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <Pressable disabled={disabled} onPress={() => setOpen(true)} style={[styles.control, disabled && styles.disabled]}>
      <Text style={[styles.value, !selected && styles.placeholder]}>{selected?.label ?? placeholder}</Text>
      <Ionicons name="chevron-down" size={18} color={colors.slate} />
    </Pressable>
    <BottomSheet visible={open} onClose={close} title={label ?? 'Choose an option'} height={Math.round(Dimensions.get('window').height * 0.7)}>
      {searchable ? <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color={colors.slate} />
        <TextInput autoFocus value={search} onChangeText={setSearch} placeholder="Search categories" placeholderTextColor={colors.muted} style={styles.searchInput} />
        {search ? <Pressable onPress={() => setSearch('')} hitSlop={8}><Ionicons name="close-circle" size={19} color={colors.muted} /></Pressable> : null}
      </View> : null}
      {filteredOptions.length ? filteredOptions.map((option) => <Pressable key={option.value} onPress={() => { onChange(option.value); close(); }} style={styles.option}>
        <Text style={[styles.optionText, option.value === value && styles.selected]}>{option.label}</Text>
        {option.value === value ? <Ionicons name="checkmark" size={20} color={colors.forest} /> : null}
      </Pressable>) : <Text style={styles.empty}>{search ? 'No categories match your search.' : emptyMessage}</Text>}
    </BottomSheet>
  </>;
}

const styles = StyleSheet.create({
  label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  control: { minHeight: 52, backgroundColor: colors.surface, borderRadius: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  disabled: { opacity: 0.55 },
  value: { flex: 1, color: colors.ink, fontSize: 14 },
  placeholder: { color: colors.muted },
  searchBox: { height: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: colors.surface },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14, marginLeft: 8 },
  option: { minHeight: 50, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center' },
  optionText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '600' },
  selected: { color: colors.forest, fontWeight: '800' },
  empty: { color: colors.slate, textAlign: 'center', paddingVertical: 28 },
});
