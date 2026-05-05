import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { eventsDb } from "../../../database/events";
import { favoritesDb } from "../../../database/favorites";
import { Event, EventCategory } from "../../../types";

const CATEGORIES: EventCategory[] = [
  "Talk",
  "Workshop",
  "Club",
  "Exam",
  "Other",
];

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

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EventsList() {
  const router = useRouter();
  const { user } = useAuth();

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<EventCategory | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    const events = eventsDb.getAll();
    setAllEvents(events);
    if (user) {
      const ids = favoritesDb.getFavoriteEventIds(user.email);
      setFavoriteIds(new Set(ids));
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const toggleFavorite = (eventId: string) => {
    if (!user) return;
    if (favoriteIds.has(eventId)) {
      favoritesDb.remove(eventId, user.email);
      setFavoriteIds((prev) => {
        const s = new Set(prev);
        s.delete(eventId);
        return s;
      });
    } else {
      favoritesDb.add({
        eventId,
        userId: user.email,
        createdAt: new Date().toISOString(),
      });
      setFavoriteIds((prev) => new Set(prev).add(eventId));
    }
  };

  const now = new Date();

  const filteredEvents = allEvents.filter((event) => {
    const eventDate = new Date(event.startDateTime);
    if (filter === "upcoming" && eventDate < now) return false;
    if (filter === "past" && eventDate >= now) return false;
    if (selectedCategory && event.category !== selectedCategory) return false;
    if (search && !event.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const renderItem = ({ item }: { item: Event }) => {
    const isPast = new Date(item.startDateTime) < now;
    const isFull =
      item.capacity !== undefined && item.registeredCount >= item.capacity;

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
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
            <Text style={styles.heartIcon}>
              {favoriteIds.has(item.id) ? "❤️" : "🤍"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardDate}>🗓 {formatDate(item.startDateTime)}</Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {item.locationName}
        </Text>

        <View style={styles.cardFooter}>
          {item.capacity !== undefined && (
            <Text style={[styles.capacityText, isFull && styles.capacityFull]}>
              🎫 {item.registeredCount}/{item.capacity}{" "}
              {isFull ? "(Complet)" : ""}
            </Text>
          )}
          {isPast && <Text style={styles.pastLabel}>Terminé</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un événement..."
          placeholderTextColor="#bbb"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtre période */}
      <View style={styles.periodRow}>
        {(["upcoming", "all", "past"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.periodChip, filter === f && styles.periodChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.periodChipText,
                filter === f && styles.periodChipTextActive,
              ]}
            >
              {f === "upcoming" ? "À venir" : f === "all" ? "Tous" : "Passés"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtre catégorie */}
      <View style={styles.categoryScroll}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === null && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === null && styles.categoryChipTextActive,
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() =>
              setSelectedCategory(selectedCategory === cat ? null : cat)
            }
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Résultats */}
      <Text style={styles.resultCount}>
        {filteredEvents.length} événement(s)
      </Text>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyText}>Aucun événement trouvé</Text>
            <Text style={styles.emptySubText}>
              Essaie de changer les filtres
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#333" },
  clearIcon: { fontSize: 16, color: "#999", padding: 4 },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  periodChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#6C63FF",
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: "center",
  },
  periodChipActive: { backgroundColor: "#6C63FF" },
  periodChipText: { color: "#6C63FF", fontWeight: "600", fontSize: 13 },
  periodChipTextActive: { color: "#fff" },
  categoryScroll: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipActive: { backgroundColor: "#6C63FF", borderColor: "#6C63FF" },
  categoryChipText: { color: "#666", fontSize: 13 },
  categoryChipTextActive: { color: "#fff", fontWeight: "600" },
  resultCount: { fontSize: 12, color: "#999", marginBottom: 8, marginLeft: 2 },
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
  cardPast: { opacity: 0.6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  heartIcon: { fontSize: 20 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  cardDate: { fontSize: 13, color: "#666", marginBottom: 4 },
  cardLocation: { fontSize: 13, color: "#666", marginBottom: 6 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  capacityText: { fontSize: 12, color: "#888" },
  capacityFull: { color: "#E53935", fontWeight: "600" },
  pastLabel: {
    fontSize: 11,
    color: "#fff",
    backgroundColor: "#888",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  empty: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#555" },
  emptySubText: { fontSize: 14, color: "#999", marginTop: 4 },
});
