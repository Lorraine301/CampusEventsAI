import { useFocusEffect, useRouter } from "expo-router";
import {
  Building2,
  Calendar,
  CircleX,
  Clock,
  FileText,
  MapPin,
  Mic,
  Pin,
  Search,
  Star,
  Users,
  Wrench,
  X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
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

const CATEGORY_CONFIG: Record<
  string,
  { color: string; bg: string; Icon: any }
> = {
  Talk: { color: "#534AB7", bg: "#EEEDFE", Icon: Mic },
  Workshop: { color: "#993C1D", bg: "#FAECE7", Icon: Wrench },
  Club: { color: "#0F6E56", bg: "#E1F5EE", Icon: Building2 },
  Exam: { color: "#5F5E5A", bg: "#F1EFE8", Icon: FileText },
  Other: { color: "#6B7280", bg: "#F3F4F6", Icon: Pin },
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
    setAllEvents(eventsDb.getAll());
    if (user) {
      setFavoriteIds(new Set(favoritesDb.getFavoriteEventIds(user.email)));
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
    const d = new Date(event.startDateTime);
    if (filter === "upcoming" && d < now) return false;
    if (filter === "past" && d >= now) return false;
    if (selectedCategory && event.category !== selectedCategory) return false;
    if (search && !event.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const upcomingCount = allEvents.filter(
    (e) => new Date(e.startDateTime) >= now,
  ).length;

  const renderItem = ({ item }: { item: Event }) => {
    const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.Other;
    const { Icon } = cfg;
    const isPast = new Date(item.startDateTime) < now;
    const isFull =
      item.capacity !== undefined && item.registeredCount >= item.capacity;
    const isFav = favoriteIds.has(item.id);

    const capacityRatio =
      item.capacity !== undefined && item.capacity > 0
        ? item.registeredCount / item.capacity
        : 0;

    return (
      <TouchableOpacity
        style={[styles.card, isPast && styles.cardPast]}
        onPress={() => router.push(`/(student)/events/${item.id}`)}
        activeOpacity={0.92}
      >
        {/* Top color bar */}
        <View style={[styles.cardTopBar, { backgroundColor: cfg.color }]} />

        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardTop}>
            <View style={[styles.categoryPill, { backgroundColor: cfg.bg }]}>
              <Icon size={11} color={cfg.color} style={{ marginRight: 4 }} />
              <Text style={[styles.categoryPillText, { color: cfg.color }]}>
                {item.category}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => toggleFavorite(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View
                style={[styles.favoriteBtn, isFav && styles.favoriteBtnActive]}
              >
                <Star
                  size={15}
                  color={isFav ? "#BA7517" : "#9CA3AF"}
                  fill={isFav ? "#BA7517" : "transparent"}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Meta */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Calendar size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>
                {formatDate(item.startDateTime)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={12} color="#9CA3AF" />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.locationName}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer */}
          <View style={styles.cardFooter}>
            {/* Capacity with progress bar */}
            {item.capacity !== undefined ? (
              <View style={styles.capacityWrap}>
                <Users size={12} color={isFull ? "#A32D2D" : "#9CA3AF"} />
                <View style={styles.capacityTrack}>
                  <View
                    style={[
                      styles.capacityFill,
                      {
                        width: `${Math.min(capacityRatio * 100, 100)}%` as any,
                        backgroundColor: isFull ? "#E24B4A" : cfg.color,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.capacityText, isFull && { color: "#A32D2D" }]}
                >
                  {item.registeredCount}/{item.capacity}
                </Text>
              </View>
            ) : (
              <View />
            )}

            {/* Status badge */}
            {isFull ? (
              <View style={[styles.statusBadge, styles.statusBadgeFull]}>
                <CircleX size={11} color="#A32D2D" style={{ marginRight: 4 }} />
                <Text
                  style={[styles.statusBadgeText, styles.statusBadgeTextFull]}
                >
                  Complet
                </Text>
              </View>
            ) : isPast ? (
              <View style={[styles.statusBadge, styles.statusBadgePast]}>
                <Clock size={11} color="#9CA3AF" style={{ marginRight: 4 }} />
                <Text
                  style={[styles.statusBadgeText, styles.statusBadgeTextPast]}
                >
                  Terminé
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusBadgeUpcoming]}>
                <Clock size={11} color="#3B6D11" style={{ marginRight: 4 }} />
                <Text
                  style={[
                    styles.statusBadgeText,
                    styles.statusBadgeTextUpcoming,
                  ]}
                >
                  À venir
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Explorer</Text>
            <Text style={styles.headerSubtitle}>Événements du campus</Text>
          </View>
          {/* Stat pill */}
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{upcomingCount}</Text>
            <Text style={styles.statLabel}>à venir</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un événement..."
            placeholderTextColor="#BEC3CF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={15} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Period tabs */}
        <View style={styles.tabsRow}>
          {(["upcoming", "all", "past"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.tab, filter === f && styles.tabActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[styles.tabText, filter === f && styles.tabTextActive]}
              >
                {f === "upcoming" ? "À venir" : f === "all" ? "Tous" : "Passés"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category chips */}
      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
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
              Tous
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && {
                    backgroundColor: cfg.color,
                    borderColor: cfg.color,
                  },
                ]}
                onPress={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
              >
                <cfg.Icon
                  size={12}
                  color={selectedCategory === cat ? "#fff" : cfg.color}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Result count */}
      <Text style={styles.resultCount}>
        {filteredEvents.length} événement
        {filteredEvents.length > 1 ? "s" : ""}
      </Text>

      {/* List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            tintColor="#534AB7"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Search size={38} color="#AFA9EC" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Aucun événement trouvé</Text>
            <Text style={styles.emptySubtitle}>
              Essaie de modifier les filtres{"\n"}ou la recherche
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F3FF",
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFF8",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1F1D3A",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // Stat pill (top-right)
  statPill: {
    backgroundColor: "#EEEDFE",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#534AB7",
    lineHeight: 24,
  },

  statLabel: {
    fontSize: 10,
    color: "#7F77DD",
    marginTop: 1,
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F3FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E8E6FF",
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F1D3A",
  },

  // Period tabs (inside header, above border)
  tabsRow: {
    flexDirection: "row",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  tabActive: {
    borderBottomColor: "#534AB7",
  },

  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
  },

  tabTextActive: {
    color: "#534AB7",
  },

  // ─── Category chips ────────────────────────────────────────────────────────
  chipsContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFF8",
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E8E6FF",
  },

  categoryChipActive: {
    backgroundColor: "#534AB7",
    borderColor: "#534AB7",
  },

  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  categoryChipTextActive: {
    color: "#fff",
  },

  // ─── Result count ──────────────────────────────────────────────────────────
  resultCount: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 16,
    marginTop: 10,
    marginBottom: 4,
    fontWeight: "600",
  },

  // ─── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBEBF5",
    // subtle shadow
    shadowColor: "#534AB7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  cardPast: {
    opacity: 0.65,
  },

  // Top color bar replaces left stripe
  cardTopBar: {
    height: 5,
    width: "100%",
  },

  cardBody: {
    padding: 14,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  categoryPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  favoriteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F4F3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  favoriteBtnActive: {
    backgroundColor: "#FAEEDA",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F1D3A",
    marginBottom: 10,
    lineHeight: 21,
  },

  // Meta
  metaGrid: {
    gap: 6,
    marginBottom: 12,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metaText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#F0EFF8",
    marginBottom: 12,
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Capacity with progress bar
  capacityWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  capacityTrack: {
    width: 56,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#F0EFF8",
    overflow: "hidden",
  },

  capacityFill: {
    height: "100%",
    borderRadius: 4,
  },

  capacityText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },

  // Status badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusBadgeUpcoming: {
    backgroundColor: "#EAF3DE",
  },

  statusBadgePast: {
    backgroundColor: "#F1EFE8",
  },

  statusBadgeFull: {
    backgroundColor: "#FCEBEB",
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  statusBadgeTextUpcoming: {
    color: "#3B6D11",
  },

  statusBadgeTextPast: {
    color: "#9CA3AF",
  },

  statusBadgeTextFull: {
    color: "#A32D2D",
  },

  // ─── Empty state ───────────────────────────────────────────────────────────
  empty: {
    alignItems: "center",
    marginTop: 90,
  },

  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EEEDFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
  },
});
