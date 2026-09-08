import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { createCategory, setCategoryActive, updateCategory, type Category } from '@/api/client';
import { queryKeys, useManagedCategoriesQuery } from '@/api/queries';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, Skeleton, useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

type CategoryType = 'INCOME' | 'EXPENSE';

export default function AdminCategoriesScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const categoriesQuery = useManagedCategoriesQuery(token, isAdmin);
  const [type, setType] = useState<CategoryType>('INCOME');
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const categories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (categoriesQuery.data ?? []).filter((item) => item.type === type && (!query || item.name.toLowerCase().includes(query)));
  }, [categoriesQuery.data, search, type]);

  async function refresh() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.categories }), queryClient.invalidateQueries({ queryKey: queryKeys.managedCategories }), queryClient.invalidateQueries({ queryKey: queryKeys.categoryReport })]);
  }
  const saveMutation = useMutation({
    mutationFn: () => editing ? updateCategory(token!, editing.id, { name: name.trim() }) : createCategory(token!, { name: name.trim(), type }),
    onSuccess: async () => { await refresh(); showToast(editing ? 'Category renamed.' : 'Category created.'); setName(''); setEditing(null); setError(''); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Unable to save category.'),
  });
  const statusMutation = useMutation({
    mutationFn: ({ category, active }: { category: Category; active: boolean }) => setCategoryActive(token!, category.id, active),
    onSuccess: async (category) => { await refresh(); showToast(category.isActive ? 'Category restored.' : 'Category archived.'); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Unable to update category.'),
  });
  function save() {
    if (!name.trim()) return setError('Enter a category name.');
    if (!editing) return saveMutation.mutate();
    Alert.alert('Rename category?', 'The new name will also appear on historical transactions and reports.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Rename', onPress: () => saveMutation.mutate() }]);
  }
  function changeStatus(category: Category) {
    const active = !category.isActive;
    if (active) return statusMutation.mutate({ category, active });
    Alert.alert('Archive category?', 'It will no longer be available for new transactions. Historical records will be preserved.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Archive', style: 'destructive', onPress: () => statusMutation.mutate({ category, active }) }]);
  }
  function chooseType(nextType: CategoryType) { setType(nextType); setEditing(null); setName(''); setError(''); }

  if (!isAdmin) return <Screen><EmptyState title="Admin access required" description="Only administrators can manage categories." action={<Button onPress={() => router.back()}>Go back</Button>} /></Screen>;
  return <Screen>
    <TouchableOpacity onPress={() => router.back()} style={styles.backRow}><Ionicons name="chevron-back" size={19} color={colors.forest} /><Text style={styles.back}>Back</Text></TouchableOpacity>
    <Text style={styles.title}>Manage categories</Text><Text style={styles.subtitle}>Create and maintain the categories used for school transactions.</Text>
    <Card style={styles.form}>
      <Text style={styles.formTitle}>{editing ? 'Rename category' : 'Add category'}</Text>
      {!editing ? <TypeSwitch type={type} onChange={chooseType} /> : <Text style={styles.editingType}>{editing.type === 'INCOME' ? 'Income' : 'Expense'} category</Text>}
      <TextInput value={name} onChangeText={setName} maxLength={100} placeholder="Category name" placeholderTextColor={colors.muted} style={styles.input} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.formActions}>{editing ? <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => { setEditing(null); setName(''); }}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity> : null}<Button style={styles.actionButton} loading={saveMutation.isPending} onPress={save}>{editing ? 'Rename' : 'Add category'}</Button></View>
    </Card>
    <View style={styles.listHeader}><Text style={styles.section}>Categories</Text><Text style={styles.count}>{categories.length}</Text></View>
    <TypeSwitch type={type} onChange={chooseType} />
    <View style={styles.searchBox}><Ionicons name="search-outline" size={19} color={colors.slate} /><TextInput value={search} onChangeText={setSearch} placeholder="Search categories" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
    {categoriesQuery.isLoading ? <><Skeleton height={62} /><Skeleton height={62} /></> : null}
    {categoriesQuery.isError ? <EmptyState title="Unable to load categories" description="Check your connection and try again." action={<Button onPress={() => void categoriesQuery.refetch()}>Retry</Button>} /> : null}
    {!categoriesQuery.isLoading && !categoriesQuery.isError && !categories.length ? <EmptyState title="No categories found" description={search ? 'Try another search.' : 'Add a category above.'} /> : null}
    {categories.map((category) => <Card key={category.id} style={{ ...styles.category, ...(!category.isActive ? styles.archived : {}) }}>
      <View style={styles.categoryInfo}><Text style={styles.categoryName}>{category.name}</Text><Text style={[styles.status, category.isActive ? styles.activeText : styles.archivedText]}>{category.isActive ? 'Active' : 'Archived'}</Text></View>
      <TouchableOpacity accessibilityLabel={`Rename ${category.name}`} onPress={() => { setEditing(category); setName(category.name); setError(''); }} style={styles.iconButton}><Ionicons name="pencil-outline" size={19} color={colors.forest} /></TouchableOpacity>
      <TouchableOpacity accessibilityLabel={`${category.isActive ? 'Archive' : 'Restore'} ${category.name}`} disabled={statusMutation.isPending} onPress={() => changeStatus(category)} style={styles.iconButton}><Ionicons name={category.isActive ? 'archive-outline' : 'refresh-outline'} size={19} color={category.isActive ? colors.expense : colors.forest} /></TouchableOpacity>
    </Card>)}
  </Screen>;
}

