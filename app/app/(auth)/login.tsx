import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';
import { Button, Input, KeyboardAwareScrollView } from '@/components/ui';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!email.trim() || password.length < 8) {
      setError('Enter a valid email and a password with at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return <SafeAreaView style={styles.safe}><KeyboardAwareScrollView style={styles.scroll} contentContainerStyle={[styles.container, styles.scrollContent]}><View style={styles.brand}><View style={styles.logo}><Ionicons name="leaf" size={26} color={colors.forest} /></View><Text style={styles.brandName}>honeydew</Text><Text style={styles.tagline}>School finances, made clear.</Text></View><View style={styles.form}><Input label="Email address" autoCapitalize="none" keyboardType="email-address" placeholder="you@school.edu.gh" value={email} onChangeText={setEmail} /><Input label="Password" secureTextEntry={!showPassword} autoCapitalize="none" placeholder="Enter your password" value={password} onChangeText={setPassword} rightElement={<TouchableOpacity onPress={() => setShowPassword((visible) => !visible)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} /></TouchableOpacity>} />{error ? <Text style={styles.error}>{error}</Text> : null}<Button onPress={handleSubmit} loading={isSubmitting} style={styles.button}>Sign in</Button><Text style={styles.help}>Contact your school administrator if you need access.</Text></View></KeyboardAwareScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, scroll: { backgroundColor: colors.canvas }, container: { flex: 1, padding: 24, backgroundColor: colors.canvas }, scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }, brand: { alignItems: 'center', marginBottom: 48 }, logo: { width: 58, height: 58, borderRadius: 21, backgroundColor: colors.honeySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, brandName: { color: colors.forest, fontSize: 30, fontWeight: '800', letterSpacing: -1 }, tagline: { color: colors.slate, fontSize: 13, marginTop: 5 }, form: { backgroundColor: 'transparent', borderRadius: 24, padding: 22 }, title: { color: colors.ink, fontSize: 24, fontWeight: '800' }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 24 }, label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 12 }, input: { height: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 14, color: colors.ink, fontSize: 14 }, inputWrapper: { height: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 13, flexDirection: 'row', alignItems: 'center' }, passwordInput: { flex: 1, height: '100%', paddingHorizontal: 14, color: colors.ink, fontSize: 14 }, visibilityButton: { padding: 14 }, error: { color: colors.expense, fontSize: 12, lineHeight: 17, marginTop: 12 }, button: { backgroundColor: colors.honey, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, buttonText: { color: colors.forestDark, fontSize: 15, fontWeight: '800' }, help: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 18 } });
