import { BottomSheetBackdrop, BottomSheetFooter, BottomSheetModal, BottomSheetScrollView, BottomSheetView, type BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Keyboard, type NativeScrollEvent, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type BottomSheetProps = PropsWithChildren<{ visible: boolean; onClose: () => void; title?: string; height?: number; footer?: React.ReactNode }>;

export function BottomSheet({ visible, onClose, title, height, footer, children }: BottomSheetProps) {
  const modalRef = useRef<BottomSheetModal>(null);
  const presentedRef = useRef(false);
  const viewportRef = useRef<View>(null);
  const scrollRef = useRef<React.ComponentRef<typeof BottomSheetScrollView>>(null);
  const offsetRef = useRef(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const insets = useSafeAreaInsets();

  // Dismissing a modal that was never presented leaves gorhom stuck on the DISMISSING
  // status, and it then silently skips registering the portal on the next present() -
  // the sheet mounts but renders nowhere. Only ever dismiss what we actually presented.
  useEffect(() => {
    if (visible) {
      if (presentedRef.current) return;
      presentedRef.current = true;
      modalRef.current?.present();
      return;
    }
    if (!presentedRef.current) return;
    presentedRef.current = false;
    modalRef.current?.dismiss();
  }, [visible]);

  // The keyboard shrinks the sheet (the app window is in Android's resize mode), but
  // nothing scrolls the focused field back into the smaller viewport - gorhom only does
  // that for its own BottomSheetTextInput. Runs on layout, so it fires as the sheet shrinks.
  const revealFocusedInput = useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput();
    if (!input || !viewportRef.current) return;
    viewportRef.current.measureInWindow((_viewportX, viewportY, _viewportWidth, viewportHeight) => {
      input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
        const overflow = inputY + inputHeight + 24 - (viewportY + viewportHeight);
        if (overflow > 0) scrollRef.current?.scrollTo({ y: offsetRef.current + overflow, animated: true });
      });
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    const subscription = Keyboard.addListener('keyboardDidShow', revealFocusedInput);
    return () => subscription.remove();
  }, [visible, revealFocusedInput]);

  const handleScroll = useCallback(({ nativeEvent }: { nativeEvent: NativeScrollEvent }) => { offsetRef.current = nativeEvent.contentOffset.y; }, []);
  const renderBackdrop = useCallback((props: React.ComponentProps<typeof BottomSheetBackdrop>) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />, []);
  const renderFooter = useCallback((props: BottomSheetFooterProps) => <BottomSheetFooter {...props} bottomInset={0}><View style={styles.footer} onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}>{footer}</View></BottomSheetFooter>, [footer]);
  const handleDismiss = useCallback(() => { presentedRef.current = false; onClose(); }, [onClose]);

  // The footer is an overlay pinned to the sheet's bottom edge, so the scrollable content
  // has to reserve room for whatever it actually measures - a single button or a stack.
  const contentStyle = useMemo(() => footer ? [styles.content, { paddingBottom: footerHeight + 16 }] : styles.content, [footer, footerHeight]);

  const body = <><View style={styles.header}><Text style={styles.title}>{title}</Text><Pressable onPress={() => modalRef.current?.dismiss()} hitSlop={10} accessibilityLabel="Close"><Text style={styles.close}>×</Text></Pressable></View><View ref={viewportRef} style={styles.scrollRegion} onLayout={revealFocusedInput} collapsable={false}><BottomSheetScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={contentStyle} onScroll={handleScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</BottomSheetScrollView></View></>;

  // BottomSheetView is absolutely positioned and sizes to its content, so flex children
  // never fill it - it is only useful for measuring content when dynamic sizing is on.
  // With a fixed snap point the sheet body already has a definite height, so the
  // scroll view can flex and the footer overlay lands on the sheet's bottom edge.
  return <BottomSheetModal ref={modalRef} index={0} onDismiss={handleDismiss} stackBehavior="push" snapPoints={height ? [height] : undefined} enableDynamicSizing={!height} maxDynamicContentSize={Dimensions.get('window').height - insets.top - 24} bottomInset={insets.bottom} backdropComponent={renderBackdrop} footerComponent={footer ? renderFooter : undefined} enablePanDownToClose backgroundStyle={styles.background} handleIndicatorStyle={styles.handle} keyboardBehavior="extend" keyboardBlurBehavior="restore" android_keyboardInputMode="adjustPan">{height ? body : <BottomSheetView style={styles.column}>{body}</BottomSheetView>}</BottomSheetModal>;
}

const styles = StyleSheet.create({ background: { backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, handle: { backgroundColor: colors.line, width: 42 }, column: { flex: 1, flexDirection: 'column', minHeight: 0 }, header: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32, paddingHorizontal: 20, paddingVertical: 14 }, scrollRegion: { flex: 1, minHeight: 0 }, scroll: { flex: 1 }, title: { color: colors.ink, fontSize: 19, fontWeight: '800' }, close: { color: colors.slate, fontSize: 28, lineHeight: 28 }, content: { flexGrow: 1, padding: 20, paddingBottom: 8 }, footer: { flexShrink: 0, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.canvas, paddingHorizontal: 20, paddingVertical: 12 } });
