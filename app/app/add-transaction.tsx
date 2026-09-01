import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { createTransaction, updateTransaction } from "@/api/client";
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
  const [error, setError] = useState("");
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
  }, [transaction]);
  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof createTransaction>[1]) => isEditing ? updateTransaction(token!, id!, body) : createTransaction(token!, body),
    onSuccess: async () => {
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
    onError: (saveError) => setError(saveError instanceof Error ? saveError.message : "Unable to save transaction."),
  });

  async function save() {
    if (!token) return;
    setError("");
    if (!amount || Number(amount) <= 0 || !categoryId) {
      setError("Enter an amount and choose a category.");
      return;
    }
    createMutation.mutate({
        type,
        amount,
        categoryId,
        transactionDate: new Date().toISOString(),
        description: description || undefined,
        invoiceNumber: invoiceNumber || undefined,
        paymentMethod: "CASH",
      });
  }

  function closeSheet() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  return (
     <BottomSheet visible onClose={closeSheet} title={isEditing ? "Edit transaction" : "Add transaction"} height={Math.round(Dimensions.get("window").height * 0.88)} footer={<Button style={styles.save} onPress={save} loading={createMutation.isPending}>{isEditing ? "Save changes" : "Save transaction"}</Button>}>
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
        <Select label="Category" value={categoryId} onChange={setCategoryId} placeholder={categoriesQuery.isLoading ? "Loading categories..." : "Choose a category"} emptyMessage={categoriesQuery.isError ? "Unable to load categories." : "No categories available."} options={availableCategories.map((category) => ({ label: category.name, value: category.id }))} />
        <Input label="Invoice number" placeholder="e.g. INV-001" value={invoiceNumber} onChangeText={setInvoiceNumber} />
        <Input label="Description" placeholder="Add some context" value={description} onChangeText={setDescription} multiline style={styles.multiline} />
        <View style={styles.payment}>
          <Ionicons name="cash-outline" size={20} color={colors.forest} />
          <Text style={styles.paymentText}>Payment method</Text>
          <Text style={styles.cash}>Cash</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </BottomSheet>
  );
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
});
