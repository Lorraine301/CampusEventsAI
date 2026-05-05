import React, { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Remplis tous les champs.");
      return;
    }
    setLoading(true);
    const success = await login(email.trim(), password);
    setLoading(false);
    if (!success) setError("Email ou mot de passe incorrect.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#6C63FF" />

      {/* Fond violet haut */}
      <View style={styles.topBg}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Text style={styles.appLogo}>🎓</Text>
        <Text style={styles.appName}>CampusEvents AI</Text>
        <Text style={styles.appTagline}>
          Ton agenda universitaire intelligent
        </Text>
      </View>

      {/* Carte de connexion */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connexion</Text>

        {error !== "" && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError("");
            }}
            placeholder="ton@email.ma"
            placeholderTextColor="#C0BDD8"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            placeholder="••••••••"
            placeholderTextColor="#C0BDD8"
            secureTextEntry={!showPass}
          />
          <TouchableOpacity
            onPress={() => setShowPass(!showPass)}
            style={styles.eyeBtn}
          >
            <Text style={styles.eyeIcon}>{showPass ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>
            {loading ? "Connexion..." : "Se connecter →"}
          </Text>
        </TouchableOpacity>

        {/* Comptes démo */}
        <View style={styles.demoSection}>
          <View style={styles.demoDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Comptes de démo</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.demoCards}>
            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => {
                setEmail("admin@campus.ma");
                setPassword("admin123");
                setError("");
              }}
            >
              <Text style={styles.demoCardIcon}>⚙️</Text>
              <Text style={styles.demoCardRole}>Admin</Text>
              <Text style={styles.demoCardEmail}>admin@campus.ma</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => {
                setEmail("etudiant@campus.ma");
                setPassword("etudiant123");
                setError("");
              }}
            >
              <Text style={styles.demoCardIcon}>🎓</Text>
              <Text style={styles.demoCardRole}>Étudiant</Text>
              <Text style={styles.demoCardEmail}>etudiant@campus.ma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#6C63FF" },
  topBg: {
    height: height * 0.38,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -60,
    right: -60,
  },
  circle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -40,
    left: -40,
  },
  appLogo: { fontSize: 52, marginBottom: 10 },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  appTagline: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 6 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2D2B55",
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#E53935",
  },
  errorText: { color: "#C62828", fontSize: 14 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    marginBottom: 8,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F4FF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E8E6FF",
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#333" },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 16 },
  loginBtn: {
    backgroundColor: "#6C63FF",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnDisabled: { backgroundColor: "#C5C2F0", shadowOpacity: 0 },
  loginBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  demoSection: { marginTop: 28 },
  demoDivider: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#EEE" },
  dividerText: {
    fontSize: 12,
    color: "#BBB",
    fontWeight: "600",
    marginHorizontal: 10,
  },
  demoCards: { flexDirection: "row", gap: 12 },
  demoCard: {
    flex: 1,
    backgroundColor: "#F8F8FF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8E6FF",
  },
  demoCardIcon: { fontSize: 24, marginBottom: 6 },
  demoCardRole: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6C63FF",
    marginBottom: 2,
  },
  demoCardEmail: { fontSize: 10, color: "#999", textAlign: "center" },
});
