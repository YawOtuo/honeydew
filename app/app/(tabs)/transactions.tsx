import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { deleteTransaction, Transaction, TransactionFilters } from "@/api/client";
import { queryKeys, useCategoriesQuery, useTransactionsQuery, useUsersQuery } from "@/api/queries";
import { Screen } from "@/components/Screen";
import { TransactionRow } from "@/components/TransactionRow";
import {
  ActiveFilterChips,
  activeFilterCount,
  categoryLabel,
  EMPTY_FILTERS,
  paymentMethodLabel,
  TransactionFilterSheet,
} from "@/components/TransactionFilterSheet";
import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  SkeletonList,
  useToast,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";

export default function TransactionsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isAdmin = user?.role === "ADMIN";
  const { data, isLoading, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTransactionsQuery(token, filters);
  const categoriesQuery = useCategoriesQuery(token);
  const usersQuery = useUsersQuery(token, isAdmin);
  const transactions = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;
  const activeCount = activeFilterCount(filters);
  const hasSearch = Boolean(filters.search);
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
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(token!, id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.summary }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categoryReport }),
        queryClient.invalidateQueries({ queryKey: queryKeys.audit }),
      ]);
      showToast("Transaction deleted successfully.");
    },
    onError: (deleteError) => {
      setDeletingId(null);
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete transaction.",
      );
    },
    onSettled: () => setDeletingId(null),
  });
  const errorMessage =
    error instanceof Error ? error.message : "Unable to load transactions.";

  useEffect(() => {
    if (params.filter === "income" || params.filter === "expense") {
      setFilters((current) => ({
        ...current,
        type: params.filter === "income" ? "INCOME" : "EXPENSE",
      }));
    }
  }, [params.filter]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((current) => {
        const nextSearch = searchInput.trim() || undefined;
        if (current.search === nextSearch) return current;
        return { ...current, search: nextSearch };
      });
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  function clearAll() {
    setFilters(EMPTY_FILTERS);
    setSearchInput("");
  }

  function confirmDelete(transaction: Transaction) {
    Alert.alert(
      "Delete transaction?",
      "This transaction will be removed from normal lists and reports.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSelectedTransaction(null);
            setDeletingId(transaction.id);
            deleteMutation.mutate(transaction.id);
          },
        },
      ],
    );
  }

  return (
    <>
      <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
        <View style={styles.heading}>
          <View>
            <Text style={styles.title}>Transactions</Text>
            <Text style={styles.subtitle}>Keep track of every cedi.</Text>
          </View>
          <TouchableOpacity
            style={styles.addSmall}
            onPress={() => router.push("/add-transaction")}
          >
            <Ionicons name="add" size={21} color={colors.forestDark} />
          </TouchableOpacity>
        </View>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={19} color={colors.slate} />
          <TextInput
            placeholder="Search description, invoice, category"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchInput ? (
            <TouchableOpacity onPress={() => setSearchInput("")} hitSlop={8}>
              <Ionicons name="close-circle" size={19} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.filters}>
          <TouchableOpacity onPress={() => setFilters((current) => ({ ...current, type: undefined }))}>
            <Text
              style={!filters.type ? styles.filterActive : styles.filter}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilters((current) => ({ ...current, type: "INCOME" }))}>
            <Text
              style={filters.type === "INCOME" ? styles.filterActive : styles.filter}
            >
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilters((current) => ({ ...current, type: "EXPENSE" }))}>
            <Text
              style={filters.type === "EXPENSE" ? styles.filterActive : styles.filter}
            >
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilterSheetOpen(true)}>
            <Ionicons name="options-outline" size={19} color={colors.forest} />
            {activeCount ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
        <ActiveFilterChips
          filters={filters}
          onChange={setFilters}
          categoryNames={categoryNames}
          userNames={userNames}
          onClearAll={clearAll}
        />
        <Card style={styles.card}>
          {isLoading ? (
            <SkeletonList count={6} />
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.error}>{errorMessage}</Text>
              <TouchableOpacity onPress={() => void refetch()}>
                <Text style={styles.retry}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : transactions.length ? (
            <>
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={toRow(transaction)}
                  isDeleting={deletingId === transaction.id}
                  onPress={() => setSelectedTransaction(transaction)}
                />
              ))}
              {hasNextPage ? (
                <TouchableOpacity
                  style={styles.loadMore}
                  disabled={isFetchingNextPage}
                  onPress={() => void fetchNextPage()}
                >
                  {isFetchingNextPage ? (
                    <ActivityIndicator color={colors.forest} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.resultCount}>
                  {total} transaction{total === 1 ? "" : "s"}
                </Text>
              )}
            </>
          ) : (
            <View style={styles.state}>
              <EmptyState
                title={
                  activeCount || hasSearch
                    ? "No transactions match these filters."
                    : "No transactions recorded yet."
                }
              />
              {activeCount || hasSearch ? (
                <TouchableOpacity onPress={clearAll}>
                  <Text style={styles.retry}>Clear filters</Text>
                </TouchableOpacity>
              ) : null}
            </View>
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
      />
      <TransactionDetailsSheet
        transaction={selectedTransaction}
        isAdmin={user?.role === "ADMIN"}
        onClose={() => setSelectedTransaction(null)}
        onEdit={() => {
          if (selectedTransaction)
            router.push({
              pathname: "/add-transaction",
              params: { id: selectedTransaction.id },
            });
          setSelectedTransaction(null);
        }}
        onDelete={() => {
          if (selectedTransaction) confirmDelete(selectedTransaction);
        }}
      />
    </>
  );
}

