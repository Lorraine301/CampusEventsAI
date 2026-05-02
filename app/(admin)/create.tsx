import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { eventsDb } from "../../database/events";
import { EventCategory } from "../../types";

// UUID sans dépendance externe
const uuidv4 = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Formatage automatique JJ/MM/AAAA
const formatDate = (text: string): string => {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// Formatage automatique HH:MM
const formatTime = (text: string): string => {
  const digits = text.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const CATEGORIES: EventCategory[] = [
  "Talk",
  "Workshop",
  "Club",
  "Exam",
  "Other",
];

export default function CreateEvent() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("Talk");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);

  const toISO = (date: string, time: string): string => {
    let d = date.trim();
    if (d.includes("/")) {
      const [day, month, year] = d.split("/");
      d = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return `${d}T${time.trim()}:00`;
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Le titre est obligatoire.";
    if (!description.trim()) return "La description est obligatoire.";
    if (!startDate.trim() || !startTime.trim())
      return "La date et heure de début sont obligatoires.";
    if (startDate.length < 10)
      return "Format de date invalide. Utilise JJ/MM/AAAA.";
    if (startTime.length < 5) return "Format d'heure invalide. Utilise HH:MM.";
    if (!locationName.trim()) return "Le lieu est obligatoire.";
    if (!organizerName.trim()) return "L'organisateur est obligatoire.";

    const startISO = toISO(startDate, startTime);
    if (isNaN(Date.parse(startISO))) return "Date de début invalide.";

    if (endDate.trim() || endTime.trim()) {
      if (endDate.length < 10)
        return "Format de date de fin invalide. Utilise JJ/MM/AAAA.";
      if (endTime.length < 5)
        return "Format d'heure de fin invalide. Utilise HH:MM.";
      const endISO = toISO(endDate, endTime);
      if (isNaN(Date.parse(endISO))) return "Date de fin invalide.";
      if (new Date(endISO) <= new Date(startISO))
        return "La date de fin doit être après la date de début.";
    }

    if (capacity.trim()) {
      const cap = parseInt(capacity);
      if (isNaN(cap) || cap <= 0)
        return "La capacité doit être un nombre entier positif.";
    }

    return null;
  };

  const handleCreate = () => {
    const error = validate();
    if (error) {
      Alert.alert("Erreur", error);
      return;
    }

    setLoading(true);

    const tags = tagsInput.trim()
      ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    eventsDb.create({
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      category,
      startDateTime: toISO(startDate, startTime),
      endDateTime:
        endDate.trim() && endTime.trim() ? toISO(endDate, endTime) : undefined,
      locationName: locationName.trim(),
      locationAddress: locationAddress.trim() || undefined,
      organizerName: organizerName.trim(),
      capacity: capacity.trim() ? parseInt(capacity) : undefined,
      registeredCount: 0,
      tags,
      createdAt: new Date().toISOString(),
    });

    setLoading(false);
    Alert.alert("Succès", "Événement créé !", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Informations obligatoires</Text>

      <Text style={styles.label}>Titre *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ex: Workshop React Native"
        placeholderTextColor="#bbb"
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        placeholder="Décris l'événement..."
        placeholderTextColor="#bbb"
      />

      <Text style={styles.label}>Catégorie *</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              category === cat && styles.categoryChipActive,
            ]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                category === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date et heure de début */}
      <Text style={styles.label}>Date de début * (JJ/MM/AAAA)</Text>
      <View style={styles.inputWithHint}>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={(text) => setStartDate(formatDate(text))}
          placeholder="JJ/MM/AAAA"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <Text style={styles.label}>Heure de début * (HH:MM)</Text>
      <TextInput
        style={styles.input}
        value={startTime}
        onChangeText={(text) => setStartTime(formatTime(text))}
        placeholder="HH:MM"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
        maxLength={5}
      />

      <Text style={styles.label}>Lieu *</Text>
      <TextInput
        style={styles.input}
        value={locationName}
        onChangeText={setLocationName}
        placeholder="Ex: Amphi A, Bâtiment principal"
        placeholderTextColor="#bbb"
      />

      <Text style={styles.label}>Organisateur *</Text>
      <TextInput
        style={styles.input}
        value={organizerName}
        onChangeText={setOrganizerName}
        placeholder="Ex: Club Informatique"
        placeholderTextColor="#bbb"
      />

      <Text style={styles.sectionTitle}>Informations optionnelles</Text>

      <Text style={styles.label}>Date de fin (JJ/MM/AAAA)</Text>
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={(text) => setEndDate(formatDate(text))}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
        maxLength={10}
      />

      <Text style={styles.label}>Heure de fin (HH:MM)</Text>
      <TextInput
        style={styles.input}
        value={endTime}
        onChangeText={(text) => setEndTime(formatTime(text))}
        placeholder="HH:MM"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
        maxLength={5}
      />

      <Text style={styles.label}>Adresse complète</Text>
      <TextInput
        style={styles.input}
        value={locationAddress}
        onChangeText={setLocationAddress}
        placeholder="Ex: Avenue principale, Tétouan"
        placeholderTextColor="#bbb"
      />

      <Text style={styles.label}>Capacité maximale</Text>
      <TextInput
        style={styles.input}
        value={capacity}
        onChangeText={setCapacity}
        placeholder="Ex: 50"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Tags (séparés par des virgules)</Text>
      <TextInput
        style={styles.input}
        value={tagsInput}
        onChangeText={setTagsInput}
        placeholder="Ex: IA, machine learning, python"
        placeholderTextColor="#bbb"
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? "Création..." : "✅ Créer l'événement"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8FF", padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6C63FF",
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0DEFF",
    paddingBottom: 6,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#333",
    marginBottom: 14,
  },
  inputWithHint: { position: "relative" },
  textarea: { height: 100, textAlignVertical: "top" },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    borderWidth: 1.5,
    borderColor: "#6C63FF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChipActive: { backgroundColor: "#6C63FF" },
  categoryChipText: { color: "#6C63FF", fontWeight: "600", fontSize: 13 },
  categoryChipTextActive: { color: "#fff" },
  submitButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: { backgroundColor: "#B0AAFF" },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
