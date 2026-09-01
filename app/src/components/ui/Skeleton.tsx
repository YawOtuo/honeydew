import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/theme';

type SkeletonProps = { width?: ViewStyle['width']; height: ViewStyle['height']; radius?: number; style?: ViewStyle };

export function Skeleton({ width = '100%', height, radius = 8, style }: SkeletonProps) {
  return <View style={[styles.block, { width, height, borderRadius: radius }, style]} />;
}

export function SkeletonText({ width = '100%', height = 12, style }: { width?: ViewStyle['width']; height?: ViewStyle['height']; style?: ViewStyle }) {
  return <Skeleton width={width} height={height} radius={6} style={style} />;
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return <View>{Array.from({ length: count }, (_, index) => <View key={index} style={styles.row}><Skeleton width={42} height={42} radius={14} /><View style={styles.details}><SkeletonText width="58%" /><SkeletonText width="78%" height={10} style={styles.description} /></View><SkeletonText width={62} height={12} /></View>)}</View>;
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 66, borderBottomWidth: 1, borderBottomColor: colors.line },
  details: { flex: 1, marginHorizontal: 12 },
  description: { marginTop: 8 },
});
