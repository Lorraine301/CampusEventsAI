import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { eventsDb } from "../../database/events";
import { favoritesDb } from "../../database/favorites";
import { llmResultsDb } from "../../database/llmResults";
import { LLMResultType } from '../../types';
import { registrationsDb } from "../../database/registrations";
import {
  askCatalog,
  getRecommendations,
  getWeeklySummary,
  planWeek,
  searchEventsNL,
} from "../../services/llm";
import { Event } from "../../types";

const uuidv4 = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

type TabId = "search" | "recommendation" | "planning" | "qa" | "weekly";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "search", label: "Recherche", icon: "🔍" },
  { id: "recommendation", label: "Pour moi", icon: "🎯" },
  { id: "planning", label: "Planning", icon: "🗓" },
  { id: "qa", label: "Questions", icon: "💬" },
  { id: "weekly", label: "Semaine", icon: "📰" },
];

export default function Assistant() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("search");
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");

  const [recoResult, setRecoResult] = useState<any>(null);
  const [recoError, setRecoError] = useState("");

  const [planConstraints, setPlanConstraints] = useState("");
  const [planResult, setPlanResult] = useState<any>(null);
  const [planError, setPlanError] = useState("");

  const [qaQuestion, setQaQuestion] = useState("");
  const [qaResult, setQaResult] = useState<any>(null);
  const [qaError, setQaError] = useState("");

  const [weeklyResult, setWeeklyResult] = useState<any>(null);
  const [weeklyError, setWeeklyError] = useState("");

  const [allEvents, setAllEvents] = useState<Event[]>([]);

  useFocusEffect(
    useCallback(() => {
      setAllEvents(eventsDb.getAll());
    }, []),
  );

  const parseJSON = (raw: string) => {
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    } catch {
      throw new Error("Réponse invalide du modèle. Réessaie.");
    }
  };

  const saveCache = (type: LLMResultType, input: string, output: string) => {
    if (!user) return;
    llmResultsDb.save({
      id: uuidv4(),
      userId: user.email,
      type,
      inputText: input,
      outputText: output,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const cached = llmResultsDb.getCached(
        user!.email,
        "search",
        searchQuery.trim(),
      );
      let raw = cached?.outputText;
      if (!raw) {
        raw = await searchEventsNL(searchQuery.trim(), allEvents);
        saveCache("search", searchQuery.trim(), raw);
      }
      setSearchResult(parseJSON(raw));
    } catch (e: any) {
      setSearchError(e.message ?? "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendations = async () => {
    setIsLoading(true);
    setRecoError("");
    setRecoResult(null);
    try {
      const cacheKey = "recommendations";
      const cached = llmResultsDb.getCached(
        user!.email,
        "recommendation",
        cacheKey,
      );
      let raw = cached?.outputText;
      if (!raw) {
        const upcoming = eventsDb.getUpcoming();
        const favIds = favoritesDb.getFavoriteEventIds(user!.email);
        const regIds = registrationsDb.getRegisteredEventIds(user!.email);
        const favEvents = favIds
          .map((id) => eventsDb.getById(id))
          .filter(Boolean) as Event[];
        const regEvents = regIds
          .map((id) => eventsDb.getById(id))
          .filter(Boolean) as Event[];
        raw = await getRecommendations(upcoming, favEvents, regEvents);
        saveCache("recommendation", cacheKey, raw);
      }
      setRecoResult(parseJSON(raw));
    } catch (e: any) {
      setRecoError(e.message ?? "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanning = async () => {
    if (!planConstraints.trim()) return;
    setIsLoading(true);
    setPlanError("");
    setPlanResult(null);
    try {
      const cached = llmResultsDb.getCached(
        user!.email,
        "planning",
        planConstraints.trim(),
      );
      let raw = cached?.outputText;
      if (!raw) {
        const now = new Date();
        const weekEnd = new Date();
        weekEnd.setDate(now.getDate() + 7);
        const weekEvents = allEvents.filter((e) => {
          const d = new Date(e.startDateTime);
          return d >= now && d <= weekEnd;
        });
        raw = await planWeek(planConstraints.trim(), weekEvents);
        saveCache("planning", planConstraints.trim(), raw);
      }
      setPlanResult(parseJSON(raw));
    } catch (e: any) {
      setPlanError(e.message ?? "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQA = async () => {
    if (!qaQuestion.trim()) return;
    setIsLoading(true);
    setQaError("");
    setQaResult(null);
    try {
      const cached = llmResultsDb.getCached(
        user!.email,
        "qa",
        qaQuestion.trim(),
      );
      let raw = cached?.outputText;
      if (!raw) {
        raw = await askCatalog(qaQuestion.trim(), allEvents);
        saveCache("qa", qaQuestion.trim(), raw);
      }
      setQaResult(parseJSON(raw));
    } catch (e: any) {
      setQaError(e.message ?? "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeeklySummary = async () => {
    setIsLoading(true);
    setWeeklyError("");
    setWeeklyResult(null);
    try {
      const cacheKey = "weekly_" + new Date().toISOString().slice(0, 10);
      const cached = llmResultsDb.getCached(user!.email, "weekly", cacheKey);
      let raw = cached?.outputText;
      if (!raw) {
        const now = new Date();
        const weekEnd = new Date();
        weekEnd.setDate(now.getDate() + 7);
        const weekEvents = allEvents.filter((e) => {
          const d = new Date(e.startDateTime);
          return d >= now && d <= weekEnd;
        });
        raw = await getWeeklySummary(weekEvents);
        saveCache("weekly", cacheKey, raw);
      }
      setWeeklyResult(parseJSON(raw));
    } catch (e: any) {
      setWeeklyError(e.message ?? "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Avertissement */}
      <View style={styles.warning}>
        <Text style={styles.warningText}>
          ⚠️ Ne soumettez pas de données personnelles ou sensibles à cet
          assistant.
        </Text>
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
            disabled={isLoading}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {/* ─── RECHERCHE NL ─── */}
        {activeTab === "search" && (
          <View>
            <Text style={styles.sectionTitle}>🔍 Recherche intelligente</Text>
            <Text style={styles.sectionDesc}>
              Décris ce que tu cherches en langage naturel, même sans connaître
              les mots-clés exacts.
            </Text>
            <View style={styles.examples}>
              {[
                '"quelque chose sur l\'IA ce weekend"',
                '"atelier pratique pas trop tôt"',
                '"préparer ma recherche de stage"',
              ].map((ex) => (
                <TouchableOpacity
                  key={ex}
                  onPress={() => setSearchQuery(ex.replace(/"/g, ""))}
                  disabled={isLoading}
                >
                  <Text style={styles.exampleChip}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Ex: un événement utile pour ma carrière en data..."
              placeholderTextColor="#bbb"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.actionButton,
                (isLoading || !searchQuery.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Rechercher</Text>
              )}
            </TouchableOpacity>
            {searchError !== "" && (
              <ErrorCard message={searchError} onRetry={handleSearch} />
            )}
            {searchResult && (
              <SearchResults data={searchResult} events={allEvents} />
            )}
          </View>
        )}

        {/* ─── RECOMMANDATIONS ─── */}
        {activeTab === "recommendation" && (
          <View>
            <Text style={styles.sectionTitle}>
              🎯 Recommandations personnalisées
            </Text>
            <Text style={styles.sectionDesc}>
              Basées sur tes favoris et inscriptions, je te suggère 3 événements
              qui pourraient vous intéresser.
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.buttonDisabled]}
              onPress={handleRecommendations}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>
                  Générer mes recommandations
                </Text>
              )}
            </TouchableOpacity>
            {recoError !== "" && (
              <ErrorCard message={recoError} onRetry={handleRecommendations} />
            )}
            {recoResult && <RecoResults data={recoResult} />}
          </View>
        )}

        {/* ─── PLANNING ─── */}
        {activeTab === "planning" && (
          <View>
            <Text style={styles.sectionTitle}>🗓 Planification de semaine</Text>
            <Text style={styles.sectionDesc}>
              Décris tes contraintes et je te propose un planning sans conflit.
            </Text>
            <View style={styles.examples}>
              {[
                '"cours lundi et mercredi matin, exam jeudi"',
                '"libre tous les après-midis"',
              ].map((ex) => (
                <TouchableOpacity
                  key={ex}
                  onPress={() => setPlanConstraints(ex.replace(/"/g, ""))}
                  disabled={isLoading}
                >
                  <Text style={styles.exampleChip}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={planConstraints}
              onChangeText={setPlanConstraints}
              placeholder="Ex: J'ai cours lundi matin, exam mercredi après-midi..."
              placeholderTextColor="#bbb"
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[
                styles.actionButton,
                (isLoading || !planConstraints.trim()) && styles.buttonDisabled,
              ]}
              onPress={handlePlanning}
              disabled={isLoading || !planConstraints.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>
                  Planifier ma semaine
                </Text>
              )}
            </TouchableOpacity>
            {planError !== "" && (
              <ErrorCard message={planError} onRetry={handlePlanning} />
            )}
            {planResult && <PlanResults data={planResult} />}
          </View>
        )}

        {/* ─── Q/R CATALOGUE ─── */}
        {activeTab === "qa" && (
          <View>
            <Text style={styles.sectionTitle}>
              💬 Questions sur le catalogue
            </Text>
            <Text style={styles.sectionDesc}>
              Pose des questions sur des événements du campus.
            </Text>
            <View style={styles.examples}>
              {[
                '"Quels clubs sont actifs ce mois-ci ?"',
                '"Événements utiles pour data science ?"',
                '"Quelles places sont encore disponibles ?"',
              ].map((ex) => (
                <TouchableOpacity
                  key={ex}
                  onPress={() => setQaQuestion(ex.replace(/"/g, ""))}
                  disabled={isLoading}
                >
                  <Text style={styles.exampleChip}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={qaQuestion}
              onChangeText={setQaQuestion}
              placeholder="Pose ta question..."
              placeholderTextColor="#bbb"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.actionButton,
                (isLoading || !qaQuestion.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleQA}
              disabled={isLoading || !qaQuestion.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Poser la question</Text>
              )}
            </TouchableOpacity>
            {qaError !== "" && (
              <ErrorCard message={qaError} onRetry={handleQA} />
            )}
            {qaResult && <QAResult data={qaResult} />}
          </View>
        )}

        {/* ─── RÉSUMÉ HEBDO ─── */}
        {activeTab === "weekly" && (
          <View>
            <Text style={styles.sectionTitle}>
              📰 Cette semaine sur le campus
            </Text>
            <Text style={styles.sectionDesc}>
              Un résumé intelligent des événements à ne pas manquer cette
              semaine.
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.buttonDisabled]}
              onPress={handleWeeklySummary}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>
                  📰 Générer le résumé
                </Text>
              )}
            </TouchableOpacity>
            {weeklyError !== "" && (
              <ErrorCard message={weeklyError} onRetry={handleWeeklySummary} />
            )}
            {weeklyResult && <WeeklySummary data={weeklyResult} />}
          </View>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Composants de résultats ───

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={resultStyles.errorCard}>
      <Text style={resultStyles.errorTitle}>❌ Erreur</Text>
      <Text style={resultStyles.errorMessage}>{message}</Text>
      <TouchableOpacity style={resultStyles.retryBtn} onPress={onRetry}>
        <Text style={resultStyles.retryBtnText}>🔄 Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

function SearchResults({ data, events }: { data: any; events: Event[] }) {
  if (!data.results?.length) {
    return (
      <View style={resultStyles.emptyCard}>
        <Text style={resultStyles.emptyIcon}>🔎</Text>
        <Text style={resultStyles.emptyText}>
          {data.message ?? "Aucun résultat trouvé."}
        </Text>
      </View>
    );
  }
  return (
    <View>
      <Text style={resultStyles.resultCount}>
        {data.results.length} résultat(s) trouvé(s)
      </Text>
      {data.results.map((r: any) => {
        const event = events.find((e) => e.id === r.id);
        return (
          <View key={r.id} style={resultStyles.resultCard}>
            <Text style={resultStyles.resultTitle}>{r.titre}</Text>
            {event && (
              <Text style={resultStyles.resultMeta}>
                🗓{" "}
                {new Date(event.startDateTime).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                {"  "}📍 {event.locationName}
              </Text>
            )}
            <View style={resultStyles.justificationBox}>
              <Text style={resultStyles.justificationLabel}>
                Pourquoi ce résultat :
              </Text>
              <Text style={resultStyles.justificationText}>
                {r.justification}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RecoResults({ data }: { data: any }) {
  if (data.message && !data.recommendations?.length) {
    return (
      <View style={resultStyles.emptyCard}>
        <Text style={resultStyles.emptyIcon}>🎯</Text>
        <Text style={resultStyles.emptyText}>{data.message}</Text>
      </View>
    );
  }
  return (
    <View>
      {data.profil_detecte && (
        <View style={resultStyles.profilCard}>
          <Text style={resultStyles.profilLabel}>Ton profil détecté :</Text>
          <Text style={resultStyles.profilText}>{data.profil_detecte}</Text>
        </View>
      )}
      {data.recommendations?.map((r: any, i: number) => (
        <View key={r.id ?? i} style={resultStyles.resultCard}>
          <View style={resultStyles.rankBadge}>
            <Text style={resultStyles.rankBadgeText}>#{i + 1}</Text>
          </View>
          <Text style={resultStyles.resultTitle}>{r.titre}</Text>
          <View style={resultStyles.justificationBox}>
            <Text style={resultStyles.justificationLabel}>
              Recommandé parce que :
            </Text>
            <Text style={resultStyles.justificationText}>
              {r.justification}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function PlanResults({ data }: { data: any }) {
  if (!data.planning?.length) {
    return (
      <View style={resultStyles.emptyCard}>
        <Text style={resultStyles.emptyIcon}>🗓</Text>
        <Text style={resultStyles.emptyText}>
          {data.message ?? "Aucun événement cette semaine."}
        </Text>
      </View>
    );
  }
  return (
    <View>
      {data.planning.map((p: any, i: number) => (
        <View key={i} style={resultStyles.planCard}>
          <View style={resultStyles.planDayBadge}>
            <Text style={resultStyles.planDayText}>{p.jour}</Text>
            <Text style={resultStyles.planHourText}>{p.heure}</Text>
          </View>
          <View style={resultStyles.planContent}>
            <Text style={resultStyles.planTitle}>{p.evenement_titre}</Text>
            <Text style={resultStyles.planReason}>{p.raison}</Text>
          </View>
        </View>
      ))}
      {data.conflits_evites?.length > 0 && (
        <View style={resultStyles.conflictCard}>
          <Text style={resultStyles.conflictLabel}>⚠️ Conflits évités :</Text>
          {data.conflits_evites.map((c: string, i: number) => (
            <Text key={i} style={resultStyles.conflictItem}>
              • {c}
            </Text>
          ))}
        </View>
      )}
      {data.conseils && (
        <View style={resultStyles.adviceCard}>
          <Text style={resultStyles.adviceLabel}>💡 Conseil :</Text>
          <Text style={resultStyles.adviceText}>{data.conseils}</Text>
        </View>
      )}
    </View>
  );
}

function QAResult({ data }: { data: any }) {
  return (
    <View>
      <View style={resultStyles.qaCard}>
        <Text style={resultStyles.qaText}>{data.reponse}</Text>
      </View>
      {data.evenements_mentionnes?.length > 0 && (
        <View style={resultStyles.mentionedCard}>
          <Text style={resultStyles.mentionedLabel}>
            Événements mentionnés :
          </Text>
          {data.evenements_mentionnes.map((titre: string, i: number) => (
            <Text key={i} style={resultStyles.mentionedItem}>
              📌 {titre}
            </Text>
          ))}
        </View>
      )}
      {data.suggestion && (
        <View style={resultStyles.adviceCard}>
          <Text style={resultStyles.adviceLabel}>💡 Suggestion :</Text>
          <Text style={resultStyles.adviceText}>{data.suggestion}</Text>
        </View>
      )}
    </View>
  );
}

function WeeklySummary({ data }: { data: any }) {
  return (
    <View>
      <View style={resultStyles.weeklyHeader}>
        <Text style={resultStyles.weeklyTitle}>{data.titre}</Text>
        <Text style={resultStyles.weeklyIntro}>{data.intro}</Text>
      </View>
      {data.highlights?.map((h: any, i: number) => (
        <View key={i} style={resultStyles.highlightRow}>
          <Text style={resultStyles.highlightEmoji}>{h.emoji}</Text>
          <Text style={resultStyles.highlightText}>{h.texte}</Text>
        </View>
      ))}
      {data.evenement_star && (
        <View style={resultStyles.starCard}>
          <Text style={resultStyles.starLabel}>⭐ Événement de la semaine</Text>
          <Text style={resultStyles.starTitle}>
            {data.evenement_star.titre}
          </Text>
          <Text style={resultStyles.starReason}>
            {data.evenement_star.raison}
          </Text>
        </View>
      )}
      {data.conclusion && (
        <View style={resultStyles.adviceCard}>
          <Text style={resultStyles.adviceText}>{data.conclusion}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles principaux ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8FF" },
  warning: {
    backgroundColor: "#FFF8E1",
    borderLeftWidth: 4,
    borderLeftColor: "#F7971E",
    margin: 12,
    borderRadius: 8,
    padding: 12,
  },
  warningText: { fontSize: 12, color: "#795548" },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    borderRadius: 16,
    padding: 4,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: "#6C63FF" },
  tabIcon: { fontSize: 16, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: "#999", fontWeight: "500" },
  tabLabelActive: { color: "#fff", fontWeight: "700" },
  content: { padding: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 14,
    color: "#777",
    marginBottom: 16,
    lineHeight: 20,
  },
  examples: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  exampleChip: {
    backgroundColor: "#F0EEFF",
    color: "#6C63FF",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#333",
    marginBottom: 12,
  },
  textarea: { height: 90, textAlignVertical: "top" },
  actionButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: { backgroundColor: "#C5C2F0" },
  actionButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

// ─── Styles des résultats ───
const resultStyles = StyleSheet.create({
  errorCard: {
    backgroundColor: "#FFEBEE",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C62828",
    marginBottom: 6,
  },
  errorMessage: { fontSize: 14, color: "#C62828", marginBottom: 12 },
  retryBtn: {
    backgroundColor: "#E53935",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  retryBtnText: { color: "#fff", fontWeight: "600" },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 14,
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, color: "#888", textAlign: "center" },
  resultCount: { fontSize: 13, color: "#999", marginBottom: 10 },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  resultMeta: { fontSize: 13, color: "#777", marginBottom: 8 },
  justificationBox: {
    backgroundColor: "#F8F8FF",
    borderRadius: 8,
    padding: 10,
  },
  justificationLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    marginBottom: 4,
  },
  justificationText: { fontSize: 14, color: "#555", lineHeight: 20 },
  profilCard: {
    backgroundColor: "#F0EEFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#6C63FF",
  },
  profilLabel: {
    fontSize: 12,
    color: "#6C63FF",
    fontWeight: "700",
    marginBottom: 4,
  },
  profilText: { fontSize: 15, color: "#333", fontStyle: "italic" },
  rankBadge: {
    backgroundColor: "#6C63FF",
    borderRadius: 20,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  rankBadgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  planDayBadge: {
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    minWidth: 72,
    marginRight: 12,
  },
  planDayText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  planHourText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  planContent: { flex: 1 },
  planTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  planReason: { fontSize: 13, color: "#777", lineHeight: 18 },
  conflictCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  conflictLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#795548",
    marginBottom: 6,
  },
  conflictItem: { fontSize: 13, color: "#795548", marginBottom: 2 },
  adviceCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  adviceLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 4,
  },
  adviceText: { fontSize: 14, color: "#2E7D32", lineHeight: 20 },
  qaCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  qaText: { fontSize: 15, color: "#333", lineHeight: 24 },
  mentionedCard: {
    backgroundColor: "#F0EEFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  mentionedLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6C63FF",
    marginBottom: 8,
  },
  mentionedItem: { fontSize: 14, color: "#555", marginBottom: 4 },
  // ─── Weekly styles ───
  weeklyHeader: {
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  weeklyIntro: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  highlightEmoji: { fontSize: 20, marginRight: 12 },
  highlightText: { flex: 1, fontSize: 14, color: "#444", lineHeight: 20 },
  starCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#F7971E",
  },
  starLabel: {
    fontSize: 12,
    color: "#F7971E",
    fontWeight: "700",
    marginBottom: 6,
  },
  starTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  starReason: { fontSize: 14, color: "#666", lineHeight: 20 },
});
