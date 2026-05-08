import {
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react-native";

import React, { useState } from "react";
import {
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

    if (!success) {
      setError("Email ou mot de passe incorrect.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1F1D3A" />

      {/* HEADER */}
      <View style={styles.topSection}>
        <View style={styles.logoWrap}>
          <GraduationCap size={34} color="#fff" strokeWidth={2.2} />
        </View>

        <Text style={styles.appName}>CampusEvents</Text>

        <Text style={styles.appSub}>
          Plateforme intelligente des événements universitaires
        </Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <ShieldCheck size={13} color="#A5B4FC" />
            <Text style={styles.badgeText}>Sécurisé</Text>
          </View>

          <View style={styles.badge}>
            <User size={13} color="#A5B4FC" />
            <Text style={styles.badgeText}>Étudiants & Admins</Text>
          </View>
        </View>
      </View>

      {/* FORM */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Connexion</Text>

        {error !== "" && (
          <View style={styles.errorBox}>
            <AlertCircle size={14} color="#DC2626" style={{ marginRight: 8 }} />

            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* EMAIL */}
        <Text style={styles.label}>Adresse email</Text>

        <View style={styles.inputWrapper}>
          <Mail size={18} color="#9CA3AF" style={{ marginLeft: 14 }} />

          <TextInput
            style={styles.inputWithIcon}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError("");
            }}
            placeholder="exemple@campus.ma"
            placeholderTextColor="#BEC3CF"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* PASSWORD */}
        <Text style={styles.label}>Mot de passe</Text>

        <View style={styles.passwordWrapper}>
          <Lock size={18} color="#9CA3AF" style={{ marginLeft: 14 }} />

          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            placeholder="••••••••"
            placeholderTextColor="#BEC3CF"
            secureTextEntry={!showPass}
          />

          <TouchableOpacity
            onPress={() => setShowPass(!showPass)}
            style={styles.eyeBtn}
          >
            {showPass ? (
              <EyeOff size={18} color="#5B52E8" />
            ) : (
              <Eye size={18} color="#5B52E8" />
            )}
          </TouchableOpacity>
        </View>

        {/* LOGIN BUTTON */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.88}
        >
          <Text style={styles.loginBtnText}>
            {loading ? "Connexion..." : "Se connecter"}
          </Text>
        </TouchableOpacity>

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />

          <Text style={styles.dividerText}>comptes de démonstration</Text>

          <View style={styles.dividerLine} />
        </View>

        {/* DEMO ACCOUNTS */}
        <View style={styles.demoRow}>
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => {
              setEmail("admin@campus.ma");
              setPassword("admin123");
              setError("");
            }}
          >
            <View style={styles.demoIconAdmin}>
              <ShieldCheck size={15} color="#fff" />
            </View>

            <View>
              <Text style={styles.demoBtnRole}>Administrateur</Text>

              <Text style={styles.demoBtnEmail}>admin@campus.ma</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => {
              setEmail("etudiant@campus.ma");
              setPassword("etudiant123");
              setError("");
            }}
          >
            <View style={styles.demoIconStudent}>
              <GraduationCap size={15} color="#fff" />
            </View>

            <View>
              <Text style={styles.demoBtnRole}>Étudiant</Text>

              <Text style={styles.demoBtnEmail}>etudiant@campus.ma</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1D3A",
  },

  // HEADER

  topSection: {
    flex: 0.4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#5B52E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,

    shadowColor: "#5B52E8",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },

  appName: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: -1,
  },

  appSub: {
    fontSize: 14,
    color: "#B7B9D3",
    textAlign: "center",
    lineHeight: 22,
  },

  badgeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },

  badgeText: {
    color: "#D6D6F5",
    fontSize: 12,
    fontWeight: "600",
  },

  // FORM CARD

  formCard: {
    flex: 0.6,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 28,
    paddingTop: 32,
  },

  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F1D3A",
    marginBottom: 24,
  },

  // ERROR

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 13,
    flex: 1,
  },

  // LABEL

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },

  // INPUT EMAIL

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9FF",
    borderWidth: 1.5,
    borderColor: "#E8E6FF",
    borderRadius: 14,
    marginBottom: 16,
  },

  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 15,
    color: "#1F1D3A",
  },

  // PASSWORD

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9FF",
    borderWidth: 1.5,
    borderColor: "#E8E6FF",
    borderRadius: 14,
    marginBottom: 22,
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 15,
    color: "#1F1D3A",
  },

  eyeBtn: {
    paddingHorizontal: 14,
  },

  // LOGIN BUTTON

  loginBtn: {
    backgroundColor: "#5B52E8",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",

    shadowColor: "#5B52E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,

    marginBottom: 26,
  },

  loginBtnDisabled: {
    backgroundColor: "#C5C2F0",
  },

  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // DIVIDER

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ECECEC",
  },

  dividerText: {
    fontSize: 11,
    color: "#A1A1AA",
    marginHorizontal: 10,
    fontWeight: "500",
  },

  // DEMO ACCOUNTS

  demoRow: {
    flexDirection: "row",
    gap: 10,
  },

  demoBtn: {
    flex: 1,
    backgroundColor: "#F9F9FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E8E6FF",

    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  demoIconAdmin: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1F1D3A",
    alignItems: "center",
    justifyContent: "center",
  },

  demoIconStudent: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#5B52E8",
    alignItems: "center",
    justifyContent: "center",
  },

  demoBtnRole: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F1D3A",
  },

  demoBtnEmail: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
});
