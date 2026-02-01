import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, 
  Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, ImageBackground 
} from "react-native";
import { useRouter, Stack } from "expo-router"; 
import { Feather } from "@expo/vector-icons"; 
import { api } from "../../utils/axios"; 
import axios from "axios"; 

// 1. IMPORT AUTH CONTEXT
import { useAuthContext } from "../../context/AuthContext"; 

export default function LoginScreen() {
  const router = useRouter();
  
  // 2. GET LOGIN FUNCTION FROM CONTEXT
  const { login } = useAuthContext(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWebWarning, setShowWebWarning] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Missing fields", "Please provide email and password.");
    }

    try {
      setLoading(true);

      // 1. Send Request
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      
      // 2. Extract Role
      const rawRole = data.user?.role || data.user?.roles || data.user?.user_metadata?.role || data.user?.user_metadata?.roles;

      if (!rawRole) throw new Error("No role assigned to this user.");

      const userRoles = Array.isArray(rawRole) ? rawRole : [rawRole];

      // 3. Check Multiple Roles
      if (userRoles.length > 1) {
        setLoading(false);
        setShowWebWarning(true); 
        return;
      }

      // 4. Validate Single Role
      const primaryRole = userRoles[0].toLowerCase();
      const allowedRoles = ["proponent", "lead_proponent"];

      if (allowedRoles.includes(primaryRole)) {
        
        // --- 5. CRITICAL FIX: SAVE USER TO CONTEXT ---
        // This tells the whole app (Dashboard/Profile) who just logged in.
        login({
          id: data.user.id, // The Real DB ID
          email: data.user.email,
          first_name: data.user.user_metadata?.first_name || "Proponent",
          last_name: data.user.user_metadata?.last_name || "",
          role: primaryRole
        });
        // ---------------------------------------------

        // Navigate to Dashboard
        router.push("/pages/dashboard" as any); 

      } else {
        setLoading(false);
        setShowWebWarning(true);
      }

    } catch (err: any) {
      setLoading(false);
      let message = "An unexpected error occurred.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || "Connection failed. Please check your internet.";
      } else {
        message = err.message;
      }
      Alert.alert("Login Failed", message);
    } 
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#fff" }}>
        
        {/* Banner */}
        <ImageBackground source={require('../../assets/images/image.png')} style={styles.banner}>
          <View style={styles.overlay} />
          <View style={styles.bannerContent}>
             <Image source={require('../../assets/images/LOGO.png')} style={styles.logo} />
            <Text style={styles.bannerTitle}>Project Proposal</Text>
            <Text style={styles.bannerSubtitle}>Create, submit and track project proposals.</Text>
          </View>
        </ImageBackground>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.headerTitle}>Sign in</Text>
          <Text style={styles.headerSubtitle}>Use your institutional account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Email address" 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address" 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, loading && styles.disabledButton]} 
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Warning Modal */}
      <Modal visible={showWebWarning} transparent={true} animationType="slide" onRequestClose={() => setShowWebWarning(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.warningContent}>
            <View style={styles.warningIconContainer}>
              <Feather name="monitor" size={40} color="#C8102E" />
            </View>
            <Text style={styles.warningTitle}>Desktop Access Required</Text>
            <Text style={styles.warningText}>Your account requires the desktop version.</Text>
            <TouchableOpacity style={styles.warningButton} onPress={() => setShowWebWarning(false)}>
              <Text style={styles.warningButtonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ... (Keep your styles exactly the same) ...
const styles = StyleSheet.create({
  banner: { height: 300, justifyContent: "center", alignItems: "center" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(200, 16, 46, 0.4)" },
  bannerContent: { alignItems: "center", paddingHorizontal: 20 },
  logo: { width: 80, height: 80, borderRadius: 12, marginBottom: 16, backgroundColor: "rgba(255,255,255,0.2)" },
  bannerTitle: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  bannerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", textAlign: "center" },
  formContainer: { padding: 24, marginTop: -30, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, flex: 1, elevation: 5 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: "#f9fafb" },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  primaryButton: { backgroundColor: "#C8102E" },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  disabledButton: { opacity: 0.7 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  warningContent: { backgroundColor: "#fff", width: "85%", borderRadius: 20, padding: 24, alignItems: "center", elevation: 10 },
  warningIconContainer: { backgroundColor: "#FEF2F2", padding: 16, borderRadius: 50, marginBottom: 16 },
  warningTitle: { fontSize: 20, fontWeight: "bold", color: "#111", marginBottom: 12 },
  warningText: { fontSize: 15, color: "#555", textAlign: "center", marginBottom: 8, lineHeight: 22 },
  warningButton: { backgroundColor: "#C8102E", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 16, width: "100%", alignItems: "center" },
  warningButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});