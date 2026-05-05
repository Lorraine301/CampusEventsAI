import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { eventsDb } from "../../database/events";
import { registrationsDb } from "../../database/registrations";
import { Event } from "../../types";

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

export default function Registrations() {
  const { user } = useAuth();
  const router = useRouter();
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    const ids = registrationsDb.getRegisteredEventIds(user.email);
    const events = ids
      .map((id) => eventsDb.getById(id))
      .filter((e): e is Event => e !== null)
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      );
    setRegisteredEvents(events);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleCancel = (event: Event) => {
    if (!user) return;
    Alert.alert(
      "Annuler l'inscription",
      `Annuler ton inscription à "${event.title}" ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => {
            registrationsDb.cancel(event.id, user.email);
            eventsDb.decrementRegistered(event.id);
            loadData();
          },
        },
      ],
    );
  };

  const now = new Date();

  const renderItem = ({ item }: { item: Event }) => {
    const isPast = new Date(item.startDateTime) < now;
    return (
      <TouchableOpacity
        style={[styles.card, isPast && styles.cardPast]}
        onPress={() => router.push(`/(student)/events/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.badge,
              { backgroundColor: getCategoryColor(item.category) },
            ]}
          >
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
          {isPast ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Terminé</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusConfirmed]}>
              <Text
                style={[styles.statusBadgeText, styles.statusConfirmedText]}
              >
                ✅ Inscrit
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardDate}>
          🗓{" "}
          {new Date(item.startDateTime).toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {item.locationName}
        </Text>

        {!isPast && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancel(item)}
          >
            <Text style={styles.cancelBtnText}>Annuler inscription</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const upcoming = registeredEvents.filter(
    (e) => new Date(e.startDateTime) >= now,
  );
  const past = registeredEvents.filter((e) => new Date(e.startDateTime) < now);

  return (
    <View style={styles.container}>
      {registeredEvents.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>À venir</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{past.length}</Text>
            <Text style={styles.statLabel}>Passés</Text>
          </View>
        </View>
      )}

      <FlatList
        data={registeredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyText}>Aucune inscription</Text>
            <Text style={styles.emptySubText}>
              Inscris-toi à des événements depuis le catalogue
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8FF", padding: 12 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  statNumber: { fontSize: 28, fontWeight: "800", color: "#6C63FF" },
  statLabel: { fontSize: 13, color: "#888", marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  cardPast: { opacity: 0.65 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statusBadge: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: { fontSize: 12, color: "#888" },
  statusConfirmed: { backgroundColor: "#E8F5E9" },
  statusConfirmedText: { color: "#2E7D32", fontWeight: "600" },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  cardDate: { fontSize: 13, color: "#666", marginBottom: 4 },
  cardLocation: { fontSize: 13, color: "#666", marginBottom: 8 },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: "#E53935",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  cancelBtnText: { color: "#E53935", fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", marginTop: 100 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#555" },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
