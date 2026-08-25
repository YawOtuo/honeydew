import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.brand}><View style={styles.logo}><Ionicons name="leaf" size={26} color={colors.forest} /></View><Text style={styles.brandName}>honeydew</Text><Text style={styles.tagline}>School finances, made clear.</Text></View><View style={styles.form}><Text style={styles.title}>Welcome back</Text><Text style={styles.subtitle}>Sign in to manage your school’s finances.</Text><Text style={styles.label}>Email address</Text><TextInput autoCapitalize="none" keyboardType="email-address" placeholder="you@school.edu.gh" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} style={styles.input} /><Text style={styles.label}>Password</Text><TextInput secureTextEntry placeholder="Enter your password" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} style={styles.input} />{error ? <Text style={styles.error}>{error}</Text> : null}<TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.85}>{isSubmitting ? <ActivityIndicator color={colors.forestDark} /> : <Text style={styles.buttonText}>Sign in</Text>}</TouchableOpacity><Text style={styles.help}>Contact your school administrator if you need access.</Text></View></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, container: { flex: 1, padding: 24, justifyContent: 'center' }, brand: { alignItems: 'center', marginBottom: 48 }, logo: { width: 58, height: 58, borderRadius: 21, backgroundColor: colors.honeySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, brandName: { color: colors.forest, fontSize: 30, fontWeight: '800', letterSpacing: -1 }, tagline: { color: colors.slate, fontSize: 13, marginTop: 5 }, form: { backgroundColor: colors.surface, borderRadius: 24, padding: 22 }, title: { color: colors.ink, fontSize: 24, fontWeight: '800' }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 24 }, label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 12 }, input: { height: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 14, color: colors.ink, fontSize: 14 }, error: { color: colors.expense, fontSize: 12, lineHeight: 17, marginTop: 12 }, button: { backgroundColor: colors.honey, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, buttonText: { color: colors.forestDark, fontSize: 15, fontWeight: '800' }, help: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 18 } });
