import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type BottomSheetProps = PropsWithChildren<{ visible: boolean; onClose: () => void; title?: string; height?: number }>;

export function BottomSheet({ visible, onClose, title, height, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.overlay}><Pressable style={styles.backdrop} onPress={onClose} /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.sheet, height ? { height } : undefined, { paddingBottom: Math.max(insets.bottom, 16) }]}><View style={styles.handle} /><View style={styles.header}><Text style={styles.title}>{title}</Text><Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close"><Text style={styles.close}>×</Text></Pressable></View><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView></KeyboardAvoidingView></View></Modal>;
}

const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end' }, backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 30, 24, 0.42)' }, sheet: { maxHeight: '92%', minHeight: 220, backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }, handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: colors.line, marginTop: 10 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }, title: { color: colors.ink, fontSize: 19, fontWeight: '800' }, close: { color: colors.slate, fontSize: 28, lineHeight: 28 }, content: { padding: 20, paddingBottom: 8 } });
