import { Dimensions, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { Category, DatePreset, PaymentMethod, TransactionFilters, TransactionSort, User } from '@/api/client';
import { colors } from '@/theme';
import { BottomSheet, Button, Input } from './ui';

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cash', value: 'CASH' },
  { label: 'MoMo', value: 'MOMO' },
  { label: 'Bank', value: 'BANK' },
];

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Any time', value: 'any' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'Last 30 days', value: 'last_30' },
  { label: 'This year', value: 'this_year' },
  { label: 'Custom', value: 'custom' },
];

const SORTS: { label: string; value: TransactionSort }[] = [
  { label: 'Newest first', value: 'date_desc' },
  { label: 'Oldest first', value: 'date_asc' },
  { label: 'Highest amount', value: 'amount_desc' },
  { label: 'Lowest amount', value: 'amount_asc' },
];

const SORT_LABELS: Record<TransactionSort, string> = {
  date_desc: 'Newest first',
  date_asc: 'Oldest first',
  amount_desc: 'Highest amount',
  amount_asc: 'Lowest amount',
};

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  any: 'Any time',
  this_month: 'This month',
  last_month: 'Last month',
  last_30: 'Last 30 days',
  this_year: 'This year',
  custom: 'Custom dates',
};

type FilterDraft = {
  type: 'ALL' | 'INCOME' | 'EXPENSE';
  categoryIds: string[];
  paymentMethods: PaymentMethod[];
  datePreset: DatePreset;
  customFrom: string;
  customTo: string;
  minAmount: string;
  maxAmount: string;
  createdById: string;
  sort: TransactionSort;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  value: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  categories: Category[];
  users?: User[];
  showType?: boolean;
  showSort?: boolean;
};

function presetRange(preset: DatePreset): { from?: string; to?: string } {
  const now = new Date();
  const start = (year: number, month: number, day: number) => new Date(year, month, day, 0, 0, 0, 0);
  const end = (year: number, month: number, day: number) => new Date(year, month, day, 23, 59, 59, 999);
  switch (preset) {
    case 'this_month':
      return { from: start(now.getFullYear(), now.getMonth(), 1).toISOString(), to: end(now.getFullYear(), now.getMonth() + 1, 0).toISOString() };
    case 'last_month':
      return { from: start(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), to: end(now.getFullYear(), now.getMonth(), 0).toISOString() };
    case 'last_30':
      return { from: start(now.getFullYear(), now.getMonth(), now.getDate() - 29).toISOString(), to: end(now.getFullYear(), now.getMonth(), now.getDate()).toISOString() };
    case 'this_year':
      return { from: start(now.getFullYear(), 0, 1).toISOString(), to: end(now.getFullYear(), 11, 31).toISOString() };
    default:
      return {};
  }
}

