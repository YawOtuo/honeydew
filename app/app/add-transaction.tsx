import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Category, createTransaction, getCategories } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (token) void loadCategories(token); }, [token]);
  const availableCategories = useMemo(() => categories.filter((category) => category.type === type), [categories, type]);

  async function loadCategories(authToken: string) {
    try { setCategories(await getCategories(authToken)); } catch { setError('Unable to load categories.'); }
  }

  async function save() {
    if (!token) return;
    setError('');
    if (!amount || Number(amount) <= 0 || !categoryId) { setError('Enter an amount and choose a category.'); return; }
    setIsSaving(true);
    try {
      await createTransaction(token, { type, amount, categoryId, transactionDate: new Date().toISOString(), description: description || undefined, invoiceNumber: invoiceNumber || undefined, paymentMethod: 'CASH' });
      router.back();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save transaction.'); } finally { setIsSaving(false); }
  }

  return <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={23} color={colors.ink} /></TouchableOpacity><Text style={styles.title}>Add transaction</Text><View style={{ width: 23 }} /></View><Text style={styles.subtitle}>Record money coming in or going out.</Text><View style={styles.typeSwitch}><TouchableOpacity style={[styles.typeOption, type === 'INCOME' && styles.typeIncome]} onPress={() => { setType('INCOME'); setCategoryId(''); }}><Text style={[styles.typeText, type === 'INCOME' && styles.activeTypeText]}>Income</Text></TouchableOpacity><TouchableOpacity style={[styles.typeOption, type === 'EXPENSE' && styles.typeExpense]} onPress={() => { setType('EXPENSE'); setCategoryId(''); }}><Text style={[styles.typeText, type === 'EXPENSE' && styles.activeTypeText]}>Expense</Text></TouchableOpacity></View><Text style={styles.label}>Amount</Text><View style={styles.amountBox}><Text style={styles.currency}>GH₵</Text><TextInput keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.muted} value={amount} onChangeText={setAmount} style={styles.amountInput} /></View><Text style={styles.label}>Category</Text><View style={styles.categoryList}>{availableCategories.map((category) => <TouchableOpacity key={category.id} style={[styles.category, categoryId === category.id && styles.selectedCategory]} onPress={() => setCategoryId(category.id)}><Text style={[styles.categoryText, categoryId === category.id && styles.selectedCategoryText]}>{category.name}</Text></TouchableOpacity>)}</View><Text style={styles.label}>Invoice number <Text style={styles.optional}>Optional</Text></Text><TextInput placeholder="e.g. INV-001" placeholderTextColor={colors.muted} value={invoiceNumber} onChangeText={setInvoiceNumber} style={styles.input} /><Text style={styles.label}>Description <Text style={styles.optional}>Optional</Text></Text><TextInput placeholder="Add some context" placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} style={[styles.input, styles.multiline]} multiline /><View style={styles.payment}><Ionicons name="cash-outline" size={20} color={colors.forest} /><Text style={styles.paymentText}>Payment method</Text><Text style={styles.cash}>Cash</Text></View>{error ? <Text style={styles.error}>{error}</Text> : null}<TouchableOpacity style={styles.save} onPress={save} disabled={isSaving}>{isSaving ? <ActivityIndicator color={colors.forestDark} /> : <Text style={styles.saveText}>Save transaction</Text>}</TouchableOpacity></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 35 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }, title: { color: colors.ink, fontSize: 21, fontWeight: '800' }, subtitle: { color: colors.slate, fontSize: 13, marginTop: 8, marginBottom: 22 }, typeSwitch: { flexDirection: 'row', backgroundColor: colors.line, borderRadius: 14, padding: 4, marginBottom: 22 }, typeOption: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 11 }, typeIncome: { backgroundColor: colors.income }, typeExpense: { backgroundColor: colors.expense }, typeText: { color: colors.slate, fontWeight: '800', fontSize: 13 }, activeTypeText: { color: colors.surface }, label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 }, optional: { color: colors.muted, fontWeight: '500' }, amountBox: { backgroundColor: colors.surface, borderRadius: 15, height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }, currency: { color: colors.forest, fontSize: 20, fontWeight: '800', marginRight: 9 }, amountInput: { flex: 1, color: colors.ink, fontSize: 26, fontWeight: '800' }, categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, category: { backgroundColor: colors.surface, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10 }, selectedCategory: { backgroundColor: colors.forest }, categoryText: { color: colors.slate, fontSize: 12, fontWeight: '700' }, selectedCategoryText: { color: colors.surface }, input: { height: 50, backgroundColor: colors.surface, borderRadius: 13, paddingHorizontal: 14, color: colors.ink, fontSize: 14 }, multiline: { height: 80, paddingTop: 14, textAlignVertical: 'top' }, payment: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 13, padding: 15, marginTop: 18 }, paymentText: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '700', marginLeft: 10 }, cash: { color: colors.slate, fontSize: 13 }, error: { color: colors.expense, fontSize: 12, marginTop: 14 }, save: { height: 54, borderRadius: 15, backgroundColor: colors.honey, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, saveText: { color: colors.forestDark, fontWeight: '800', fontSize: 15 } });
