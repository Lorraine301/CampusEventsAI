import { useFocusEffect } from "expo-router";
import {
  Check,
  Footprints,
  LogOut,
  Plus,
  Save,
  User,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { favoritesDb } from "../../database/favorites";
import { profileDb } from "../../database/profile";
import { registrationsDb } from "../../database/registrations";

const { width } = Dimensions.get("window");

const FILIERES = [
  "Informatique",
  "Mathématiques",
  "Physique",
  "Économie",
  "Droit",
  "Médecine",
  "Autre",
];
const ANNEES = ["1", "2", "3", "4", "5"] as const;
const INTEREST_SUGGESTIONS = [
  "IA",
  "Data Science",
  "Web",
  "Mobile",
  "Cybersécurité",
  "Entrepreneuriat",
  "Design",
  "Recherche",
  "Stage",
  "Réseaux",
  "Blockchain",
  "Cloud",
  "DevOps",
  "Marketing",
  "Finance",
];
const AVATAR_COLORS = ["#5B52E8", "#E8527A", "#0DB8A0", "#F59E0B", "#8B5CF6"];

export default function Profile() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [filiere, setFiliere] = useState("Informatique");
  const [annee, setAnnee] = useState<"1" | "2" | "3" | "4" | "5">("1");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [saved, setSaved] = useState(false);
  const [statsData, setStatsData] = useState({
    registrations: 0,
    favorites: 0,
  });

  const avatarColor =
    AVATAR_COLORS[(user?.email.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      const profile = profileDb.get(user.email);
      if (profile) {
        setDisplayName(profile.displayName);
        setFiliere(profile.filiere);
        setAnnee(profile.annee);
        setInterests(profile.interests);
      }
      setStatsData({
        registrations: registrationsDb.getRegisteredEventIds(user.email).length,
        favorites: favoritesDb.getFavoriteEventIds(user.email).length,
      });
    }, [user]),
  );

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
      setCustomInterest("");
    }
  };

  const handleSave = () => {
    if (!user || !displayName.trim()) return;
    profileDb.upsert({
      userId: user.email,
      displayName: displayName.trim(),
      filiere,
      annee,
      interests,
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>
            {displayName
              ? displayName[0].toUpperCase()
              : (user?.email[0].toUpperCase() ?? "?")}
          </Text>
        </View>
        <Text style={styles.headerName}>{displayName || "Ton profil"}</Text>
        <Text style={styles.headerEmail}>{user?.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statsData.registrations}</Text>
            <Text style={styles.statLabel}>Inscriptions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statsData.favorites}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{annee}</Text>
            <Text style={styles.statLabel}>Année</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <User size={16} color="#5B52E8" />
          </View>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
        </View>

        <Text style={styles.label}>Prénom & Nom</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Ex: Fatima Zahra"
          placeholderTextColor="#C4C4E0"
        />

        <Text style={styles.label}>Filière</Text>
        <View style={styles.chipRow}>
          {FILIERES.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filiere === f && styles.chipActive]}
              onPress={() => setFiliere(f)}
            >
              <Text
                style={[
                  styles.chipText,
                  filiere === f && styles.chipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Année études</Text>
        <View style={styles.anneeRow}>
          {ANNEES.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.anneeChip, annee === a && styles.anneeChipActive]}
              onPress={() => setAnnee(a)}
            >
              <Text
                style={[
                  styles.anneeText,
                  annee === a && styles.anneeTextActive,
                ]}
              >
                {a}
                {a === "1" ? "ère" : "ème"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Footprints size={16} color="#5B52E8" />
          </View>
          <Text style={styles.sectionTitle}>Centres d&apos;intérêt</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Améliore la pertinence des recommandations IA
        </Text>

        <View style={styles.chipRow}>
          {INTEREST_SUGGESTIONS.map((interest) => {
            const isSelected = interests.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestChip,
                  isSelected && styles.interestChipActive,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                {isSelected && (
                  <Check size={11} color="#fff" style={{ marginRight: 4 }} />
                )}
                <Text
                  style={[
                    styles.interestText,
                    isSelected && styles.interestTextActive,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.customRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={customInterest}
            onChangeText={setCustomInterest}
            placeholder="Ajouter un intérêt..."
            placeholderTextColor="#C4C4E0"
            onSubmitEditing={addCustomInterest}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustomInterest}>
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {interests.filter((i) => !INTEREST_SUGGESTIONS.includes(i)).length >
          0 && (
          <View style={[styles.chipRow, { marginTop: 10 }]}>
            {interests
              .filter((i) => !INTEREST_SUGGESTIONS.includes(i))
              .map((i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.customTag}
                  onPress={() => toggleInterest(i)}
                >
                  <Text style={styles.customTagText}>{i}</Text>
                  <Plus
                    size={11}
                    color="#fff"
                    style={{ marginLeft: 4, transform: [{ rotate: "45deg" }] }}
                  />
                </TouchableOpacity>
              ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
        onPress={handleSave}
        activeOpacity={0.88}
      >
        {saved ? (
          <Check size={18} color="#fff" style={{ marginRight: 8 }} />
        ) : (
          <Save size={18} color="#fff" style={{ marginRight: 8 }} />
        )}
        <Text style={styles.saveBtnText}>
          {saved ? "Profil sauvegardé !" : "Sauvegarder"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={logout}
        activeOpacity={0.88}
      >
        <LogOut size={16} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutBtnText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F3FF" },
  header: {
    backgroundColor: "#5B52E8",
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText: { fontSize: 38, color: "#fff", fontWeight: "800" },
  headerName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    justifyContent: "space-around",
  },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 22, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#5B52E8",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EEEDFD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1F1D3A" },
  sectionDesc: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 14,
    marginTop: -8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F4F3FF",
    borderWidth: 1.5,
    borderColor: "#E0DEFF",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1F1D3A",
    marginBottom: 16,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1.5,
    borderColor: "#E0DEFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F4F3FF",
  },
  chipActive: { backgroundColor: "#5B52E8", borderColor: "#5B52E8" },
  chipText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  anneeRow: { flexDirection: "row", gap: 8 },
  anneeChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E0DEFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F4F3FF",
  },
  anneeChipActive: { backgroundColor: "#5B52E8", borderColor: "#5B52E8" },
  anneeText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  anneeTextActive: { color: "#fff", fontWeight: "700" },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DEFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#F8F8FF",
  },
  interestChipActive: { backgroundColor: "#5B52E8", borderColor: "#5B52E8" },
  interestText: { fontSize: 13, color: "#6B7280" },
  interestTextActive: { color: "#fff", fontWeight: "600" },
  customRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 4,
  },
  addBtn: {
    backgroundColor: "#5B52E8",
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  customTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B52E8",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  customTagText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B52E8",
    borderRadius: 16,
    margin: 16,
    padding: 18,
    shadowColor: "#5B52E8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnSuccess: { backgroundColor: "#059669" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FCA5A5",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#FFF5F5",
  },
  logoutBtnText: { color: "#EF4444", fontSize: 15, fontWeight: "700" },
});
