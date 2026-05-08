import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  Building2,
  Calendar,
  Clock,
  FileText,
  Inbox,
  MapPin,
  Mic,
  Pencil,
  Pin,
  Plus,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Wrench,
} from "lucide-react-native";
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
import { Event } from "../../types";

const CATEGORY_CONFIG: Record<
  string,
  { color: string; bg: string; Icon: any }
> = {
  Talk: { color: "#5B52E8", bg: "#EEEDFD", Icon: Mic },
  Workshop: { color: "#E8527A", bg: "#FDEEF3", Icon: Wrench },
  Club: { color: "#0DB8A0", bg: "#E6F8F6", Icon: Building2 },
  Exam: { color: "#F59E0B", bg: "#FEF3C7", Icon: FileText },
  Other: { color: "#6B7280", bg: "#F3F4F6", Icon: Pin },
};

export default function AdminHome() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(() => {
    setEvents(eventsDb.getAll());
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents]),
  );

  const now = new Date();
  const stats = {
    total: events.length,
    upcoming: events.filter((e) => new Date(e.startDateTime) >= now).length,
    past: events.filter((e) => new Date(e.startDateTime) < now).length,
  };

  const handleDelete = (event: Event) => {
    Alert.alert("Supprimer", `Supprimer "${event.title}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          eventsDb.delete(event.id);
          loadEvents();
        },
      },
    ]);
  };

  const handleExport = async () => {
    try {
      const json = JSON.stringify(events, null, 2);
      const path = FileSystem.documentDirectory + "campus_events_export.json";
      await FileSystem.writeAsStringAsync(path, json);
      await Sharing.shareAsync(path, {
        mimeType: "application/json",
        dialogTitle: "Exporter le catalogue",
      });
    } catch {
      Alert.alert("Erreur", "Impossible d'exporter.");
    }
  };

  const renderItem = ({ item }: { item: Event }) => {
    const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.Other;
    const { Icon } = cfg;
    const isPast = new Date(item.startDateTime) < now;

    return (
      <View style={[styles.card, isPast && styles.cardPast]}>
        {/* Stripe colorée à gauche */}
        <View style={[styles.cardStripe, { backgroundColor: cfg.color }]} />

        <View style={styles.cardBody}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={[styles.categoryPill, { backgroundColor: cfg.bg }]}>
              <Icon size={11} color={cfg.color} style={{ marginRight: 4 }} />
              <Text style={[styles.categoryPillText, { color: cfg.color }]}>
                {item.category}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isPast ? styles.statusBadgePast : styles.statusBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isPast
                    ? styles.statusBadgeTextPast
                    : styles.statusBadgeTextActive,
                ]}
              >
                {isPast ? "Terminé" : "À venir"}
              </Text>
            </View>
          </View>

          {/* Titre */}
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
              <Clock size={12} color="#9CA3AF" />
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
            <View style={styles.metaItem}>
              <User size={12} color="#9CA3AF" />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.organizerName}
              </Text>
            </View>
          </View>

          {/* Capacité */}
          {item.capacity !== undefined && (
            <View style={styles.capacityRow}>
              <View style={styles.capacityBar}>
                <View
                  style={[
                    styles.capacityFill,
                    {
                      width:
                        `${Math.min(100, (item.registeredCount / item.capacity) * 100)}%` as any,
                      backgroundColor:
                        item.registeredCount >= item.capacity
                          ? "#EF4444"
                          : cfg.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.capacityText}>
                {item.registeredCount}/{item.capacity}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/(admin)/edit/${item.id}`)}
            >
              <Pencil size={13} color="#5B52E8" style={{ marginRight: 5 }} />
              <Text style={styles.editBtnText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
            >
              <Trash2 size={13} color="#DC2626" style={{ marginRight: 5 }} />
              <Text style={styles.deleteBtnText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerGreeting}>Bienvenue Admin,</Text>
            <Text style={styles.headerSub}>Gérez les événements du campus</Text>
          </View>
          <TouchableOpacity
            style={styles.exportBtnHeader}
            onPress={handleExport}
          >
            <Upload size={16} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardMain]}>
            <TrendingUp size={18} color="#fff" style={{ marginBottom: 6 }} />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statsCol}>
            <View
              style={[
                styles.statCard,
                styles.statCardSmall,
                styles.statCardGreen,
              ]}
            >
              <Text style={[styles.statNumber, styles.statNumberGreen]}>
                {stats.upcoming}
              </Text>
              <Text style={[styles.statLabel, styles.statLabelGreen]}>
                À venir
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                styles.statCardSmall,
                styles.statCardRed,
              ]}
            >
              <Text style={[styles.statNumber, styles.statNumberRed]}>
                {stats.past}
              </Text>
              <Text style={[styles.statLabel, styles.statLabelRed]}>
                Passés
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Create button */}
      <View style={styles.createRow}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push("/(admin)/create")}
          activeOpacity={0.88}
        >
          <View style={styles.createBtnIcon}>
            <Plus size={20} color="#5B52E8" />
          </View>
          <View>
            <Text style={styles.createBtnTitle}>Créer un événement</Text>
            <Text style={styles.createBtnSub}>Ajouter au catalogue</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadEvents}
            tintColor="#5B52E8"
          />
        }
        ListHeaderComponent={
          events.length > 0 ? (
            <Text style={styles.listHeader}>
              {events.length} événement{events.length > 1 ? "s" : ""}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Inbox size={36} color="#C4BFFF" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Aucun événement</Text>
            <Text style={styles.emptySubtitle}>
              Crée ton premier événement !
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
  container: { flex: 1, backgroundColor: "#F4F3FF" },

  // Header
  header: {
    backgroundColor: "#1F1D3A",
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 3,
  },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)" },
  exportBtnHeader: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statsCol: { flex: 1, gap: 10 },
  statCard: { borderRadius: 16, padding: 16, justifyContent: "center" },
  statCardMain: {
    flex: 1,
    backgroundColor: "#5B52E8",
    alignItems: "flex-start",
  },
  statCardSmall: { flex: 1, alignItems: "flex-start" },
  statCardGreen: {
    backgroundColor: "rgba(5, 150, 105, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.2)",
  },
  statCardRed: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
  },
  statNumberGreen: { fontSize: 22, color: "#A5F3D0" },
  statNumberRed: { fontSize: 22, color: "#FCA5A5" },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  statLabelGreen: { color: "rgba(167,243,208,0.8)" },
  statLabelRed: { color: "rgba(252,165,165,0.8)" },

  // Create button
  createRow: { paddingHorizontal: 16, paddingVertical: 14 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E8E6FF",
    shadowColor: "#5B52E8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  createBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEEDFD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  createBtnTitle: { fontSize: 15, fontWeight: "800", color: "#1F1D3A" },
  createBtnSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  listHeader: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 2,
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#5B52E8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  cardPast: { opacity: 0.6 },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  categoryPillText: { fontSize: 11, fontWeight: "700" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeActive: { backgroundColor: "#D1FAE5" },
  statusBadgePast: { backgroundColor: "#F3F4F6" },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  statusBadgeTextActive: { color: "#065F46" },
  statusBadgeTextPast: { color: "#9CA3AF" },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F1D3A",
    marginBottom: 10,
    lineHeight: 21,
  },

  // Meta 2×2 grid
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "48%",
  },
  metaText: { fontSize: 12, color: "#6B7280", flex: 1 },

  // Capacity bar
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  capacityBar: {
    flex: 1,
    height: 5,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    overflow: "hidden",
  },
  capacityFill: { height: "100%", borderRadius: 10 },
  capacityText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },

  // Actions
  cardActions: { flexDirection: "row", gap: 8 },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEEDFD",
    borderRadius: 10,
    paddingVertical: 10,
  },
  editBtnText: { color: "#5B52E8", fontWeight: "700", fontSize: 13 },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingVertical: 10,
  },
  deleteBtnText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },

  // Empty
  empty: { alignItems: "center", marginTop: 80 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEEDFD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF" },
});
