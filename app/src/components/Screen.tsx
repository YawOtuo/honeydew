import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export function Screen({ children, floatingAction }: PropsWithChildren<{ floatingAction?: ReactNode }>) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, floatingAction ? styles.contentWithFloatingAction : null]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {floatingAction ? <View style={styles.floatingAction}>{floatingAction}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, paddingBottom: 30 },
  contentWithFloatingAction: { paddingBottom: 100 },
  floatingAction: { position: 'absolute', left: 20, right: 20, bottom: 16 },
});
