import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
// import your backend helpers if available
// import { sendOtp, verifyOtp } from '../services/auth/authService';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleSendOtp = async () => {
    if (!email) return Alert.alert('Email required', 'Please enter your email.');

    try {
      setLoading(true);
      // await sendOtp(email);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate API
      setOtpSent(true);
      Alert.alert('OTP sent', 'Check your email for the verification code.');
    } catch {
      Alert.alert('Send failed', 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert('OTP required', 'Please enter the OTP.');

    try {
      setLoading(true);
      // const res = await verifyOtp(email, otp);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate API
      setOtpVerified(true);
      Alert.alert('Verified', 'Email verified — you can complete your registration now.');
    } catch {
      Alert.alert('Verification failed', 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!otpVerified)
      return Alert.alert('Verify email first', 'Please verify your email before proceeding.');

    if (!name || !password)
      return Alert.alert('Missing fields', 'Please provide name and password.');

    try {
      setLoading(true);
      const response = await fetch('https://your-api-url.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'Proponent' }),
      });

      if (!response.ok) throw new Error('Registration failed');

      Alert.alert('Success', 'Account created successfully.');
      setEmail('');
      setOtp('');
      setName('');
      setPassword('');
      setOtpSent(false);
      setOtpVerified(false);
      navigation.navigate('Login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setOtp('');
    setName('');
    setPassword('');
    setOtpSent(false);
    setOtpVerified(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Left Section (Logo) */}
        <View style={styles.bannerContainer}>
        <Image
          source={require('../assets/images/LOGO.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.bannerTitle}>Project Proposal</Text>
        <Text style={styles.bannerSubtitle}>
          Create, submit, and track project proposals — fast, simple, and secure.
        </Text>
      </View>

      {/* Right Section (Form) */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>Sign up</Text>
        <Text style={styles.subtitle}>
          Start by verifying your institutional email. Other fields will unlock after verification.
        </Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            editable={!otpVerified}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* OTP Controls */}
        <View style={styles.otpRow}>
          <TouchableOpacity
            style={[styles.button, styles.sendOtpBtn]}
            onPress={handleSendOtp}
            disabled={loading || otpVerified}
          >
            <Text style={styles.buttonText}>
              {otpSent ? 'Resend OTP' : 'Send OTP'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[
              styles.otpInput,
              (!otpSent || otpVerified) && styles.disabledInput,
            ]}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            editable={otpSent && !otpVerified}
          />

          <TouchableOpacity
            style={[styles.button, styles.verifyBtn]}
            onPress={handleVerifyOtp}
            disabled={!otpSent || loading || otpVerified}
          >
            <Text style={styles.verifyText}>Verify</Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            editable={otpVerified}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={otpVerified}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.registerBtn]}
            onPress={handleRegister}
            disabled={!otpVerified || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetBtn]}
            onPress={handleReset}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            Sign in
          </Text>
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  bannerContainer: {
    backgroundColor: '#C8102E',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 6,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  registerBtn: {
    backgroundColor: '#C8102E',
  },
  resetBtn: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sendOtpBtn: {
    backgroundColor: '#C8102E',
    flex: 1.2,
  },
  verifyBtn: {
    backgroundColor: '#eee',
    flex: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  verifyText: {
    color: '#333',
    fontWeight: '600',
  },
  resetText: {
    color: '#333',
    fontWeight: '600',
  },
  loginText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  },
  loginLink: {
    color: '#C8102E',
    fontWeight: '600',
  },
});
