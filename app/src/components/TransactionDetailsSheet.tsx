import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Transaction } from '@/api/client';
import { BottomSheet, Button } from '@/components/ui';
import { colors } from '@/theme';

export function TransactionDetailsSheet({ transaction, isAdmin, onClose, onEdit, onDelete }: { transaction: Transaction | null; isAdmin: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  if (!transaction) return null;
  return <BottomSheet visible onClose={onClose} title="Transaction details"><View style={styles.content}><View style={styles.amount}><Text style={styles.type}>{transaction.type === 'INCOME' ? 'Income' : 'Expense'}</Text><Text style={[styles.value, { color: transaction.type === 'INCOME' ? colors.income : colors.expense }]}>{transaction.type === 'INCOME' ? '+' : '-'} GH₵ {formatAmount(transaction.amount)}</Text></View><DetailLine label="Category" value={transaction.category.name} /><DetailLine label="Date" value={new Date(transaction.transactionDate).toLocaleString('en-GH')} /><DetailLine label="Payment method" value={transaction.paymentMethod === 'CASH' ? 'Cash' : 'Not specified'} /><DetailLine label="Invoice number" value={transaction.invoiceNumber ?? 'Not specified'} /><DetailLine label="Description" value={transaction.description ?? 'No description'} />{isAdmin ? <View style={styles.actions}><Button onPress={onEdit} style={styles.edit}>Edit transaction</Button><TouchableOpacity onPress={onDelete} style={styles.delete}><Text style={styles.deleteText}>Delete transaction</Text></TouchableOpacity></View> : null}</View></BottomSheet>;
}

function DetailLine({ label, value }: { label: string; value: string }) { return <View style={styles.line}><Text style={styles.label}>{label}</Text><Text style={styles.text}>{value}</Text></View>; }
function formatAmount(value: string) { return Number(value).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const styles = StyleSheet.create({
  content: { paddingBottom: 20 },
  amount: { backgroundColor: colors.canvas, borderRadius: 16, padding: 16, marginBottom: 10 },
  type: { color: colors.slate, fontSize: 12, fontWeight: '700' },
  value: { fontSize: 25, fontWeight: '800', marginTop: 5 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  label: { color: colors.slate, fontSize: 12 },
  text: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  actions: { marginTop: 20, gap: 10 },
  edit: { minHeight: 48 },
  delete: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.expense, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.expense, fontSize: 14, fontWeight: '800' },
});
