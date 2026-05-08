import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Star,
  XCircle,
} from "lucide-react-native";
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

const CATEGORY_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  Talk: { color: "#534AB7", bg: "#EEEDFE", label: "Talk" },
  Workshop: { color: "#993C1D", bg: "#FAECE7", label: "Workshop" },
  Club: { color: "#0F6E56", bg: "#E1F5EE", label: "Club" },
  Exam: { color: "#5F5E5A", bg: "#F1EFE8", label: "Exam" },
  Other: { color: "#6B7280", bg: "#F3F4F6", label: "Other" },
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
  const cfg = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.Other;

  const capacityRatio =
    event.capacity !== undefined && event.capacity > 0
      ? event.registeredCount / event.capacity
      : 0;

  const handleRegister = () => {
    if (!user) return;
    Alert.alert("Confirmer", `S'inscrire à "${event.title}" ?`, [
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
        },
      },
    ]);
  };

  const handleCancel = () => {
    if (!user) return;
    Alert.alert("Annuler", "Annuler votre inscription ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui",
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
    ]);
  };

  const toggleFav = () => {
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero header */}
      <View style={styles.heroCard}>
        <View style={[styles.heroTopBar, { backgroundColor: cfg.color }]} />
        <View style={styles.heroBody}>
          <View style={styles.heroTop}>
            <View style={[styles.categoryPill, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.categoryPillText, { color: cfg.color }]}>
                {event.category}
              </Text>
            </View>
            {isPast && (
              <View style={styles.pastBadge}>
                <Clock size={11} color="#9CA3AF" style={{ marginRight: 4 }} />
                <Text style={styles.pastBadgeText}>Terminé</Text>
              </View>
            )}
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.organizerText}>Par {event.organizerName}</Text>
        </View>
      </View>

      {/* Info grid */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoCell}>
            <View style={[styles.infoIconWrap, { backgroundColor: cfg.bg }]}>
              <Calendar size={14} color={cfg.color} />
            </View>
            <Text style={styles.infoCellLabel}>Date</Text>
            <Text style={styles.infoCellValue}>
              {new Date(event.startDateTime).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.infoCellDivider} />

          <View style={styles.infoCell}>
            <View style={[styles.infoIconWrap, { backgroundColor: cfg.bg }]}>
              <Clock size={14} color={cfg.color} />
            </View>
            <Text style={styles.infoCellLabel}>Heure</Text>
            <Text style={styles.infoCellValue}>
              {new Date(event.startDateTime).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          <View style={styles.infoCellDivider} />

          <View style={styles.infoCell}>
            <View style={[styles.infoIconWrap, { backgroundColor: cfg.bg }]}>
              <MapPin size={14} color={cfg.color} />
            </View>
            <Text style={styles.infoCellLabel}>Lieu</Text>
            <Text style={styles.infoCellValue} numberOfLines={1}>
              {event.locationName}
            </Text>
          </View>
        </View>

        {event.capacity !== undefined && (
          <>
            <View style={styles.infoRowDivider} />
            <View style={styles.capacityRow}>
              <View style={styles.capacityLeft}>
                <Text style={styles.infoCellLabel}>Capacité</Text>
                <Text
                  style={[styles.infoCellValue, isFull && { color: "#A32D2D" }]}
                >
                  {event.registeredCount}/{event.capacity} places
                </Text>
              </View>
              <View style={styles.capacityBarWrap}>
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
                {isFull && (
                  <View style={styles.fullBadge}>
                    <Text style={styles.fullBadgeText}>Complet</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descText}>{event.description}</Text>
      </View>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsRow}>
            {event.tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tagChip,
                  { backgroundColor: cfg.bg, borderColor: cfg.color + "30" },
                ]}
              >
                <Text style={[styles.tagChipText, { color: cfg.color }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        {isPast ? (
          <View style={styles.statusBox}>
            <Clock size={15} color="#9CA3AF" style={{ marginRight: 8 }} />
            <Text style={styles.statusBoxText}>Cet événement est terminé</Text>
          </View>
        ) : isRegistered ? (
          <>
            <View style={[styles.statusBox, styles.statusBoxGreen]}>
              <CheckCircle
                size={15}
                color="#3B6D11"
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.statusBoxText, { color: "#3B6D11" }]}>
                Vous êtes inscrit à cet événement
              </Text>
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <XCircle size={15} color="#A32D2D" style={{ marginRight: 6 }} />
              <Text style={styles.cancelBtnText}>Annuler mon inscription</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.favBtnStandalone,
                isFavorite && styles.favBtnActive,
              ]}
              onPress={toggleFav}
            >
              <Star
                size={15}
                color={isFavorite ? "#BA7517" : "#6B7280"}
                fill={isFavorite ? "#BA7517" : "transparent"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.favBtnText,
                  isFavorite && styles.favBtnTextActive,
                ]}
              >
                {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              </Text>
            </TouchableOpacity>
          </>
        ) : isFull ? (
          <View style={[styles.statusBox, styles.statusBoxRed]}>
            <XCircle size={15} color="#A32D2D" style={{ marginRight: 8 }} />
            <Text style={[styles.statusBoxText, { color: "#A32D2D" }]}>
              Événement complet
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.registerBtn, { backgroundColor: cfg.color }]}
                onPress={handleRegister}
                activeOpacity={0.88}
              >
                <Text style={styles.registerBtnText}>S&apos;inscrire</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.favBtn, isFavorite && styles.favBtnActive]}
                onPress={toggleFav}
              >
                <Star
                  size={16}
                  color={isFavorite ? "#BA7517" : "#6B7280"}
                  fill={isFavorite ? "#BA7517" : "transparent"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.favBtnText,
                    isFavorite && styles.favBtnTextActive,
                  ]}
                >
                  Favori
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F3FF" },

  // ─── Hero ──────────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFF8",
    overflow: "hidden",
  },

  heroTopBar: {
    height: 6,
    width: "100%",
  },

  heroBody: {
    padding: 20,
    paddingTop: 18,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  categoryPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  categoryPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  pastBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1EFE8",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  pastBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
  },

  eventTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F1D3A",
    lineHeight: 30,
    marginBottom: 8,
  },

  organizerText: { fontSize: 13, color: "#9CA3AF" },

  // ─── Info card ─────────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0EFF8",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoCell: {
    flex: 1,
    alignItems: "center",
  },

  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  infoCellDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#F0EFF8",
    marginHorizontal: 4,
    alignSelf: "center",
  },

  infoCellLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  infoCellValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D3A",
    textAlign: "center",
  },

  infoRowDivider: {
    height: 1,
    backgroundColor: "#F0EFF8",
    marginVertical: 14,
  },

  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  capacityLeft: {},

  capacityBarWrap: {
    flex: 1,
    gap: 6,
  },

  capacityTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: "#F0EFF8",
    overflow: "hidden",
  },

  capacityFill: {
    height: "100%",
    borderRadius: 6,
  },

  fullBadge: {
    backgroundColor: "#FCEBEB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },

  fullBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#A32D2D",
  },

  // ─── Sections ──────────────────────────────────────────────────────────────
  section: {
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0EFF8",
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  descText: { fontSize: 15, color: "#374151", lineHeight: 24 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  tagChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },

  tagChipText: { fontSize: 13, fontWeight: "500" },

  // ─── Actions ───────────────────────────────────────────────────────────────
  actionsSection: {
    padding: 16,
    marginTop: 6,
    gap: 10,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  registerBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  registerBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  favBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E6FF",
  },

  favBtnActive: {
    backgroundColor: "#FAEEDA",
    borderColor: "#BA7517",
  },

  favBtnText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },

  favBtnTextActive: { color: "#BA7517" },

  favBtnStandalone: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E6FF",
  },

  statusBox: {
    flexDirection: "row",
    backgroundColor: "#F1EFE8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },

  statusBoxGreen: { backgroundColor: "#EAF3DE" },
  statusBoxRed: { backgroundColor: "#FCEBEB" },

  statusBoxText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },

  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCEBEB",
    borderRadius: 12,
    paddingVertical: 13,
  },

  cancelBtnText: { color: "#A32D2D", fontSize: 14, fontWeight: "600" },
});
