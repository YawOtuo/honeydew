import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, KeyboardAvoidingViewProps, Platform, ScrollView, ScrollViewProps, StyleSheet } from 'react-native';

type Props = PropsWithChildren<ScrollViewProps & Pick<KeyboardAvoidingViewProps, 'keyboardVerticalOffset'>>;

export function KeyboardAwareScrollView({ children, keyboardVerticalOffset = 0, contentContainerStyle, ...props }: Props) {
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={keyboardVerticalOffset}>
      <ScrollView {...props} contentContainerStyle={contentContainerStyle} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
