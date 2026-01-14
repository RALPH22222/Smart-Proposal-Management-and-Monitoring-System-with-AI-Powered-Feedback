import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert, 
  Modal, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ImageBackground
} from "react-native";
// 1. ROUTER IMPORTS
import { useRouter, Stack } from "expo-router"; 
// 2. ICON IMPORTS
import { Feather } from "@expo/vector-icons"; 
import { api } from "../../utils/axios"; 
import axios from "axios"; 

export default function LoginScreen() {
  const router = useRouter();

  // --- STATE ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWebWarning, setShowWebWarning] = useState(false);

  // --- LOGIC: CHECK ROLE PERMISSION ---
  const navigateBasedOnRole = (role: string) => {
    // strict check: lowercase comparison
    const r = role.toLowerCase();
    
    if (r === "proponent" || r === "lead_proponent") {
      // ✅ ALLOWED: Go to Dashboard
      // 'as any' fixes typescript error if route isn't auto-generated yet
      router.push("/pages/dashboard" as any); 
    } else {
      // ❌ BLOCKED: Show Warning Modal
      setShowWebWarning(true);
    }
  };

  // --- LOGIN HANDLER ---
  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Missing fields", "Please provide email and password.");
    }

    try {
      setLoading(true);
      console.log("🔹 User attempting login...");

      // SEND REQUEST
      const response = await api.post('/auth/login', { 
        email, 
        password 
      });

      console.log("🔹 Login successful, checking role...");
      const data = response.data;
      const userRole = data.user?.role;

      if (!userRole) {
        throw new Error("No role assigned to this user.");
      }

      navigateBasedOnRole(userRole);

    } catch (err: any) {
      setLoading(false); // Stop loading immediately
      
      let title = "Login Failed";
      let message = "An unexpected error occurred.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          // Case 1: Server rejected us (Wrong password, 404, 500)
          title = `Server Error (${err.response.status})`;
          message = err.response.data?.message || JSON.stringify(err.response.data);
        } else if (err.request) {
          // Case 2: Network Error (Server unreachable)
          title = "Connection Error";
          message = "Could not reach the server.\n\nCheck:\n1. Your internet connection\n2. The AWS URL in Config.ts";
        } else {
          // Case 3: Config Error
          message = err.message;
        }
      } else {
        message = err.message;
      }

      console.log(`⚠️ Alerting user: ${title} - ${message}`);
      Alert.alert(title, message);
    } 
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      {/* HIDES THE DEFAULT NAVIGATION HEADER */}
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#fff" }}>
        
        {/* --- TOP BANNER --- */}
        <ImageBackground
          // Ensure this image exists in your assets folder!
          source={require('../../assets/images/image.png')}
          style={styles.banner}
        >
          <View style={styles.overlay} />
          <View style={styles.bannerContent}>
             <Image 
                source={require('../../assets/images/LOGO.png')} 
                style={styles.logo} 
            />
            <Text style={styles.bannerTitle}>Project Proposal</Text>
            <Text style={styles.bannerSubtitle}>
              Create, submit and track project proposals.
            </Text>
          </View>
        </ImageBackground>

        {/* --- LOGIN FORM --- */}
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

      {/* --- MODAL: WEB ACCESS WARNING (If wrong role) --- */}
      <Modal
        visible={showWebWarning}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWebWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningContent}>
            <View style={styles.warningIconContainer}>
              <Feather name="monitor" size={40} color="#C8102E" />
            </View>
            <Text style={styles.warningTitle}>Desktop Access Required</Text>
            <Text style={styles.warningText}>
              The <Text style={{fontWeight: 'bold'}}>Administrator, R&D, and Evaluator</Text> dashboards are not available on mobile.
            </Text>
            <TouchableOpacity 
              style={styles.warningButton} 
              onPress={() => setShowWebWarning(false)}
            >
              <Text style={styles.warningButtonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  banner: { 
    height: 300, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    // 0.4 opacity lets the image show through (instead of solid red)
    backgroundColor: "rgba(200, 16, 46, 0.4)" 
  },
  bannerContent: { 
    alignItems: "center", 
    paddingHorizontal: 20 
  },
  logo: { 
    width: 80, 
    height: 80, 
    borderRadius: 12, 
    marginBottom: 16, 
    backgroundColor: "rgba(255,255,255,0.2)" 
  },
  bannerTitle: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#fff", 
    marginBottom: 8 
  },
  bannerSubtitle: { 
    fontSize: 14, 
    color: "rgba(255,255,255,0.9)", 
    textAlign: "center" 
  },
  formContainer: { 
    padding: 24, 
    marginTop: -30, 
    backgroundColor: "#fff", 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    flex: 1, 
    elevation: 5 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#111", 
    marginBottom: 4 
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: "#666", 
    marginBottom: 24 
  },
  inputGroup: { 
    marginBottom: 16 
  },
  label: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#374151", 
    marginBottom: 8 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#e5e7eb", 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    backgroundColor: "#f9fafb" 
  },
  buttonRow: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 8 
  },
  button: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  primaryButton: { 
    backgroundColor: "#C8102E" 
  },
  primaryButtonText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 16 
  },
  disabledButton: { 
    opacity: 0.7 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.6)", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  warningContent: { 
    backgroundColor: "#fff", 
    width: "85%", 
    borderRadius: 20, 
    padding: 24, 
    alignItems: "center", 
    elevation: 10 
  },
  warningIconContainer: { 
    backgroundColor: "#FEF2F2", 
    padding: 16, 
    borderRadius: 50, 
    marginBottom: 16 
  },
  warningTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#111", 
    marginBottom: 12 
  },
  warningText: { 
    fontSize: 15, 
    color: "#555", 
    textAlign: "center", 
    marginBottom: 8, 
    lineHeight: 22 
  },
  warningButton: { 
    backgroundColor: "#C8102E", 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 8, 
    marginTop: 16, 
    width: "100%", 
    alignItems: "center" 
  },
  warningButtonText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 16 
  },
});