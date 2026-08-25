import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { getTransactions, Transaction } from '@/api/client';
import { Screen } from '@/components/Screen';
import { TransactionRow } from '@/components/TransactionRow';
import { Card, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function TransactionsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) void loadTransactions(token);
  }, [token]);

  async function loadTransactions(authToken: string) {
    setIsLoading(true);
    setError('');
    try {
      const response = await getTransactions(authToken);
      setTransactions(response.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load transactions.');
    } finally {
      setIsLoading(false);
    }
  }

  return <Screen><View style={styles.heading}><View><Text style={styles.title}>Transactions</Text><Text style={styles.subtitle}>Keep track of every cedi.</Text></View><TouchableOpacity style={styles.addSmall} onPress={() => router.push('/add-transaction')}><Ionicons name="add" size={21} color={colors.forestDark} /></TouchableOpacity></View><View style={styles.search}><Ionicons name="search-outline" size={19} color={colors.slate} /><TextInput placeholder="Search transactions" placeholderTextColor={colors.muted} style={styles.input} /></View><View style={styles.filters}><Text style={styles.filterActive}>All</Text><Text style={styles.filter}>Income</Text><Text style={styles.filter}>Expenses</Text><Ionicons name="options-outline" size={19} color={colors.forest} /></View><Card style={styles.card}>{isLoading ? <ActivityIndicator color={colors.forest} style={styles.state} /> : error ? <View style={styles.state}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => token && loadTransactions(token)}><Text style={styles.retry}>Try again</Text></TouchableOpacity></View> : transactions.length ? transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={toRow(transaction)} />) : <EmptyState title="No transactions recorded yet." />}</Card></Screen>;
}

function toRow(transaction: Transaction) {
  return { category: transaction.category.name, description: transaction.description ?? 'No description', date: new Date(transaction.transactionDate).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' }), amount: `GH₵ ${Number(transaction.amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, type: transaction.type === 'INCOME' ? 'income' as const : 'expense' as const, icon: transaction.type === 'INCOME' ? 'arrow-down-outline' as const : 'arrow-up-outline' as const };
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 10 },
  subtitle: { color: colors.slate, fontSize: 14, marginTop: 6, marginBottom: 22 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 15, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, color: colors.ink, fontSize: 14, marginLeft: 9 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  filterActive: { color: colors.surface, backgroundColor: colors.forest, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 8, fontSize: 12, fontWeight: '800' },
  filter: { color: colors.slate, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 14 },
  addSmall: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.honey, alignItems: 'center', justifyContent: 'center' },
  state: { paddingVertical: 28, alignItems: 'center' },
  error: { color: colors.expense, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  retry: { color: colors.forest, fontSize: 13, fontWeight: '800', marginTop: 10 },
  empty: { color: colors.slate, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
});
