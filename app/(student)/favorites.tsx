import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { eventsDb } from "../../database/events";
import { favoritesDb } from "../../database/favorites";
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

export default function Favorites() {
  const { user } = useAuth();
  const router = useRouter();
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    const ids = favoritesDb.getFavoriteEventIds(user.email);
    const events = ids
      .map((id) => eventsDb.getById(id))
      .filter((e): e is Event => e !== null);
    setFavoriteEvents(events);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const removeFavorite = (eventId: string) => {
    if (!user) return;
    favoritesDb.remove(eventId, user.email);
    setFavoriteEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const renderItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(student)/events/${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.badge,
            { backgroundColor: getCategoryColor(item.category) },
          ]}
        >
          <Text style={styles.badgeText}>{item.category}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardDate}>
          🗓{" "}
          {new Date(item.startDateTime).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {item.locationName}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removeFavorite(item.id)}
      >
        <Text style={styles.removeBtnText}>❤️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🤍</Text>
            <Text style={styles.emptyText}>Aucun favori pour le moment</Text>
            <Text style={styles.emptySubText}>
              Appuie sur ❤️ dans le catalogue pour ajouter des favoris
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  cardLeft: { flex: 1 },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  cardDate: { fontSize: 13, color: "#666", marginBottom: 4 },
  cardLocation: { fontSize: 13, color: "#666" },
  removeBtn: { padding: 8, marginLeft: 8 },
  removeBtnText: { fontSize: 24 },
  empty: { alignItems: "center", marginTop: 100 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
