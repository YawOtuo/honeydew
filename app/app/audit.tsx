import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AuditEntry, getAudit } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function AuditScreen() { const router = useRouter(); const { token } = useAuth(); const [items, setItems] = useState<AuditEntry[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { if (token) void getAudit(token).then((response) => setItems(response.items)).finally(() => setLoading(false)); }, [token]); return <ScrollView style={styles.safe} contentContainerStyle={styles.content}><TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity><Text style={styles.title}>Audit history</Text><Text style={styles.subtitle}>A permanent record of important actions.</Text>{loading ? <ActivityIndicator color={colors.forest} /> : items.map((item) => <View style={styles.item} key={item.id}><View style={styles.dot} /><View style={styles.details}><Text style={styles.action}>{item.action.replaceAll('_', ' ')}</Text><Text style={styles.meta}>{item.actor?.email ?? 'System'} · {new Date(item.createdAt).toLocaleString('en-GH')}</Text></View></View>)}</ScrollView>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 40 }, back: { color: colors.forest, fontWeight: '800', marginTop: 12 }, title: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 24 }, subtitle: { color: colors.slate, fontSize: 14, marginTop: 6, marginBottom: 22 }, item: { backgroundColor: colors.surface, borderRadius: 15, padding: 14, flexDirection: 'row', marginBottom: 8 }, dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.honey, marginTop: 5, marginRight: 11 }, details: { flex: 1 }, action: { color: colors.ink, fontSize: 13, fontWeight: '800', textTransform: 'capitalize' }, meta: { color: colors.slate, fontSize: 11, marginTop: 5 } });