function parseDateInput(value: string, endOfDay: boolean) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const [, year, month, day] = match;
  const date = endOfDay
    ? new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999)
    : new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toDateInput(iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function toDraft(filters: TransactionFilters): FilterDraft {
  return {
    type: filters.type ?? 'ALL',
    categoryIds: filters.categoryIds ?? [],
    paymentMethods: filters.paymentMethods ?? [],
    datePreset: filters.datePreset ?? 'any',
    customFrom: filters.datePreset === 'custom' ? toDateInput(filters.from) : '',
    customTo: filters.datePreset === 'custom' ? toDateInput(filters.to) : '',
    minAmount: filters.minAmount ?? '',
    maxAmount: filters.maxAmount ?? '',
    createdById: filters.createdById ?? '',
    sort: filters.sort ?? 'date_desc',
  };
}

export function draftToFilters(draft: FilterDraft): TransactionFilters {
  const range = draft.datePreset === 'custom'
    ? { from: parseDateInput(draft.customFrom, false), to: parseDateInput(draft.customTo, true) }
    : presetRange(draft.datePreset);
  const hasDate = Boolean(range.from || range.to);
  return {
    type: draft.type === 'ALL' ? undefined : draft.type,
    categoryIds: draft.categoryIds.length ? draft.categoryIds : undefined,
    paymentMethods: draft.paymentMethods.length ? draft.paymentMethods : undefined,
    from: range.from,
    to: range.to,
    minAmount: draft.minAmount.trim() || undefined,
    maxAmount: draft.maxAmount.trim() || undefined,
    createdById: draft.createdById || undefined,
    sort: draft.sort,
    datePreset: hasDate ? draft.datePreset : undefined,
  };
}

export const EMPTY_FILTERS: TransactionFilters = { sort: 'date_desc' };

export function activeFilterCount(filters: TransactionFilters) {
  let count = 0;
  if (filters.type) count += 1;
  if (filters.datePreset) count += 1;
  count += filters.categoryIds?.length ?? 0;
  count += filters.paymentMethods?.length ?? 0;
  if (filters.minAmount || filters.maxAmount) count += 1;
  if (filters.createdById) count += 1;
  if (filters.sort && filters.sort !== 'date_desc') count += 1;
  return count;
}

export function paymentMethodLabel(value: PaymentMethod | null) {
  return value === 'MOMO' ? 'MoMo' : value === 'BANK' ? 'Bank' : value === 'CASH' ? 'Cash' : 'Not specified';
}

function dateChipLabel(filters: TransactionFilters) {
  if (filters.datePreset === 'custom') {
    const from = filters.from ? new Date(filters.from) : null;
    const to = filters.to ? new Date(filters.to) : null;
    if (from && to) return `${shortDate(from)} – ${shortDate(to)}`;
    if (from) return `From ${shortDate(from)}`;
    if (to) return `Until ${shortDate(to)}`;
    return 'Custom dates';
  }
  return DATE_PRESET_LABELS[filters.datePreset ?? 'any'];
}

function amountChipLabel(filters: TransactionFilters) {
  if (filters.minAmount && filters.maxAmount) return `GH₵ ${filters.minAmount} – ${filters.maxAmount}`;
  if (filters.minAmount) return `≥ GH₵ ${filters.minAmount}`;
  return `≤ GH₵ ${filters.maxAmount}`;
}

function shortDate(date: Date) {
  return date.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TransactionFilterSheet({ visible, onClose, value, onApply, categories, users, showType = true, showSort = true }: Props) {
  const [draft, setDraft] = useState<FilterDraft>(() => toDraft(value));
  const [categorySearch, setCategorySearch] = useState('');
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setDraft(toDraft(value));
      setCategorySearch('');
    }
  }

  const typeCategories = useMemo(
    () => (draft.type === 'ALL' ? categories : categories.filter((category) => category.type === draft.type)),
    [categories, draft.type],
  );

  const visibleCategories = useMemo(() => {
    const query = categorySearch.trim().toLocaleLowerCase();
    if (!query) return typeCategories;
    return typeCategories.filter((category) => category.name.toLocaleLowerCase().includes(query));
  }, [typeCategories, categorySearch]);

  function changeType(type: 'ALL' | 'INCOME' | 'EXPENSE') {
    setDraft((current) => {
      if (type === 'ALL') return { ...current, type };
      const allowed = new Set(categories.filter((category) => category.type === type).map((category) => category.id));
      return { ...current, type, categoryIds: current.categoryIds.filter((id) => allowed.has(id)) };
    });
  }

  function toggleCategory(id: string) {
    setDraft((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id) ? current.categoryIds.filter((item) => item !== id) : [...current.categoryIds, id],
    }));
  }

  function togglePayment(value: PaymentMethod) {
    setDraft((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.includes(value) ? current.paymentMethods.filter((item) => item !== value) : [...current.paymentMethods, value],
    }));
  }

  function apply() {
    onApply(draftToFilters(draft));
    onClose();
  }

  function reset() {
    setDraft(toDraft(EMPTY_FILTERS));
    setCategorySearch('');
  }

  const footer = (
    <View style={styles.footer}>
      <Pressable style={styles.reset} onPress={reset} accessibilityRole="button">
        <Text style={styles.resetText}>Reset</Text>
      </Pressable>
      <Button style={styles.apply} onPress={apply}>Apply filters</Button>
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter transactions" height={Math.round(Dimensions.get('window').height * 0.9)} footer={footer}>
      <View style={styles.content}>
        {showType ? (
          <Section title="Type">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((option) => (
              <Chip key={option} label={option === 'ALL' ? 'All' : option === 'INCOME' ? 'Income' : 'Expense'} active={draft.type === option} onPress={() => changeType(option)} />
            ))}
          </Section>
        ) : null}

        <Section title="Category">
          {draft.categoryIds.length ? (
            <Pressable onPress={() => setDraft((current) => ({ ...current, categoryIds: [] }))} hitSlop={6}>
              <Text style={styles.clearInline}>Clear {draft.categoryIds.length}</Text>
            </Pressable>
          ) : null}
        </Section>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.slate} />
          <TextInput value={categorySearch} onChangeText={setCategorySearch} placeholder="Search categories" placeholderTextColor={colors.muted} style={styles.searchInput} />
          {categorySearch ? (
            <Pressable onPress={() => setCategorySearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.chips}>
          {visibleCategories.length ? visibleCategories.map((category) => (
            <Chip key={category.id} label={draft.type === 'ALL' ? categoryLabel(category) : category.name} active={draft.categoryIds.includes(category.id)} onPress={() => toggleCategory(category.id)} />
          )) : <Text style={styles.empty}>{categorySearch.trim() ? 'No categories match your search.' : 'No categories available.'}</Text>}
        </View>

        <Section title="Date">
          {DATE_PRESETS.map((preset) => (
            <Chip key={preset.value} label={preset.label} active={draft.datePreset === preset.value} onPress={() => setDraft((current) => ({ ...current, datePreset: preset.value }))} />
          ))}
        </Section>
        {draft.datePreset === 'custom' ? (
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Input label="From" placeholder="YYYY-MM-DD" value={draft.customFrom} onChangeText={(text) => setDraft((current) => ({ ...current, customFrom: text }))} />
            </View>
            <View style={styles.dateField}>
              <Input label="To" placeholder="YYYY-MM-DD" value={draft.customTo} onChangeText={(text) => setDraft((current) => ({ ...current, customTo: text }))} />
            </View>
          </View>
        ) : null}

        <Section title="Payment method">
          {PAYMENT_METHODS.map((method) => (
            <Chip key={method.value} label={method.label} active={draft.paymentMethods.includes(method.value)} onPress={() => togglePayment(method.value)} />
          ))}
        </Section>

        <Section title="Amount range" />
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Input label="Minimum" placeholder="0.00" keyboardType="decimal-pad" value={draft.minAmount} onChangeText={(text) => setDraft((current) => ({ ...current, minAmount: text }))} />
          </View>
          <View style={styles.dateField}>
            <Input label="Maximum" placeholder="0.00" keyboardType="decimal-pad" value={draft.maxAmount} onChangeText={(text) => setDraft((current) => ({ ...current, maxAmount: text }))} />
          </View>
        </View>

        {users?.length ? (
          <>
            <Section title="Recorded by" />
            <View style={styles.chips}>
              <Chip label="Anyone" active={!draft.createdById} onPress={() => setDraft((current) => ({ ...current, createdById: '' }))} />
              {users.map((user) => (
                <Chip key={user.id} label={nameFromEmail(user.email)} active={draft.createdById === user.id} onPress={() => setDraft((current) => ({ ...current, createdById: user.id }))} />
              ))}
            </View>
          </>
        ) : null}

        {showSort ? (
          <>
            <Section title="Sort by" />
            <View style={styles.chips}>
              {SORTS.map((sort) => (
                <Chip key={sort.value} label={sort.label} active={draft.sort === sort.value} onPress={() => setDraft((current) => ({ ...current, sort: sort.value }))} />
              ))}
            </View>
          </>
        ) : null}
      </View>
    </BottomSheet>
  );
}

