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
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const handleSignInPress = () => {
    setModalVisible(true);
  };
  const handleRoleSelect = async (role: string) => {
    setModalVisible(false); 
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmail('');
      setPassword('');
      switch (role) {
        case 'Admin':
          navigation.navigate('AdminDashboard'); 
          break;

        case 'Evaluator':
          navigation.navigate('EvaluatorDashboard');
          break;

        case 'Proponent':
          navigation.navigate('ProponentsDashboard');
          break;

        case 'RND':
          navigation.navigate('RndDashboard');
          break;

        default:
          Alert.alert('Login Success', `Welcome back! Signed in as ${role}.`);
          break;
      }
    }, 1500);
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
  };

  const handleGoogleLogin = () => {
    Alert.alert('Frontend Info', 'Google Login logic (Firebase/Auth) goes here.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Left Section (Logo / Banner) */}
        <View style={styles.bannerContainer}>
        {/* NOTE: In your local project, use require('../assets/images/LOGO.png') */}
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
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>
          Use your institutional account or continue with Google.
        </Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
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
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryBtn]}
            onPress={handleSignInPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetBtn]}
            onPress={handleReset}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Google Sign In */}
        <View style={styles.dividerContainer}>
          <Text style={styles.dividerText}>or continue with</Text>
        </View>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Dont have an account?{' '}
          <Text
            style={styles.linkText}
            onPress={() => navigation.navigate('Register')}
          >
            Sign up
          </Text>
        </Text>
      </View>

      {/* ROLE SELECTION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* TouchableWithoutFeedback closes modal when clicking outside */}
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            {/* Prevent clicks inside the modal content from closing it */}
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Role</Text>
                <Text style={styles.modalSubtitle}>
                  Please select your role to proceed.
                </Text>

                <View style={styles.roleList}>
                  <TouchableOpacity
                    style={styles.roleButton}
                    onPress={() => handleRoleSelect('Admin')}
                  >
                    <Text style={styles.roleButtonText}>Admin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.roleButton}
                    onPress={() => handleRoleSelect('Evaluator')}
                  >
                    <Text style={styles.roleButtonText}>Evaluator</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.roleButton}
                    onPress={() => handleRoleSelect('Proponent')}
                  >
                    <Text style={styles.roleButtonText}>Proponent</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.roleButton}
                    onPress={() => handleRoleSelect('RND')}
                  >
                    <Text style={styles.roleButtonText}>RND</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  // Banner Styles (Matched to Register.tsx)
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
  // Form Styles
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
    marginBottom: 24,
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
    backgroundColor: '#fff',
    color: '#1F2937',
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
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#C8102E',
  },
  resetBtn: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resetText: {
    color: '#333',
    fontWeight: '600',
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  googleButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  },
  linkText: {
    color: '#C8102E',
    fontWeight: '600',
  },
  // Modal Specific Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dimmed background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    // Shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  roleList: {
    width: '100%',
    gap: 12, // Spacing between buttons
    marginBottom: 16,
  },
  roleButton: {
    backgroundColor: '#C8102E',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});