function TransactionDetailsSheet({
  transaction,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
}: {
  transaction: Transaction | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!transaction) return null;
  const actions = isAdmin ? (
    <View style={styles.detailActions}>
      <Button onPress={onEdit} style={styles.editButton}>
        Edit transaction
      </Button>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Text style={styles.deleteText}>Delete transaction</Text>
      </TouchableOpacity>
    </View>
  ) : undefined;
  return (
    <BottomSheet visible onClose={onClose} title="Transaction details" footer={actions}>
      <View style={styles.detailsSheet}>
        <View style={styles.detailAmount}>
          <Text style={styles.detailType}>
            {transaction.type === "INCOME" ? "Income" : "Expense"}
          </Text>
          <Text
            style={[
              styles.detailValue,
              {
                color:
                  transaction.type === "INCOME"
                    ? colors.income
                    : colors.expense,
              },
            ]}
          >
            {transaction.type === "INCOME" ? "+" : "-"} GH₵{" "}
            {formatAmount(transaction.amount)}
          </Text>
        </View>
        <DetailLine label="Category" value={transaction.category.name} />
        <DetailLine
          label="Date"
          value={new Date(transaction.transactionDate).toLocaleString("en-GH")}
        />
        <DetailLine
          label="Payment method"
          value={paymentMethodLabel(transaction.paymentMethod)}
        />
        <DetailLine
          label="Invoice number"
          value={transaction.invoiceNumber ?? "Not specified"}
        />
        <DetailLine
          label="Description"
          value={transaction.description ?? "No description"}
        />
      </View>
    </BottomSheet>
  );
}

function nameFromEmail(email: string) {
  const prefix = email.split("@")[0] ?? email;
  return prefix.split(/[._-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") || email;
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailText}>{value}</Text>
    </View>
  );
}
function formatAmount(value: string) {
  return Number(value).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toRow(transaction: Transaction) {
  return {
    category: transaction.category.name,
    description: transaction.description ?? "No description",
    date: new Date(transaction.transactionDate).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
    }),
    amount: `GH₵ ${Number(transaction.amount).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    type:
      transaction.type === "INCOME"
        ? ("income" as const)
        : ("expense" as const),
    icon:
      transaction.type === "INCOME"
        ? ("arrow-up-outline" as const)
        : ("arrow-down-outline" as const),
  };
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: colors.ink, fontSize: 27, fontWeight: "800", marginTop: 10 },
  subtitle: {
    color: colors.slate,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 22,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, color: colors.ink, fontSize: 14, marginLeft: 9 },
  filters: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
  },
  filterActive: {
    color: colors.surface,
    backgroundColor: colors.forest,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "800",
  },
  filter: {
    color: colors.slate,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
  },
  filterButton: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.honey,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { color: colors.forestDark, fontSize: 10, fontWeight: "800" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  addSmall: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.honey,
    alignItems: "center",
    justifyContent: "center",
  },
  state: { paddingVertical: 28, alignItems: "center" },
  error: {
    color: colors.expense,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  retry: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  loadMore: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  loadMoreText: { color: colors.forest, fontSize: 13, fontWeight: "800" },
  resultCount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  detailsSheet: { paddingBottom: 20 },
  detailAmount: {
    backgroundColor: colors.canvas,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  detailType: { color: colors.slate, fontSize: 12, fontWeight: "700" },
  detailValue: { fontSize: 25, fontWeight: "800", marginTop: 5 },
  detailLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  detailLabel: { color: colors.slate, fontSize: 12 },
  detailText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  detailActions: { gap: 10 },
  editButton: { minHeight: 48 },
  deleteButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.expense,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { color: colors.expense, fontSize: 14, fontWeight: "800" },
});
