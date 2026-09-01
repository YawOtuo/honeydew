import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionHeading } from '@/components/SectionHeading';
import { TransactionRow } from '@/components/TransactionRow';
import { TransactionDetailsSheet } from '@/components/TransactionDetailsSheet';
import { Card, Skeleton, SkeletonList, SkeletonText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { ReportSummary } from '@/api/client';
import { useMonthlyReportQuery, useSummaryQuery } from '@/api/queries';
import { useAuth } from '@/context/AuthContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [selectedTransaction, setSelectedTransaction] = useState<ReportSummary['recent'][number] | null>(null);
  const summaryQuery = useSummaryQuery(token);
  const { data: summary } = summaryQuery;
  const currentYear = new Date().getFullYear();
  const monthlyQuery = useMonthlyReportQuery(token, currentYear);
  const { data: monthlyReport } = monthlyQuery;
  const maxMonthlyTotal = Math.max(...(monthlyReport ?? []).map((item) => Math.max(Number(item.income), Number(item.expenses))), 1);
  if (summaryQuery.isLoading || monthlyQuery.isLoading) return <Screen><DashboardSkeleton /></Screen>;
  return (
    <>
    <Screen floatingAction={<TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={() => router.push('/add-transaction')}><Ionicons name="add" size={22} color={colors.surface} /><Text style={styles.addButtonText}>Add transaction</Text></TouchableOpacity>}>
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
        <SummaryCard label="Income" value={`GH₵ ${format(summary?.income, '24,500')}`} icon="arrow-down-outline" tone="income" onPress={() => router.push('/(tabs)/transactions?filter=income')} />
        <SummaryCard label="Expenses" value={`GH₵ ${format(summary?.expenses, '12,300')}`} icon="arrow-up-outline" tone="expense" onPress={() => router.push('/(tabs)/transactions?filter=expense')} />
      </View>
       <Card style={styles.balanceCard}>
         <View>
           <Text style={styles.balanceLabel}>Current balance</Text>
           <Text style={styles.balanceValue}>GH₵ {format(summary?.balance, '12,200')}</Text>
         </View>
         <View style={styles.balanceBadge}><Ionicons name="trending-up" size={15} color={colors.income} /><Text style={styles.balanceBadgeText}>12.4%</Text></View>
       </Card>

       <Card style={styles.chartCard}>
         <SectionHeading title="Monthly overview" action={String(currentYear)} />
         <View style={styles.chart}>
           {(monthlyReport ?? []).map((item) => (
             <View key={item.month} style={styles.barGroup}>
               <View style={styles.barTrack}><View style={[styles.bar, { height: Number(item.income) / maxMonthlyTotal * 100 }]} /><View style={[styles.bar, styles.expenseBar, { height: Number(item.expenses) / maxMonthlyTotal * 100 }]} /></View>
               <Text style={styles.barLabel}>{monthLabel(item.month)}</Text>
           </View>
          ))}
         </View>
         <View style={styles.legend}><Legend color={colors.income} label="Income" /><Legend color={colors.honey} label="Expenses" /></View>
       </Card>

      <SectionHeading title="Recent transactions" action="View all" />
        <Card style={styles.transactionCard}>{summary?.recent?.length ? summary.recent.map((transaction) => <TransactionRow key={transaction.id} transaction={toRow(transaction)} onPress={() => setSelectedTransaction(transaction)} />) : <Text style={styles.empty}>No transactions recorded yet.</Text>}</Card>
      </Screen>
      <TransactionDetailsSheet transaction={selectedTransaction} isAdmin={false} onClose={() => setSelectedTransaction(null)} onEdit={() => undefined} onDelete={() => undefined} />
    </>
  );
}

function SummaryCard({ label, value, icon, tone, onPress }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tone: 'income' | 'expense'; onPress: () => void }) {
  const isIncome = tone === 'income';
  return <TouchableOpacity style={styles.summaryTouchable} activeOpacity={0.85} onPress={onPress}><Card style={styles.summaryCard}><View style={[styles.summaryIcon, { backgroundColor: isIncome ? colors.incomeSoft : colors.expenseSoft }]}><Ionicons name={icon} size={18} color={isIncome ? colors.income : colors.expense} /></View><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryPeriod}>This month</Text></Card></TouchableOpacity>;
}

function Legend({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>; }
function toRow(transaction: ReportSummary['recent'][number]) { return { category: transaction.category.name, description: transaction.description ?? 'No description', date: new Date(transaction.transactionDate).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' }), amount: `GH₵ ${Number(transaction.amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, type: transaction.type === 'INCOME' ? 'income' as const : 'expense' as const, icon: transaction.type === 'INCOME' ? 'arrow-down-outline' as const : 'arrow-up-outline' as const }; }
function monthLabel(month: number) { return new Date(2000, month - 1, 1).toLocaleDateString('en', { month: 'short' }).slice(0, 1); }
function format(value: string | undefined, fallback: string) { return Number(value ?? fallback.replace(',', '')).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

function DashboardSkeleton() {
  return <>
    <View style={styles.header}><View><SkeletonText width={130} height={10} /><SkeletonText width={170} height={22} style={styles.skeletonTitle} /></View><Skeleton width={44} height={44} radius={16} /></View>
    <SkeletonText width={120} height={14} style={styles.skeletonMonth} />
    <View style={styles.summaryGrid}><Card style={styles.summaryCard}><Skeleton width={34} height={34} radius={11} /><SkeletonText width="55%" style={styles.skeletonLine} /><SkeletonText width="75%" height={17} style={styles.skeletonLine} /></Card><Card style={styles.summaryCard}><Skeleton width={34} height={34} radius={11} /><SkeletonText width="55%" style={styles.skeletonLine} /><SkeletonText width="75%" height={17} style={styles.skeletonLine} /></Card></View>
    <Card style={styles.balanceCard}><View><SkeletonText width={100} height={12} /><SkeletonText width={145} height={25} style={styles.skeletonLine} /></View></Card>
    <Card style={styles.chartCard}><SkeletonText width={130} height={16} /><Skeleton width="100%" height={100} radius={10} style={styles.skeletonChart} /></Card>
    <SkeletonText width={150} height={16} style={styles.skeletonHeading} /><Card style={styles.transactionCard}><SkeletonList count={3} /></Card>
  </>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  eyebrow: { color: colors.slate, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  greeting: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 6 },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.honeySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.forest, fontSize: 18, fontWeight: '800' },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  month: { color: colors.forest, fontSize: 14, fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', gap: 12 },
  summaryTouchable: { flex: 1 },
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
  empty: { color: colors.slate, fontSize: 13, textAlign: 'center', paddingVertical: 28 },
  skeletonTitle: { marginTop: 8 },
  skeletonMonth: { marginBottom: 12 },
  skeletonLine: { marginTop: 10 },
  skeletonChart: { marginTop: 18 },
  skeletonHeading: { marginBottom: 12 },
});
