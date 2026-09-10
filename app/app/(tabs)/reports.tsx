import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { TransactionFilters } from '@/api/client';
import { useCategoriesQuery, useCategoryReportQuery, useSummaryQuery, useUsersQuery } from '@/api/queries';
import { Screen } from '@/components/Screen';
import { SectionHeading } from '@/components/SectionHeading';
import {
  ActiveFilterChips,
  activeFilterCount,
  categoryLabel,
  EMPTY_FILTERS,
  TransactionFilterSheet,
} from '@/components/TransactionFilterSheet';
import { Card, EmptyState, Skeleton, SkeletonText } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function ReportsScreen() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const summaryQuery = useSummaryQuery(token, filters);
  const categoryQuery = useCategoryReportQuery(token, filters);
  const categoriesQuery = useCategoriesQuery(token);
  const usersQuery = useUsersQuery(token, isAdmin);
  const summary = summaryQuery.data;
  const categories = categoryQuery.data ?? [];
  const error = summaryQuery.error ?? categoryQuery.error;
  const errorMessage = error instanceof Error ? error.message : 'Unable to load reports.';
  const activeCount = activeFilterCount(filters);
  const categoryNames = useMemo(() => {
    const map = new Map<string, string>();
    (categoriesQuery.data ?? []).forEach((category) => map.set(category.id, categoryLabel(category)));
    return map;
  }, [categoriesQuery.data]);
  const userNames = useMemo(() => {
    const map = new Map<string, string>();
    (usersQuery.data ?? []).forEach((user) => map.set(user.id, nameFromEmail(user.email)));
    return map;
  }, [usersQuery.data]);

  if (summaryQuery.isLoading || categoryQuery.isLoading) return <Screen><ReportsSkeleton /></Screen>;
  if (error) return <Screen><Text style={styles.error}>{errorMessage}</Text></Screen>;

  return (
    <>
      <Screen
        refreshing={summaryQuery.isRefetching || categoryQuery.isRefetching}
        onRefresh={() => { void summaryQuery.refetch(); void categoryQuery.refetch(); }}
      >
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Understand where the school’s money goes.</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilterSheetOpen(true)}>
            <Ionicons name="options-outline" size={17} color={colors.forest} />
            <Text style={styles.filterButtonText}>Filters</Text>
            {activeCount ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          {activeCount ? (
            <TouchableOpacity onPress={() => setFilters(EMPTY_FILTERS)}>
              <Text style={styles.clearAll}>Clear all</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <ActiveFilterChips
          filters={filters}
          onChange={setFilters}
          categoryNames={categoryNames}
          userNames={userNames}
          showType={false}
          showSort={false}
        />
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Net balance</Text>
          <Text style={styles.total}>GH₵ {format(summary?.balance)}</Text>
          <View style={styles.totalLine}>
            <Text style={styles.income}>Income  GH₵ {format(summary?.income)}</Text>
            <Text style={styles.expense}>Expenses  GH₵ {format(summary?.expenses)}</Text>
          </View>
        </Card>
        <SectionHeading title="By category" />
        <Card style={styles.card}>
          {categories.length ? (
            categories.map((item) => (
              <ReportRow key={`${item.type}-${item.category.id}`} name={item.category.name} amount={item.amount} type={item.type} />
            ))
          ) : (
            <EmptyState title={activeCount ? 'No categories match these filters.' : 'No category data yet.'} />
          )}
        </Card>
      </Screen>
      <TransactionFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        value={filters}
        onApply={setFilters}
        categories={categoriesQuery.data ?? []}
        users={isAdmin ? usersQuery.data : undefined}
        showType={false}
        showSort={false}
      />
    </>
  );
}

function format(value?: string) { return Number(value ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function ReportRow({ name, amount, type }: { name: string; amount: string; type: 'INCOME' | 'EXPENSE' }) { return <View style={styles.row}><View style={styles.rowTop}><Text style={styles.name}>{name}</Text><Text style={styles.amount}>{type === 'INCOME' ? '+' : '-'} GH₵ {format(amount)}</Text></View><View style={styles.track}><View style={[styles.fill, { backgroundColor: type === 'INCOME' ? colors.income : colors.expense, width: '65%' }]} /></View></View>; }
function nameFromEmail(email: string) {
  const prefix = email.split('@')[0] ?? email;
  return prefix.split(/[._-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || email;
}
function ReportsSkeleton() { return <><SkeletonText width={130} height={27} /><SkeletonText width={230} height={14} style={styles.skeletonSubtitle} /><Card style={styles.totalCard}><SkeletonText width={90} height={12} /><SkeletonText width={155} height={27} style={styles.skeletonTotal} /><View style={styles.totalLine}><SkeletonText width={110} height={11} /><SkeletonText width={115} height={11} /></View></Card><SkeletonText width={120} height={16} style={styles.skeletonHeading} /><Card style={styles.card}><SkeletonText width="70%" /><Skeleton width="100%" height={8} radius={4} style={styles.skeletonTrack} /><SkeletonText width="60%" style={styles.skeletonRow} /><Skeleton width="100%" height={8} radius={4} style={styles.skeletonTrack} /><SkeletonText width="65%" style={styles.skeletonRow} /><Skeleton width="100%" height={8} radius={4} style={styles.skeletonTrack} /></Card></>; }

const styles = StyleSheet.create({ title: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 10 }, subtitle: { color: colors.slate, fontSize: 14, marginTop: 6, marginBottom: 18 }, error: { color: colors.expense, textAlign: 'center', marginTop: 80 }, filterRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }, filterButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surface, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 11 }, filterButtonText: { color: colors.forest, fontSize: 13, fontWeight: '800' }, filterBadge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: colors.honey, alignItems: 'center', justifyContent: 'center' }, filterBadgeText: { color: colors.forestDark, fontSize: 10, fontWeight: '800' }, clearAll: { color: colors.expense, fontSize: 12, fontWeight: '800' }, totalCard: { backgroundColor: colors.forest, borderRadius: 20, padding: 20, marginBottom: 24 }, totalLabel: { color: '#B8D8CC', fontSize: 12 }, total: { color: colors.surface, fontSize: 27, fontWeight: '800', marginTop: 6 }, totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }, income: { color: '#BCE5D1', fontSize: 11, fontWeight: '700' }, expense: { color: '#F7C3B8', fontSize: 11, fontWeight: '700' }, card: { backgroundColor: colors.surface, borderRadius: 20, padding: 17 }, row: { marginBottom: 19 }, rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, name: { color: colors.ink, fontWeight: '700', fontSize: 13 }, amount: { color: colors.slate, fontWeight: '700', fontSize: 12 }, track: { height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 4 }, skeletonSubtitle: { marginTop: 8, marginBottom: 22 }, skeletonTotal: { marginTop: 9 }, skeletonHeading: { marginBottom: 12 }, skeletonTrack: { marginTop: 10 }, skeletonRow: { marginTop: 20 } });
