import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { createUser, getUsers, User } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";

export default function AdminUsersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "ACCOUNTANT">("ACCOUNTANT");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (token)
      void getUsers(token)
        .then(setUsers)
        .catch(() => setError("Unable to load users."));
  }, [token]);
  async function save() {
    if (!token || !email || password.length < 8) {
      setError("Enter an email and a password with at least 8 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await createUser(token, { email, password, role });
      setUsers((current) => [
        ...current,
        { ...created, createdAt: new Date().toISOString() },
      ]);
      setEmail("");
      setPassword("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create user.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Manage users</Text>
      <Text style={styles.subtitle}>Create accounts for the school team.</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="person@school.edu.gh"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>Temporary password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>Role</Text>
        <View style={styles.roles}>
          <TouchableOpacity
            style={[styles.role, role === "ACCOUNTANT" && styles.selected]}
            onPress={() => setRole("ACCOUNTANT")}
          >
            <Text style={styles.roleText}>Accountant</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.role, role === "ADMIN" && styles.selected]}
            onPress={() => setRole("ADMIN")}
          >
            <Text style={styles.roleText}>Admin</Text>
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.button}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.forestDark} />
          ) : (
            <Text style={styles.buttonText}>Create user</Text>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.section}>Existing users</Text>
      {users.map((item) => (
        <View style={styles.user} key={item.id}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.email.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userRole}>{item.role}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, paddingBottom: 40 },
  back: { color: colors.forest, fontWeight: "800", marginTop: 12 },
  title: { color: colors.ink, fontSize: 27, fontWeight: "800", marginTop: 24 },
  subtitle: {
    color: colors.slate,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  form: { backgroundColor: colors.surface, borderRadius: 20, padding: 17 },
  label: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 7,
  },
  input: {
    height: 49,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    color: colors.ink,
  },
  roles: { flexDirection: "row", gap: 8 },
  role: {
    flex: 1,
    borderRadius: 11,
    padding: 11,
    alignItems: "center",
    backgroundColor: colors.canvas,
  },
  selected: { backgroundColor: colors.forest },
  roleText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  error: { color: colors.expense, fontSize: 12, marginTop: 12 },
  button: {
    height: 50,
    borderRadius: 13,
    backgroundColor: colors.honey,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  buttonText: { color: colors.forestDark, fontWeight: "800" },
  section: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 25,
    marginBottom: 10,
  },
  user: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.honeySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: { color: colors.forest, fontWeight: "800" },
  userEmail: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  userRole: { color: colors.slate, fontSize: 11, marginTop: 3 },
});
