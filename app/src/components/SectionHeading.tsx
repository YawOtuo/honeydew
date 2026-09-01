import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/theme';

export function SectionHeading({ title, action, onActionPress }: { title: string; action?: string; onActionPress?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <TouchableOpacity onPress={onActionPress} disabled={!onActionPress} activeOpacity={0.7}><Text style={styles.action}>{action}</Text></TouchableOpacity> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  action: { color: colors.forest, fontSize: 13, fontWeight: '700' },
});
