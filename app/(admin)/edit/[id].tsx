import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { eventsDb } from "../../../database/events";
import { EventCategory } from "../../../types";

const CATEGORIES: EventCategory[] = [
  "Talk",
  "Workshop",
  "Club",
  "Exam",
  "Other",
];

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

const fromISO = (iso: string) => {
  const d = new Date(iso);
  const date = `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return { date, time };
};

const toISO = (date: string, time: string): string => {
  let d = date.trim();
  if (d.includes("/")) {
    const [day, month, year] = d.split("/");
    d = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return `${d}T${time.trim()}:00`;
};

export default function EditEvent() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

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

  useEffect(() => {
    const event = eventsDb.getById(id);
    if (!event) {
      Alert.alert("Erreur", "Événement introuvable");
      router.back();
      return;
    }

    setTitle(event.title);
    setDescription(event.description);
    setCategory(event.category);
    setLocationName(event.locationName);
    setLocationAddress(event.locationAddress ?? "");
    setOrganizerName(event.organizerName);
    setCapacity(event.capacity?.toString() ?? "");
    setTagsInput(event.tags?.join(", ") ?? "");

    const start = fromISO(event.startDateTime);
    setStartDate(start.date);
    setStartTime(start.time);

    if (event.endDateTime) {
      const end = fromISO(event.endDateTime);
      setEndDate(end.date);
      setEndTime(end.time);
    }
  }, [id]);

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

    if (endDate.trim() || endTime.trim()) {
      if (endDate.length < 10)
        return "Format de date de fin invalide. Utilise JJ/MM/AAAA.";
      if (endTime.length < 5)
        return "Format d'heure de fin invalide. Utilise HH:MM.";
      const startISO = toISO(startDate, startTime);
      const endISO = toISO(endDate, endTime);
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

  const handleSave = () => {
    const error = validate();
    if (error) {
      Alert.alert("Erreur", error);
      return;
    }

    const event = eventsDb.getById(id)!;
    setLoading(true);

    const tags = tagsInput.trim()
      ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    eventsDb.update({
      ...event,
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
      tags,
    });

    setLoading(false);
    Alert.alert("Succès", "Événement modifié !", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Modifier événement</Text>

      <Text style={styles.label}>Titre *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#bbb"
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
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

      {/*  Date et heure avec formatage automatique */}
      <Text style={styles.label}>Date de début * (JJ/MM/AAAA)</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={(text) => setStartDate(formatDate(text))}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
        maxLength={10}
      />

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
        placeholderTextColor="#bbb"
      />

      <Text style={styles.label}>Organisateur *</Text>
      <TextInput
        style={styles.input}
        value={organizerName}
        onChangeText={setOrganizerName}
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
        placeholderTextColor="#bbb"
      />

      <Text style={styles.label}>Capacité maximale</Text>
      <TextInput
        style={styles.input}
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="numeric"
        placeholderTextColor="#bbb"
      />

      <Text style={styles.label}>Tags (séparés par des virgules)</Text>
      <TextInput
        style={styles.input}
        value={tagsInput}
        onChangeText={setTagsInput}
        placeholderTextColor="#bbb"
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? "Sauvegarde..." : "💾 Sauvegarder les modifications"}
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
