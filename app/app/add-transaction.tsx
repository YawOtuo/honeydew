import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { createTransaction, updateTransaction, type PaymentMethod } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";
import { BottomSheet, Button, Input, Select, useToast } from "@/components/ui";
import { queryKeys, useCategoriesQuery, useTransactionsQuery } from "@/api/queries";

export default function AddTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token } = useAuth();
  const { data: transactions } = useTransactionsQuery(token);
  const transaction = id ? transactions?.items.find((item) => item.id === id) : undefined;
  const isEditing = Boolean(id);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<Parameters<typeof createTransaction>[1] | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const categoriesQuery = useCategoriesQuery(token);
  const availableCategories = (categoriesQuery.data ?? []).filter((category) => category.type === type);
  useEffect(() => {
    if (!transaction) return;
    setType(transaction.type);
    setAmount(transaction.amount);
    setCategoryId(transaction.category.id);
    setDescription(transaction.description ?? "");
    setInvoiceNumber(transaction.invoiceNumber ?? "");
    setTransactionDate(new Date(transaction.transactionDate));
    setPaymentMethod(transaction.paymentMethod ?? "CASH");
  }, [transaction]);
  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof createTransaction>[1]) => isEditing ? updateTransaction(token!, id!, body) : createTransaction(token!, body),
    onSuccess: async () => {
      setConfirmationOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.summary }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categoryReport }),
        queryClient.invalidateQueries({ queryKey: ['reports', 'monthly'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.audit }),
      ]);
       showToast(isEditing ? "Transaction updated successfully." : "Transaction saved successfully.");
      closeSheet();
    },
    onError: (saveError) => {
      setConfirmationOpen(false);
      setError(saveError instanceof Error ? saveError.message : "Unable to save transaction.");
    },
  });

  function review() {
    if (!token) return;
    setError("");
    if (!amount || Number(amount) <= 0 || !categoryId) {
      setError("Enter an amount and choose a category.");
      return;
    }
    setPendingTransaction({
      type,
      amount,
      categoryId,
      transactionDate: transactionDate.toISOString(),
      description: description.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      paymentMethod,
    });
    setConfirmationOpen(true);
  }

  function confirm() {
    if (pendingTransaction) createMutation.mutate(pendingTransaction);
  }

  function closeSheet() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  const selectedCategory = availableCategories.find((category) => category.id === categoryId)?.name ?? transaction?.category.name ?? "Not selected";

  return <>
     <BottomSheet visible onClose={closeSheet} title={isEditing ? "Edit transaction" : "Add transaction"} height={Math.round(Dimensions.get("window").height * 0.88)} footer={<Button style={styles.save} onPress={review}>{isEditing ? "Review changes" : "Review transaction"}</Button>}>
      <View style={styles.content}>
        <View style={styles.typeSwitch}>
          <TouchableOpacity
            style={[styles.typeOption, type === "INCOME" && styles.typeIncome]}
            onPress={() => {
              setType("INCOME");
              setCategoryId("");
            }}
          >
            <Text
              style={[
                styles.typeText,
                type === "INCOME" && styles.activeTypeText,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeOption,
              type === "EXPENSE" && styles.typeExpense,
            ]}
            onPress={() => {
              setType("EXPENSE");
              setCategoryId("");
            }}
          >
            <Text
              style={[
                styles.typeText,
                type === "EXPENSE" && styles.activeTypeText,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountBox}>
          <Text style={styles.currency}>GH₵</Text>
          <TextInput
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            value={amount}
            onChangeText={setAmount}
            style={styles.amountInput}
          />
        </View>
        <Select searchable label="Category" value={categoryId} onChange={setCategoryId} placeholder={categoriesQuery.isLoading ? "Loading categories..." : "Choose a category"} emptyMessage={categoriesQuery.isError ? "Unable to load categories." : "No categories available."} options={availableCategories.map((category) => ({ label: category.name, value: category.id }))} />
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.dateControl} onPress={() => setDatePickerOpen(true)} accessibilityRole="button" accessibilityLabel="Choose transaction date">
          <Ionicons name="calendar-outline" size={20} color={colors.forest} />
          <Text style={styles.dateText}>{transactionDate.toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.slate} />
        </TouchableOpacity>
        {datePickerOpen ? <DateTimePicker
          value={transactionDate}
          mode="date"
          display={process.env.EXPO_OS === "ios" ? "inline" : "default"}
          onChange={(event, selectedDate) => {
            if (process.env.EXPO_OS !== "ios") setDatePickerOpen(false);
            if (event.type === "set" && selectedDate) setTransactionDate(selectedDate);
          }}
        /> : null}
        <Input label="Description" placeholder="Add some context" value={description} onChangeText={setDescription} multiline style={styles.multiline} />
        <Select label="Payment method" value={paymentMethod} onChange={(value) => setPaymentMethod(value as PaymentMethod)} options={[{ label: "Cash", value: "CASH" }, { label: "MoMo", value: "MOMO" }, { label: "Bank", value: "BANK" }]} />
        <Input label="Invoice number" placeholder="e.g. INV-001" value={invoiceNumber} onChangeText={setInvoiceNumber} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </BottomSheet>
    <BottomSheet visible={confirmationOpen} onClose={() => setConfirmationOpen(false)} title={isEditing ? "Confirm changes" : "Confirm transaction"} height={Math.round(Dimensions.get("window").height * 0.68)} footer={<View style={styles.confirmActions}><TouchableOpacity disabled={createMutation.isPending} style={styles.backButton} onPress={() => setConfirmationOpen(false)}><Text style={styles.backButtonText}>Go back</Text></TouchableOpacity><Button style={styles.confirmButton} onPress={confirm} loading={createMutation.isPending}>{isEditing ? "Confirm changes" : "Confirm"}</Button></View>}>
      <View style={styles.confirmContent}>
        <View style={[styles.confirmBadge, type === "INCOME" ? styles.confirmIncome : styles.confirmExpense]}><Text style={styles.confirmBadgeText}>{type === "INCOME" ? "Income" : "Expense"}</Text></View>
        <Text style={[styles.confirmAmount, { color: type === "INCOME" ? colors.income : colors.expense }]}>GH₵ {formatAmount(amount)}</Text>
        <Text style={styles.confirmHint}>Please check these details before confirming.</Text>
        <View style={styles.summaryCard}>
          <SummaryRow label="Category" value={selectedCategory} />
          <SummaryRow label="Date" value={new Date(pendingTransaction?.transactionDate ?? Date.now()).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })} />
          <SummaryRow label="Payment method" value={paymentMethodLabel(paymentMethod)} />
          <SummaryRow label="Invoice number" value={invoiceNumber.trim() || "Not provided"} />
          <SummaryRow label="Description" value={description.trim() || "Not provided"} last />
        </View>
      </View>
    </BottomSheet>
  </>;
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.summaryRow, last && styles.summaryRowLast]}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

