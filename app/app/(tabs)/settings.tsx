import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { colors } from '@/theme';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  return <Screen><Text style={styles.title}>Settings</Text><Text style={styles.subtitle}>Manage your Honeydew account.</Text><Card style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{user?.email.charAt(0).toUpperCase() ?? 'A'}</Text></View><View><Text style={styles.name}>{user?.email ?? 'Signed-in user'}</Text><Text style={styles.email}>Ghana · Africa/Accra</Text></View><View style={styles.role}><Text style={styles.roleText}>{user?.role}</Text></View></Card><Card style={styles.card}>{isAdmin ? <><SettingRow icon="people-outline" label="Manage users" onPress={() => router.push('/admin-users')} /><SettingRow icon="shield-checkmark-outline" label="Audit history" onPress={() => router.push('/audit')} /></> : null}<SettingRow icon="log-out-outline" label="Log out" danger onPress={() => void signOut()} /></Card></Screen>;
}

function SettingRow({ icon, label, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; danger?: boolean; onPress: () => void }) { return <TouchableOpacity style={styles.row} onPress={onPress}><Ionicons name={icon} size={20} color={danger ? colors.expense : colors.forest} /><Text style={[styles.rowText, danger && { color: colors.expense }]}>{label}</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></TouchableOpacity>; }

const styles = StyleSheet.create({ title: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 10 }, subtitle: { color: colors.slate, fontSize: 14, marginTop: 6, marginBottom: 22 }, profile: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, avatar: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.honeySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, avatarText: { color: colors.forest, fontWeight: '800', fontSize: 20 }, name: { color: colors.ink, fontWeight: '800', fontSize: 15 }, email: { color: colors.slate, fontSize: 12, marginTop: 4 }, role: { marginLeft: 'auto', backgroundColor: colors.incomeSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }, roleText: { color: colors.income, fontSize: 10, fontWeight: '800' }, card: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 17 }, row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line }, rowText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700', marginLeft: 12 } });
