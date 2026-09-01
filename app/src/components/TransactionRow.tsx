import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

type Transaction = {
  category: string;
  description: string;
  date: string;
  amount: string;
  type: 'income' | 'expense';
  icon: keyof typeof Ionicons.glyphMap;
};

export function TransactionRow({ transaction, onPress, isDeleting = false }: { transaction: Transaction; onPress?: () => void; isDeleting?: boolean }) {
  const isIncome = transaction.type === 'income';
  return (
    <Pressable style={[styles.row, isDeleting && styles.deleting]} onPress={onPress} disabled={!onPress || isDeleting} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={[styles.icon, { backgroundColor: isIncome ? colors.incomeSoft : colors.expenseSoft }]}>
        <Ionicons name={transaction.icon} size={18} color={isIncome ? colors.income : colors.expense} />
      </View>
      <View style={styles.details}>
        <Text style={styles.category}>{transaction.category}</Text>
        <Text style={styles.description}>{transaction.description} · {transaction.date}</Text>
      </View>
      {isDeleting ? <View style={styles.deletingStatus}><ActivityIndicator size="small" color={colors.forest} /><Text style={styles.deletingText}>Deleting...</Text></View> : <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>{isIncome ? '+' : '-'} {transaction.amount}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, marginLeft: 12 },
  category: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  description: { color: colors.slate, fontSize: 12, marginTop: 4 },
  amount: { fontSize: 13, fontWeight: '800', marginLeft: 8 },
  deleting: { opacity: 0.65 },
  deletingStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  deletingText: { color: colors.forest, fontSize: 11, fontWeight: '700' },
});
