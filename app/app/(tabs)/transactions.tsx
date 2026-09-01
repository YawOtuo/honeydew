import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { deleteTransaction, Transaction } from "@/api/client";
import { queryKeys, useTransactionsQuery } from "@/api/queries";
import { Screen } from "@/components/Screen";
import { TransactionRow } from "@/components/TransactionRow";
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
  const [filter, setFilter] = useState<"all" | "income" | "expense">(
    params.filter === "income" || params.filter === "expense"
      ? params.filter
      : "all",
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useTransactionsQuery(token);
  const transactions = data?.items ?? [];
  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter(
          (transaction) =>
            transaction.type === (filter === "income" ? "INCOME" : "EXPENSE"),
        );
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
    if (params.filter === "income" || params.filter === "expense")
      setFilter(params.filter);
  }, [params.filter]);

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
      <Screen>
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
            placeholder="Search transactions"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
        <View style={styles.filters}>
          <TouchableOpacity onPress={() => setFilter("all")}>
            <Text
              style={filter === "all" ? styles.filterActive : styles.filter}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter("income")}>
            <Text
              style={filter === "income" ? styles.filterActive : styles.filter}
            >
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter("expense")}>
            <Text
              style={filter === "expense" ? styles.filterActive : styles.filter}
            >
              Expenses
            </Text>
          </TouchableOpacity>
          <Ionicons name="options-outline" size={19} color={colors.forest} />
        </View>
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
          ) : filteredTransactions.length ? (
            filteredTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={toRow(transaction)}
                isDeleting={deletingId === transaction.id}
                onPress={() => setSelectedTransaction(transaction)}
              />
            ))
          ) : (
            <EmptyState
              title={
                filter === "all"
                  ? "No transactions recorded yet."
                  : `No ${filter} transactions found.`
              }
            />
          )}
        </Card>
      </Screen>
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
          value={
            transaction.paymentMethod === "CASH" ? "Cash" : "Not specified"
          }
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
        ? ("arrow-down-outline" as const)
        : ("arrow-up-outline" as const),
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
  empty: {
    color: colors.slate,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 30,
  },
});
