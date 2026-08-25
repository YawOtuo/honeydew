import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { CategoryReport, getCategoryReport, getReportSummary, ReportSummary } from '@/api/client';
import { Screen } from '@/components/Screen';
import { SectionHeading } from '@/components/SectionHeading';
import { Card, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function ReportsScreen() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [categories, setCategories] = useState<CategoryReport>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    void Promise.all([getReportSummary(token), getCategoryReport(token)]).then(([summaryResponse, categoryResponse]) => { setSummary(summaryResponse); setCategories(categoryResponse); }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load reports.'));
  }, [token]);

  if (!summary && !error) return <Screen><ActivityIndicator color={colors.forest} style={styles.loading} /></Screen>;
  if (error) return <Screen><Text style={styles.error}>{error}</Text></Screen>;

  return <Screen><Text style={styles.title}>Reports</Text><Text style={styles.subtitle}>Understand where the school’s money goes.</Text><Card style={styles.range}><Text style={styles.rangeText}>All transactions</Text><Text style={styles.rangeAction}>Current view</Text></Card><Card style={styles.totalCard}><Text style={styles.totalLabel}>Net balance</Text><Text style={styles.total}>GH₵ {format(summary?.balance)}</Text><View style={styles.totalLine}><Text style={styles.income}>Income  GH₵ {format(summary?.income)}</Text><Text style={styles.expense}>Expenses  GH₵ {format(summary?.expenses)}</Text></View></Card><SectionHeading title="By category" /><Card style={styles.card}>{categories.length ? categories.map((item) => <ReportRow key={`${item.type}-${item.category.id}`} name={item.category.name} amount={item.amount} type={item.type} />) : <EmptyState title="No category data yet." />}</Card></Screen>;
}

function format(value?: string) { return Number(value ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function ReportRow({ name, amount, type }: { name: string; amount: string; type: 'INCOME' | 'EXPENSE' }) { return <View style={styles.row}><View style={styles.rowTop}><Text style={styles.name}>{name}</Text><Text style={styles.amount}>{type === 'INCOME' ? '+' : '-'} GH₵ {format(amount)}</Text></View><View style={styles.track}><View style={[styles.fill, { backgroundColor: type === 'INCOME' ? colors.income : colors.expense, width: '65%' }]} /></View></View>; }

const styles = StyleSheet.create({ title: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 10 }, subtitle: { color: colors.slate, fontSize: 14, marginTop: 6, marginBottom: 22 }, loading: { marginTop: 80 }, error: { color: colors.expense, textAlign: 'center', marginTop: 80 }, range: { backgroundColor: colors.surface, borderRadius: 14, padding: 15, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }, rangeText: { color: colors.ink, fontWeight: '700' }, rangeAction: { color: colors.forest, fontWeight: '800', fontSize: 12 }, totalCard: { backgroundColor: colors.forest, borderRadius: 20, padding: 20, marginBottom: 24 }, totalLabel: { color: '#B8D8CC', fontSize: 12 }, total: { color: colors.surface, fontSize: 27, fontWeight: '800', marginTop: 6 }, totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }, income: { color: '#BCE5D1', fontSize: 11, fontWeight: '700' }, expense: { color: '#F7C3B8', fontSize: 11, fontWeight: '700' }, card: { backgroundColor: colors.surface, borderRadius: 20, padding: 17 }, row: { marginBottom: 19 }, rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, name: { color: colors.ink, fontWeight: '700', fontSize: 13 }, amount: { color: colors.slate, fontWeight: '700', fontSize: 12 }, track: { height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 4 }, empty: { color: colors.slate, textAlign: 'center', paddingVertical: 20 } });
