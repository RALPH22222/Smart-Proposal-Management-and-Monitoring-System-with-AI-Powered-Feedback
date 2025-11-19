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
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types/navigation'; // << changed path

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // removed unused handleLogin (Sign in now opens the dev-role modal)
  function handleDevChoice(role: 'proponent' | 'evaluators' | 'roec' | 'admin') {
    setShowDevModal(false);
    // Adjust route names below to match your navigation stack.
    switch (role) {
      case 'proponent':
        navigation.navigate('ProponentDashboard' as never);
        return;
      case 'evaluators':
        navigation.navigate('EvaluatorDashboard' as never);
        return;
      case 'roec':
        navigation.navigate('RoecDashboard' as never);
        return;
      case 'admin':
        navigation.navigate('AdminDashboard' as never);
        return;
    }
  }

  const handleReset = () => {
    setEmail('');
    setPassword('');
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Login', 'Google authentication not yet integrated.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Right Side - Illustration */}
      <View style={styles.bannerContainer}>
        <Image
          source={require('../assets/images/LOGO.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.bannerTitle}>Project Proposal</Text>
        <Text style={styles.bannerSubtitle}>
          Create, submit and track project proposals — fast, simple, and secure.
        </Text>
      </View>
      {/* Left Side - Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>
          Use your institutional account or continue with Google.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => setShowDevModal(true)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={() => {
              setEmail('');
              setPassword('');
            }}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.googleSection}>
          <Text style={styles.orText}>or continue with</Text>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Image
              source={require('../assets/images/google-icon.png')}
              style={styles.googleIcon}
            />
            <Text style={styles.googleText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.registerText}>
          Don’t have an account?{' '}
          <Text
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            Create one
          </Text>
        </Text>
      </View>

      {/* Development-only role selection modal */}
      <Modal visible={showDevModal} transparent animationType="fade" onRequestClose={() => setShowDevModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Development login (for dev only)</Text>
            <Text style={styles.devNote}>Note: Development purpose only — pick a role to simulate login.</Text>

            <View style={{ marginTop: 12 }}>
              <Pressable style={styles.roleButton} onPress={() => handleDevChoice('proponent')}>
                <Text style={styles.roleButtonText}>Proponent</Text>
              </Pressable>
              <Pressable style={styles.roleButton} onPress={() => handleDevChoice('evaluators')}>
                <Text style={styles.roleButtonText}>Evaluators</Text>
              </Pressable>
              <Pressable style={styles.roleButton} onPress={() => handleDevChoice('roec')}>
                <Text style={styles.roleButtonText}>ROEC</Text>
              </Pressable>
              <Pressable style={styles.roleButton} onPress={() => handleDevChoice('admin')}>
                <Text style={styles.roleButtonText}>Admin</Text>
              </Pressable>
            </View>

            <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowDevModal(false)}>
                <Text style={{ color: '#C8102E', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  formContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#C8102E',
  },
  resetButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  googleSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  orText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  googleText: {
    color: '#333',
    fontSize: 15,
  },
  registerText: {
    marginTop: 20,
    fontSize: 14,
    color: '#555',
  },
  registerLink: {
    color: '#C8102E',
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 340,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  devNote: {
    fontSize: 12,
    color: '#666',
  },
  roleButton: {
    backgroundColor: '#F3F3F3',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  roleButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#111',
  },
});
