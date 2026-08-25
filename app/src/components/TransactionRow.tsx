import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

type Transaction = {
  category: string;
  description: string;
  date: string;
  amount: string;
  type: 'income' | 'expense';
  icon: keyof typeof Ionicons.glyphMap;
};

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === 'income';
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: isIncome ? colors.incomeSoft : colors.expenseSoft }]}>
        <Ionicons name={transaction.icon} size={18} color={isIncome ? colors.income : colors.expense} />
      </View>
      <View style={styles.details}>
        <Text style={styles.category}>{transaction.category}</Text>
        <Text style={styles.description}>{transaction.description} · {transaction.date}</Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {isIncome ? '+' : '-'} {transaction.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, marginLeft: 12 },
  category: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  description: { color: colors.slate, fontSize: 12, marginTop: 4 },
  amount: { fontSize: 13, fontWeight: '800', marginLeft: 8 },
});
