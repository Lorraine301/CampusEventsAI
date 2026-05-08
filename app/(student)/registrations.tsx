// app/(student)/registrations.tsx

import { useFocusEffect, useRouter } from "expo-router";
import {
  Calendar,
  CalendarCheck,
  Clock,
  Clock3,
  MapPin,
  Ticket,
  XCircle
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
import { registrationsDb } from "../../database/registrations";
import { Event } from "../../types";

const CATEGORY_CONFIG: Record<string, { color: string; bg: string }> = {
  Talk: { color: "#534AB7", bg: "#EEEDFE" },
  Workshop: { color: "#993C1D", bg: "#FAECE7" },
  Club: { color: "#0F6E56", bg: "#E1F5EE" },
  Exam: { color: "#5F5E5A", bg: "#F1EFE8" },
  Other: { color: "#6B7280", bg: "#F3F4F6" },
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
    Alert.alert("Annuler", `Annuler l'inscription à "${event.title}" ?`, [
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
    ]);
  };

  const now = new Date();

  const upcoming = registeredEvents.filter(
    (e) => new Date(e.startDateTime) >= now,
  );
  const past = registeredEvents.filter((e) => new Date(e.startDateTime) < now);

  const renderItem = ({ item }: { item: Event }) => {
    const isPast = new Date(item.startDateTime) < now;
    const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.Other;

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
              <View style={[styles.statusBadge, styles.statusBadgeActive]}>
                <CalendarCheck
                  size={11}
                  color="#3B6D11"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.statusBadgeText, styles.statusBadgeTextActive]}
                >
                  Confirmé
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
            <View style={styles.metaRow}>
              <Calendar size={12} color="#9CA3AF" />
              <Text style={styles.cardMeta}>
                {new Date(item.startDateTime).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Clock3 size={12} color="#9CA3AF" />
              <Text style={styles.cardMeta}>
                {new Date(item.startDateTime).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={12} color="#9CA3AF" />
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.locationName}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Cancel button */}
          {!isPast && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancel(item)}
            >
              <XCircle size={14} color="#A32D2D" style={{ marginRight: 6 }} />
              <Text style={styles.cancelBtnText}>
                Annuler l&apos;inscription
              </Text>
            </TouchableOpacity>
          )}
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
            <Text style={styles.headerTitle}>Mes inscriptions</Text>
            <Text style={styles.headerSubtitle}>Événements confirmés</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>à venir</Text>
          </View>
        </View>

        {registeredEvents.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <CalendarCheck
                size={15}
                color="#534AB7"
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.statCardNumber}>{upcoming.length}</Text>
              <Text style={styles.statCardLabel}>À venir</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMuted]}>
              <Clock3 size={15} color="#9CA3AF" style={{ marginBottom: 6 }} />
              <Text style={[styles.statCardNumber, { color: "#6B7280" }]}>
                {past.length}
              </Text>
              <Text style={styles.statCardLabel}>Passés</Text>
            </View>
            <View style={[styles.statCard, styles.statCardTotal]}>
              <Ticket size={15} color="#0F6E56" style={{ marginBottom: 6 }} />
              <Text style={[styles.statCardNumber, { color: "#0F6E56" }]}>
                {registeredEvents.length}
              </Text>
              <Text style={styles.statCardLabel}>Total</Text>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={registeredEvents}
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
              <Ticket size={36} color="#AFA9EC" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Aucune inscription</Text>
            <Text style={styles.emptySub}>
              Inscrivez-vous à des événements depuis le catalogue
            </Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
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

  statCardMuted: {
    backgroundColor: "#F1EFE8",
  },

  statCardTotal: {
    backgroundColor: "#E1F5EE",
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

  statusBadgeActive: {
    backgroundColor: "#EAF3DE",
  },

  statusBadgePast: {
    backgroundColor: "#F1EFE8",
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  statusBadgeTextActive: {
    color: "#3B6D11",
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

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  cardMeta: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#F0EFF8",
    marginBottom: 12,
  },

  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCEBEB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },

  cancelBtnText: {
    color: "#A32D2D",
    fontSize: 13,
    fontWeight: "600",
  },

  // ─── Empty ─────────────────────────────────────────────────────────────────
  empty: {
    alignItems: "center",
    marginTop: 100,
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
    marginBottom: 6,
  },

  emptySub: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
