import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type BottomSheetProps = PropsWithChildren<{ visible: boolean; onClose: () => void; title?: string; height?: number; footer?: React.ReactNode }>;

export function BottomSheet({ visible, onClose, title, height, footer, children }: BottomSheetProps) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) modalRef.current?.present();
    else modalRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback((props: React.ComponentProps<typeof BottomSheetBackdrop>) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />, []);
  const handleDismiss = useCallback(() => onClose(), [onClose]);

  return <BottomSheetModal ref={modalRef} onDismiss={handleDismiss} snapPoints={height ? [height] : undefined} enableDynamicSizing={!height} maxDynamicContentSize={Dimensions.get('window').height - insets.top - 24} backdropComponent={renderBackdrop} enablePanDownToClose backgroundStyle={styles.background} handleIndicatorStyle={styles.handle} keyboardBehavior="interactive" keyboardBlurBehavior="restore" android_keyboardInputMode="adjustResize"><BottomSheetView style={styles.column}><View style={styles.header}><Text style={styles.title}>{title}</Text><Pressable onPress={() => modalRef.current?.dismiss()} hitSlop={10} accessibilityLabel="Close"><Text style={styles.close}>×</Text></Pressable></View><BottomSheetScrollView contentContainerStyle={[styles.content, footer ? styles.contentWithFooter : null]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</BottomSheetScrollView>{footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View> : null}</BottomSheetView></BottomSheetModal>;
}

const styles = StyleSheet.create({ background: { backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, handle: { backgroundColor: colors.line, width: 42 }, column: { maxHeight: '92%', minHeight: 220 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }, title: { color: colors.ink, fontSize: 19, fontWeight: '800' }, close: { color: colors.slate, fontSize: 28, lineHeight: 28 }, content: { padding: 20, paddingBottom: 8 }, contentWithFooter: { paddingBottom: 92 }, footer: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.canvas, paddingHorizontal: 20, paddingTop: 12 } });
