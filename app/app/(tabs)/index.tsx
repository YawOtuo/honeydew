import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionHeading } from '@/components/SectionHeading';
import { TransactionRow } from '@/components/TransactionRow';
import { colors, spacing } from '@/theme';
import { getReportSummary, ReportSummary } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const transactions = [
  { category: 'School fees', description: 'Form 2 payment', date: 'Today', amount: 'GH₵ 2,000', type: 'income' as const, icon: 'school-outline' as const },
  { category: 'Utilities', description: 'Electricity bill', date: 'Yesterday', amount: 'GH₵ 850', type: 'expense' as const, icon: 'bulb-outline' as const },
  { category: 'Donations', description: 'PTA contribution', date: '12 Aug', amount: 'GH₵ 1,200', type: 'income' as const, icon: 'heart-outline' as const },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  useEffect(() => { if (token) void getReportSummary(token).then(setSummary).catch(() => undefined); }, [token]);
  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MONDAY, 17 AUGUST</Text>
          <Text style={styles.greeting}>Good morning, Admin</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
      </View>

      <View style={styles.monthRow}>
        <Text style={styles.month}>August 2026</Text>
        <Ionicons name="chevron-down" size={16} color={colors.forest} />
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard label="Income" value={`GH₵ ${format(summary?.income, '24,500')}`} icon="arrow-down-outline" tone="income" />
        <SummaryCard label="Expenses" value={`GH₵ ${format(summary?.expenses, '12,300')}`} icon="arrow-up-outline" tone="expense" />
      </View>
      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.balanceLabel}>Current balance</Text>
          <Text style={styles.balanceValue}>GH₵ {format(summary?.balance, '12,200')}</Text>
        </View>
        <View style={styles.balanceBadge}><Ionicons name="trending-up" size={15} color={colors.income} /><Text style={styles.balanceBadgeText}>12.4%</Text></View>
      </View>

      <View style={styles.chartCard}>
        <SectionHeading title="Monthly overview" action="This month" />
        <View style={styles.chart}>
          {[48, 74, 55, 88, 66, 80, 60].map((height, index) => (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barTrack}><View style={[styles.bar, { height }]} /><View style={[styles.bar, styles.expenseBar, { height: height * 0.55 }]} /></View>
              <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>
            </View>
          ))}
        </View>
        <View style={styles.legend}><Legend color={colors.income} label="Income" /><Legend color={colors.honey} label="Expenses" /></View>
      </View>

      <SectionHeading title="Recent transactions" action="View all" />
      <View style={styles.transactionCard}>{transactions.map((transaction) => <TransactionRow key={`${transaction.category}-${transaction.date}`} transaction={transaction} />)}</View>

      <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={() => router.push('/add-transaction')}>
        <Ionicons name="add" size={22} color={colors.surface} />
        <Text style={styles.addButtonText}>Add transaction</Text>
      </TouchableOpacity>
    </Screen>
  );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tone: 'income' | 'expense' }) {
  const isIncome = tone === 'income';
  return <View style={styles.summaryCard}><View style={[styles.summaryIcon, { backgroundColor: isIncome ? colors.incomeSoft : colors.expenseSoft }]}><Ionicons name={icon} size={18} color={isIncome ? colors.income : colors.expense} /></View><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryPeriod}>This month</Text></View>;
}

function Legend({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>; }
function format(value: string | undefined, fallback: string) { return Number(value ?? fallback.replace(',', '')).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  eyebrow: { color: colors.slate, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  greeting: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 6 },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.honeySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.forest, fontSize: 18, fontWeight: '800' },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  month: { color: colors.forest, fontSize: 14, fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 16, minHeight: 142 },
  summaryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  summaryLabel: { color: colors.slate, fontSize: 12, fontWeight: '600' },
  summaryValue: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 5 },
  summaryPeriod: { color: colors.muted, fontSize: 11, marginTop: 7 },
  balanceCard: { backgroundColor: colors.forest, borderRadius: 20, padding: 20, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: '#B8D8CC', fontSize: 12, fontWeight: '600' },
  balanceValue: { color: colors.surface, fontSize: 25, fontWeight: '800', marginTop: 6 },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.incomeSoft, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  balanceBadgeText: { color: colors.income, fontSize: 12, fontWeight: '800' },
  chartCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginTop: 24, marginBottom: 24 },
  chart: { height: 130, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 14 },
  barGroup: { alignItems: 'center', flex: 1 },
  barTrack: { height: 100, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 8, borderRadius: 5, backgroundColor: colors.income },
  expenseBar: { backgroundColor: colors.honey },
  barLabel: { color: colors.muted, fontSize: 10, marginTop: 8, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 18, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: colors.slate, fontSize: 11 },
  transactionCard: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 14, marginBottom: 16 },
  addButton: { backgroundColor: colors.honey, borderRadius: 17, minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 },
  addButtonText: { color: colors.forestDark, fontSize: 15, fontWeight: '800' },
});