function TypeSwitch({ type, onChange }: { type: CategoryType; onChange: (type: CategoryType) => void }) {
  return <View style={styles.switchRow}>{(['INCOME', 'EXPENSE'] as CategoryType[]).map((item) => <TouchableOpacity key={item} onPress={() => onChange(item)} style={[styles.switchOption, type === item && (item === 'INCOME' ? styles.incomeActive : styles.expenseActive)]}><Text style={[styles.switchText, type === item && styles.switchTextActive]}>{item === 'INCOME' ? 'Income' : 'Expense'}</Text></TouchableOpacity>)}</View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 }, backRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, alignSelf: 'flex-start' }, back: { color: colors.forest, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 20 }, subtitle: { color: colors.slate, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  form: { padding: 17, backgroundColor: colors.surface, borderRadius: 20 }, formTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  switchRow: { flexDirection: 'row', backgroundColor: colors.line, borderRadius: 13, padding: 4, marginBottom: 12 }, switchOption: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 }, incomeActive: { backgroundColor: colors.income }, expenseActive: { backgroundColor: colors.expense }, switchText: { color: colors.slate, fontSize: 12, fontWeight: '800' }, switchTextActive: { color: colors.surface },
  editingType: { color: colors.slate, fontSize: 12, fontWeight: '700', marginBottom: 8 }, input: { height: 49, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 13, color: colors.ink, backgroundColor: colors.canvas }, error: { color: colors.expense, fontSize: 12, marginTop: 10 }, formActions: { flexDirection: 'row', gap: 8, marginTop: 12 }, actionButton: { flex: 1 }, cancelButton: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: colors.slate, fontWeight: '800' },
  listHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 26, marginBottom: 10 }, section: { color: colors.ink, fontSize: 19, fontWeight: '800' }, count: { marginLeft: 8, color: colors.slate, fontSize: 12, fontWeight: '800', backgroundColor: colors.line, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9 },
  searchBox: { height: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: colors.surface }, searchInput: { flex: 1, color: colors.ink, marginLeft: 8 },
  category: { minHeight: 62, paddingHorizontal: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface }, archived: { opacity: 0.65 }, categoryInfo: { flex: 1 }, categoryName: { color: colors.ink, fontSize: 14, fontWeight: '800' }, status: { fontSize: 11, marginTop: 3, fontWeight: '700' }, activeText: { color: colors.income }, archivedText: { color: colors.slate }, iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
