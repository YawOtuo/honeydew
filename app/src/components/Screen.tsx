import { PropsWithChildren, ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type ScreenProps = PropsWithChildren<{
  floatingAction?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({ children, floatingAction, refreshing, onRefresh }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, floatingAction ? styles.contentWithFloatingAction : null]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} progressBackgroundColor={colors.surface} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      {floatingAction ? <View style={styles.floatingAction}>{floatingAction}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, padding: 20, paddingBottom: 30 },
  contentWithFloatingAction: { paddingBottom: 100 },
  floatingAction: { position: 'absolute', left: 20, right: 20, bottom: 16 },
});
