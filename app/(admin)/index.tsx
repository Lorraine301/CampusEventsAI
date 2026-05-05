import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
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
import { eventsDb } from "../../database/events";
import { Event } from "../../types";

export default function AdminHome() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const stats = {
    total: events.length,
    upcoming: events.filter((e) => new Date(e.startDateTime) >= new Date())
      .length,
    past: events.filter((e) => new Date(e.startDateTime) < new Date()).length,
  };

  const loadEvents = useCallback(() => {
    const data = eventsDb.getAll();
    setEvents(data);
  }, []);

  // Recharge la liste à chaque fois qu'on revient sur cet écran
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents]),
  );

  const handleDelete = (event: Event) => {
    Alert.alert(
      "Supprimer l'événement",
      `Veux-tu vraiment supprimer "${event.title}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            eventsDb.delete(event.id);
            loadEvents();
          },
        },
      ],
    );
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

  const renderItem = ({ item }: { item: Event }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.badge,
            { backgroundColor: getCategoryColor(item.category) },
          ]}
        >
          <Text style={styles.badgeText}>{item.category}</Text>
        </View>
        <Text style={styles.cardDate}>{formatDate(item.startDateTime)}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardLocation}>📍 {item.locationName}</Text>
      <Text style={styles.cardOrganizer}>👤 {item.organizerName}</Text>

      {item.capacity !== undefined && (
        <Text style={styles.cardCapacity}>
          🎫 {item.registeredCount} / {item.capacity} inscrits
        </Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(admin)/edit/${item.id}`)}
        >
          <Text style={styles.editButtonText}>✏️ Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: "#6C63FF" }]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: "#43C6AC" }]}>
          <Text style={[styles.statNumber, { color: "#43C6AC" }]}>
            {stats.upcoming}
          </Text>
          <Text style={styles.statLabel}>À venir</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: "#F7971E" }]}>
          <Text style={[styles.statNumber, { color: "#F7971E" }]}>
            {stats.past}
          </Text>
          <Text style={styles.statLabel}>Passés</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
        <Text style={styles.exportButtonText}>📤 Exporter JSON</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/(admin)/create")}
      >
        <Text style={styles.createButtonText}>＋ Créer un événement</Text>
      </TouchableOpacity>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadEvents} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucun événement pour le moment</Text>
            <Text style={styles.emptySubText}>
              Crée ton premier événement !
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8FF", padding: 16 },
  createButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cardDate: { fontSize: 12, color: "#888" },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  cardLocation: { fontSize: 13, color: "#666", marginBottom: 2 },
  cardOrganizer: { fontSize: 13, color: "#666", marginBottom: 2 },
  cardCapacity: { fontSize: 13, color: "#666", marginBottom: 8 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  editButton: {
    flex: 1,
    backgroundColor: "#F0EEFF",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  editButtonText: { color: "#6C63FF", fontWeight: "600", fontSize: 14 },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FFF0F0",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  deleteButtonText: { color: "#E53935", fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#555" },
  emptySubText: { fontSize: 14, color: "#999", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  statNumber: { fontSize: 26, fontWeight: "800", color: "#6C63FF" },
  statLabel: { fontSize: 12, color: "#999", marginTop: 2, fontWeight: "500" },
  exportButton: {
    borderWidth: 1.5, borderColor: '#6C63FF', borderRadius: 12,
    padding: 12, alignItems: 'center', marginBottom: 10,
  },
  exportButtonText: { color: '#6C63FF', fontSize: 14, fontWeight: '600' },
});