function formatAmount(value: string) {
  return Number(value).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function paymentMethodLabel(value: PaymentMethod) {
  return value === "MOMO" ? "MoMo" : value === "BANK" ? "Bank" : "Cash";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 35 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  title: { color: colors.ink, fontSize: 21, fontWeight: "800" },
  subtitle: {
    color: colors.slate,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 22,
  },
  typeSwitch: {
    flexDirection: "row",
    backgroundColor: colors.line,
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  typeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 11,
  },
  typeIncome: { backgroundColor: colors.income },
  typeExpense: { backgroundColor: colors.expense },
  typeText: { color: colors.slate, fontWeight: "800", fontSize: 13 },
  activeTypeText: { color: colors.surface },
  label: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 14,
  },
  optional: { color: colors.muted, fontWeight: "500" },
  amountBox: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  currency: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: "800",
    marginRight: 9,
  },
  amountInput: { flex: 1, color: colors.ink, fontSize: 26, fontWeight: "800" },
  dateControl: { minHeight: 52, backgroundColor: colors.surface, borderRadius: 13, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  dateText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: "700" },
  categoryList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  category: {
    backgroundColor: colors.surface,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  selectedCategory: { backgroundColor: colors.forest },
  categoryText: { color: colors.slate, fontSize: 12, fontWeight: "700" },
  selectedCategoryText: { color: colors.surface },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: 13,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 14,
  },
  multiline: { height: 80, paddingTop: 14, textAlignVertical: "top" },
  payment: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 13,
    padding: 15,
    marginTop: 18,
  },
  paymentText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 10,
  },
  cash: { color: colors.slate, fontSize: 13 },
  error: { color: colors.expense, fontSize: 12, marginTop: 14 },
  save: {
    height: 54,
    borderRadius: 15,
    backgroundColor: colors.honey,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: colors.forestDark, fontWeight: "800", fontSize: 15 },
  confirmContent: { paddingHorizontal: 20, paddingBottom: 24, alignItems: "center" },
  confirmBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  confirmIncome: { backgroundColor: colors.incomeSoft },
  confirmExpense: { backgroundColor: colors.expenseSoft },
  confirmBadgeText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  confirmAmount: { fontSize: 30, fontWeight: "800", marginTop: 12 },
  confirmHint: { color: colors.slate, fontSize: 13, marginTop: 6, marginBottom: 18 },
  summaryCard: { width: "100%", backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 15 },
  summaryRow: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryLabel: { color: colors.slate, fontSize: 11, fontWeight: "700", marginBottom: 4 },
  summaryValue: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  confirmActions: { flexDirection: "row", gap: 10 },
  backButton: { flex: 1, minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  backButtonText: { color: colors.slate, fontSize: 14, fontWeight: "800" },
  confirmButton: { flex: 1 },
});
