import { useFocusEffect, useRouter } from "expo-router";
import {
  Building2,
  Calendar,
  Clock,
  Clock3,
  FileText,
  Heart,
  MapPin,
  Mic,
  Pin,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react-native";
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
      .filter((e): e is Event => e !== null)
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      );
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

  const now = new Date();

  const upcoming = favoriteEvents.filter(
    (e) => new Date(e.startDateTime) >= now,
  );
  const past = favoriteEvents.filter((e) => new Date(e.startDateTime) < now);

  const renderItem = ({ item }: { item: Event }) => {
    const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.Other;
    const { Icon } = cfg;
    const isPast = new Date(item.startDateTime) < now;

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

            {isPast ? (
              <View style={[styles.statusBadge, styles.statusBadgePast]}>
                <Clock size={11} color="#9CA3AF" style={{ marginRight: 4 }} />
                <Text
                  style={[styles.statusBadgeText, styles.statusBadgeTextPast]}
                >
                  Terminé
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusBadgeFav]}>
                <Heart
                  size={10}
                  color="#993C1D"
                  fill="#993C1D"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.statusBadgeText, styles.statusBadgeTextFav]}
                >
                  Favori
                </Text>
              </View>
            )}
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
                {new Date(item.startDateTime).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock3 size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>
                {new Date(item.startDateTime).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
            <View style={styles.savedBadge}>
              <Heart size={11} color="#993C1D" fill="#993C1D" />
              <Text style={styles.savedBadgeText}>Sauvegardé</Text>
            </View>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeFavorite(item.id)}
            >
              <Trash2 size={13} color="#A32D2D" style={{ marginRight: 5 }} />
              <Text style={styles.removeBtnText}>Retirer</Text>
            </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Mes favoris</Text>
            <Text style={styles.headerSubtitle}>Événements sauvegardés</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{favoriteEvents.length}</Text>
            <Text style={styles.statLabel}>favoris</Text>
          </View>
        </View>

        {favoriteEvents.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Sparkles size={15} color="#534AB7" style={{ marginBottom: 6 }} />
              <Text style={styles.statCardNumber}>{favoriteEvents.length}</Text>
              <Text style={styles.statCardLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <Calendar size={15} color="#0F6E56" style={{ marginBottom: 6 }} />
              <Text style={[styles.statCardNumber, { color: "#0F6E56" }]}>
                {upcoming.length}
              </Text>
              <Text style={styles.statCardLabel}>À venir</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMuted]}>
              <Clock3 size={15} color="#9CA3AF" style={{ marginBottom: 6 }} />
              <Text style={[styles.statCardNumber, { color: "#6B7280" }]}>
                {past.length}
              </Text>
              <Text style={styles.statCardLabel}>Passés</Text>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={favoriteEvents}
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
              <Heart
                size={36}
                color="#AFA9EC"
                fill="#AFA9EC"
                strokeWidth={1.5}
              />
            </View>
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptySubtitle}>
              Appuie sur l&apos;étoile d&apos;un événement{"\n"}pour
              l&apos;ajouter ici
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
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFF8",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
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

  statsRow: {
    flexDirection: "row",
    gap: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#EEEDFE",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },

  statCardGreen: {
    backgroundColor: "#E1F5EE",
  },

  statCardMuted: {
    backgroundColor: "#F1EFE8",
  },

  statCardNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#534AB7",
    lineHeight: 24,
  },

  statCardLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // ─── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBEBF5",
    shadowColor: "#534AB7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  cardPast: {
    opacity: 0.65,
  },

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

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusBadgeFav: {
    backgroundColor: "#FAECE7",
  },

  statusBadgePast: {
    backgroundColor: "#F1EFE8",
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  statusBadgeTextFav: {
    color: "#993C1D",
  },

  statusBadgeTextPast: {
    color: "#9CA3AF",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F1D3A",
    marginBottom: 10,
    lineHeight: 21,
  },

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

  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAECE7",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },

  savedBadgeText: {
    color: "#993C1D",
    fontSize: 12,
    fontWeight: "600",
  },

  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCEBEB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  removeBtnText: {
    color: "#A32D2D",
    fontSize: 12,
    fontWeight: "600",
  },

  // ─── Empty ─────────────────────────────────────────────────────────────────
  empty: {
    alignItems: "center",
    marginTop: 90,
    paddingHorizontal: 32,
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
