import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { eventsDb } from "../../../database/events";
import { favoritesDb } from "../../../database/favorites";
import { registrationsDb } from "../../../database/registrations";
import { Event } from "../../../types";

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Talk: "#6C63FF",
    Workshop: "#FF6584",
    Club: "#43C6AC",
    Exam: "#F7971E",
    Other: "#888",
  };
  return colors[category] ?? "#888";
};

const uuidv4 = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadData = useCallback(() => {
    const e = eventsDb.getById(id);
    if (!e) {
      router.back();
      return;
    }
    setEvent(e);
    if (user) {
      setIsRegistered(registrationsDb.isRegistered(e.id, user.email));
      setIsFavorite(favoritesDb.isFavorite(e.id, user.email));
    }
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  if (!event) return null;

  const now = new Date();
  const isPast = new Date(event.startDateTime) < now;
  const isFull =
    event.capacity !== undefined && event.registeredCount >= event.capacity;
  const canRegister = !isPast && !isFull && !isRegistered;

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleRegister = () => {
    if (!user) return;
    Alert.alert(
      "Confirmer l'inscription",
      `Veux-tu t'inscrire à "${event.title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "S'inscrire",
          onPress: () => {
            registrationsDb.register({
              id: uuidv4(),
              eventId: event.id,
              userId: user.email,
              createdAt: new Date().toISOString(),
              status: "confirmed",
            });
            eventsDb.incrementRegistered(event.id);
            setIsRegistered(true);
            setEvent({ ...event, registeredCount: event.registeredCount + 1 });
            Alert.alert("✅ Inscrit !", "Tu es bien inscrit à cet événement.");
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    if (!user) return;
    Alert.alert(
      "Annuler l'inscription",
      "Veux-tu vraiment annuler ton inscription ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => {
            registrationsDb.cancel(event.id, user.email);
            eventsDb.decrementRegistered(event.id);
            setIsRegistered(false);
            setEvent({
              ...event,
              registeredCount: Math.max(0, event.registeredCount - 1),
            });
          },
        },
      ],
    );
  };

  const toggleFavorite = () => {
    if (!user) return;
    if (isFavorite) {
      favoritesDb.remove(event.id, user.email);
      setIsFavorite(false);
    } else {
      favoritesDb.add({
        eventId: event.id,
        userId: user.email,
        createdAt: new Date().toISOString(),
      });
      setIsFavorite(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* En-tête */}
      <View
        style={[
          styles.header,
          { backgroundColor: getCategoryColor(event.category) },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{event.category}</Text>
          </View>
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteBtn}>
            <Text style={styles.favoriteIcon}>{isFavorite ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{event.title}</Text>
        <Text style={styles.headerOrganizer}>Par {event.organizerName}</Text>
      </View>

      <View style={styles.body}>
        {/* Infos clés */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🗓</Text>
            <View>
              <Text style={styles.infoLabel}>Début</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(event.startDateTime)}
              </Text>
            </View>
          </View>
          {event.endDateTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🏁</Text>
              <View>
                <Text style={styles.infoLabel}>Fin</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(event.endDateTime)}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Lieu</Text>
              <Text style={styles.infoValue}>{event.locationName}</Text>
              {event.locationAddress && (
                <Text style={styles.infoSubValue}>{event.locationAddress}</Text>
              )}
            </View>
          </View>
          {event.capacity !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🎫</Text>
              <View>
                <Text style={styles.infoLabel}>Places</Text>
                <Text style={[styles.infoValue, isFull && styles.textRed]}>
                  {event.registeredCount} / {event.capacity} inscrits
                  {isFull ? " — Complet" : ""}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{event.description}</Text>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {event.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Bouton d'inscription */}
        {isPast ? (
          <View style={styles.pastBanner}>
            <Text style={styles.pastBannerText}>Cet événement est terminé</Text>
          </View>
        ) : isRegistered ? (
          <View>
            <View style={styles.registeredBanner}>
              <Text style={styles.registeredBannerText}>
                ✅ Tu es inscrit à cet événement
              </Text>
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>
                Annuler mon inscription
              </Text>
            </TouchableOpacity>
          </View>
        ) : isFull ? (
          <View style={styles.fullBanner}>
            <Text style={styles.fullBannerText}>🚫 Événement complet</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>
              🎫 Inscrivez-vous à cet événement
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8FF" },
  header: { padding: 24, paddingTop: 32 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  favoriteBtn: { padding: 4 },
  favoriteIcon: { fontSize: 24 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  headerOrganizer: { fontSize: 14, color: "rgba(255,255,255,0.85)" },
  body: { padding: 16 },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  infoIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  infoLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoValue: { fontSize: 14, color: "#333", fontWeight: "500", marginTop: 2 },
  infoSubValue: { fontSize: 13, color: "#888", marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
    marginBottom: 20,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  tag: {
    backgroundColor: "#F0EEFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { color: "#6C63FF", fontSize: 13, fontWeight: "500" },
  registerButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  registerButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  registeredBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  registeredBannerText: { color: "#2E7D32", fontSize: 15, fontWeight: "600" },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: "#E53935",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: { color: "#E53935", fontSize: 15, fontWeight: "600" },
  fullBanner: {
    backgroundColor: "#FFEBEE",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  fullBannerText: { color: "#E53935", fontSize: 15, fontWeight: "600" },
  pastBanner: {
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  pastBannerText: { color: "#888", fontSize: 15, fontWeight: "600" },
  textRed: { color: "#E53935", fontWeight: "600" },
});
