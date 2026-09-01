import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type ToastType = 'success' | 'error';
type ToastContextValue = { showToast: (message: string, type?: ToastType) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const insets = useSafeAreaInsets();
  const value = useMemo(() => ({ showToast: (message: string, type: ToastType = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 2800); } }), []);
  return <ToastContext.Provider value={value}>{children}{toast ? <View pointerEvents="none" style={[styles.toast, { top: insets.top + 12 }, toast.type === 'error' ? styles.error : styles.success]}><Text style={styles.text}>{toast.message}</Text></View> : null}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider.');
  return context;
}

const styles = StyleSheet.create({ toast: { position: 'absolute', left: 20, right: 20, borderRadius: 14, padding: 14, zIndex: 10, elevation: 5 }, success: { backgroundColor: colors.income }, error: { backgroundColor: colors.expense }, text: { color: colors.surface, fontSize: 13, fontWeight: '700', textAlign: 'center' } });
