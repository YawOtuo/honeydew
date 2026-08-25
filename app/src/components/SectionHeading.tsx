import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  action: { color: colors.forest, fontSize: 13, fontWeight: '700' },
});
