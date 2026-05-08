import { useRouter } from "expo-router";
import {
  Bot,
  CalendarDays,
  GraduationCap,
  Heart,
  TicketCheck,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const FEATURES = [
  { Icon: CalendarDays, label: "Catalogue centralisé" },
  { Icon: Bot, label: "Assistant IA intelligent" },
  { Icon: TicketCheck, label: "Inscriptions faciles" },
  { Icon: Heart, label: "Favoris & planning" },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5B52E8" />

      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <Animated.View
        style={[
          styles.logoSection,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoBox}>
          <GraduationCap size={60} color="#fff" strokeWidth={2.2} />
        </View>
        <Text style={styles.appName}>CampusEvents</Text>
        <Text style={styles.appNameAccent}>AI</Text>
        <Text style={styles.tagline}>
          Ton campus, ton agenda,{"\n"}ton assistant intelligent
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.featuresSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.featuresGrid}>
          {FEATURES.map(({ Icon, label }, i) => (
            <View key={i} style={styles.featureCard}>
              <Icon
                size={26}
                color="rgba(255,255,255,0.9)"
                strokeWidth={1.5}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.featureLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.replace("/(auth)/login")}
          activeOpacity={0.88}
        >
          <Text style={styles.startButtonText}>Commencer →</Text>
        </TouchableOpacity>
        <Text style={styles.bottomNote}>Université Abdelmalek Essaâdi</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5B52E8",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 28,
  },
  circle1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -80,
    right: -80,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 100,
    left: -60,
  },
  circle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: height * 0.35,
    right: -20,
  },
  logoSection: { alignItems: "center", marginTop: 20 },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
    marginBottom: -4,
  },
  appNameAccent: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 22,
  },
  featuresSection: { width: "100%" },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  featureCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    width: (width - 80) / 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  featureLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    textAlign: "center",
  },
  bottomSection: { width: "100%", alignItems: "center" },
  startButton: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  startButtonText: {
    color: "#5B52E8",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  bottomNote: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 16 },
});