export function ActiveFilterChips({
  filters,
  onChange,
  categoryNames,
  userNames,
  showType = true,
  showSort = true,
  onClearAll,
}: {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  categoryNames: Map<string, string>;
  userNames: Map<string, string>;
  showType?: boolean;
  showSort?: boolean;
  onClearAll?: () => void;
}) {
  if (!activeFilterCount(filters)) return null;
  return (
    <View style={styles.activeFilters}>
      {showType && filters.type ? (
        <ActiveChip label={filters.type === 'INCOME' ? 'Income' : 'Expense'} onRemove={() => onChange({ ...filters, type: undefined })} />
      ) : null}
      {filters.datePreset ? (
        <ActiveChip label={dateChipLabel(filters)} onRemove={() => onChange({ ...filters, from: undefined, to: undefined, datePreset: undefined })} />
      ) : null}
      {(filters.categoryIds ?? []).map((id) => (
        <ActiveChip
          key={id}
          label={categoryNames.get(id) ?? 'Category'}
          onRemove={() => onChange({ ...filters, categoryIds: filters.categoryIds?.filter((item) => item !== id) })}
        />
      ))}
      {(filters.paymentMethods ?? []).map((method) => (
        <ActiveChip
          key={method}
          label={paymentMethodLabel(method)}
          onRemove={() => onChange({ ...filters, paymentMethods: filters.paymentMethods?.filter((item) => item !== method) })}
        />
      ))}
      {filters.minAmount || filters.maxAmount ? (
        <ActiveChip label={amountChipLabel(filters)} onRemove={() => onChange({ ...filters, minAmount: undefined, maxAmount: undefined })} />
      ) : null}
      {filters.createdById ? (
        <ActiveChip label={userNames.get(filters.createdById) ?? 'Recorded by'} onRemove={() => onChange({ ...filters, createdById: undefined })} />
      ) : null}
      {showSort && filters.sort && filters.sort !== 'date_desc' ? (
        <ActiveChip label={SORT_LABELS[filters.sort]} onRemove={() => onChange({ ...filters, sort: 'date_desc' })} />
      ) : null}
      <TouchableOpacity onPress={onClearAll ?? (() => onChange(EMPTY_FILTERS))}>
        <Text style={styles.clearAll}>Clear all</Text>
      </TouchableOpacity>
    </View>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <TouchableOpacity style={styles.activeChip} onPress={onRemove}>
      <Text style={styles.activeChipText}>{label}</Text>
      <Ionicons name="close" size={13} color={colors.forest} />
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children ? <View style={styles.chips}>{children}</View> : null}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function categoryLabel(category: Category) {
  return `${category.name} · ${category.type === 'INCOME' ? 'Income' : 'Expense'}`;
}

function nameFromEmail(email: string) {
  const prefix = email.split('@')[0] ?? email;
  return prefix.split(/[._-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || email;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 8 },
  section: { marginTop: 22 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.forest },
  chipText: { color: colors.slate, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: colors.surface },
  clearInline: { color: colors.forest, fontSize: 12, fontWeight: '800' },
  searchBox: { height: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginTop: 10 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14, marginLeft: 8 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  empty: { color: colors.slate, fontSize: 13, paddingVertical: 8 },
  footer: { flexDirection: 'row', gap: 10 },
  reset: { minHeight: 52, paddingHorizontal: 22, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  resetText: { color: colors.slate, fontSize: 14, fontWeight: '800' },
  apply: { flex: 1 },
  activeFilters: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.incomeSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  activeChipText: { color: colors.forest, fontSize: 11, fontWeight: '800' },
  clearAll: { color: colors.expense, fontSize: 11, fontWeight: '800' },
});
