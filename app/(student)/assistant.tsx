import { useFocusEffect } from "expo-router";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  MapPin,
  MessageCircle,
  Newspaper,
  RefreshCw,
  Search,
  Target,
} from "lucide-react-native";
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
import { registrationsDb } from "../../database/registrations";
import {
  askCatalog,
  getRecommendations,
  getWeeklySummary,
  planWeek,
  searchEventsNL,
} from "../../services/llm";
import { Event, LLMResultType } from "../../types";

const uuidv4 = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

type TabId = "search" | "recommendation" | "planning" | "qa" | "weekly";

interface Tab {
  id: TabId;
  label: string;
  Icon: any;
  color: string;
  bg: string;
}

const TABS: Tab[] = [
  {
    id: "search",
    label: "Recherche",
    Icon: Search,
    color: "#534AB7",
    bg: "#EEEDFE",
  },
  {
    id: "recommendation",
    label: "Pour moi",
    Icon: Target,
    color: "#0F6E56",
    bg: "#E1F5EE",
  },
  {
    id: "planning",
    label: "Planning",
    Icon: CalendarDays,
    color: "#993C1D",
    bg: "#FAECE7",
  },
  {
    id: "qa",
    label: "Questions",
    Icon: MessageCircle,
    color: "#5F5E5A",
    bg: "#F1EFE8",
  },
  {
    id: "weekly",
    label: "Semaine",
    Icon: Newspaper,
    color: "#185FA5",
    bg: "#E6F1FB",
  },
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
      const cached = llmResultsDb.getCached(
        user!.email,
        "recommendation",
        "recommendations",
      );
      let raw = cached?.outputText;
      if (!raw) {
        const upcoming = eventsDb.getUpcoming();
        const favEvents = favoritesDb
          .getFavoriteEventIds(user!.email)
          .map((id) => eventsDb.getById(id))
          .filter(Boolean) as Event[];
        const regEvents = registrationsDb
          .getRegisteredEventIds(user!.email)
          .map((id) => eventsDb.getById(id))
          .filter(Boolean) as Event[];
        raw = await getRecommendations(upcoming, favEvents, regEvents);
        saveCache("recommendation", "recommendations", raw);
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

  const EXAMPLES: Record<TabId, string[]> = {
    search: [
      '"quelque chose sur l\'IA ce weekend"',
      '"atelier pratique pas trop tôt"',
      '"préparer ma recherche de stage"',
    ],
    planning: [
      '"cours lundi et mercredi matin, exam jeudi"',
      '"libre tous les après-midis"',
    ],
    qa: [
      '"Quels clubs sont actifs ce mois-ci ?"',
      '"Événements utiles pour data science ?"',
      '"Quelles places sont encore disponibles ?"',
    ],
    recommendation: [],
    weekly: [],
  };

  const DESCS: Record<TabId, string> = {
    search:
      "Décris ce que tu cherches en langage naturel, même sans connaître les mots-clés exacts.",
    recommendation:
      "Basées sur tes favoris et inscriptions, je te suggère 3 événements qui pourraient t'intéresser.",
    planning:
      "Décris tes contraintes et je te propose un planning sans conflit.",
    qa: "Pose des questions sur des événements du campus.",
    weekly:
      "Un résumé intelligent des événements à ne pas manquer cette semaine.",
  };

  const activeTabCfg = TABS.find((t) => t.id === activeTab)!;
  const isDisabled =
    isLoading ||
    (activeTab === "search" && !searchQuery.trim()) ||
    (activeTab === "planning" && !planConstraints.trim()) ||
    (activeTab === "qa" && !qaQuestion.trim());

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Mon Assistant IA</Text>
            <Text style={styles.headerSubtitle}>
              Recherche intelligente et recommandations
            </Text>
          </View>
          <View
            style={[
              styles.headerIconWrap,
              { backgroundColor: activeTabCfg.bg },
            ]}
          >
            <activeTabCfg.Icon size={20} color={activeTabCfg.color} />
          </View>
        </View>

        {/* Warning */}
        <View style={styles.warningBar}>
          <AlertTriangle size={13} color="#BA7517" style={{ marginRight: 6 }} />
          <Text style={styles.warningText}>
            Ne soumettez pas de données personnelles ou sensibles.
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TABS.map(({ id, label, Icon, color, bg }) => {
            const isActive = activeTab === id;
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setActiveTab(id)}
                disabled={isLoading}
              >
                <Icon
                  size={14}
                  color={isActive ? "#fff" : color}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Section header */}
        <View
          style={[
            styles.sectionHeader,
            {
              backgroundColor: activeTabCfg.bg,
              borderColor: activeTabCfg.color + "30",
            },
          ]}
        >
          <activeTabCfg.Icon
            size={16}
            color={activeTabCfg.color}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.sectionTitle, { color: activeTabCfg.color }]}>
            {activeTabCfg.label}
          </Text>
        </View>
        <Text style={styles.sectionDesc}>{DESCS[activeTab]}</Text>

        {/* Example chips */}
        {EXAMPLES[activeTab].length > 0 && (
          <View style={styles.examples}>
            {EXAMPLES[activeTab].map((ex) => (
              <TouchableOpacity
                key={ex}
                style={[
                  styles.exampleChip,
                  {
                    backgroundColor: activeTabCfg.bg,
                    borderColor: activeTabCfg.color + "30",
                  },
                ]}
                onPress={() => {
                  const val = ex.replace(/"/g, "");
                  if (activeTab === "search") setSearchQuery(val);
                  if (activeTab === "planning") setPlanConstraints(val);
                  if (activeTab === "qa") setQaQuestion(val);
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.exampleChipText,
                    { color: activeTabCfg.color },
                  ]}
                >
                  {ex}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Inputs */}
        {activeTab === "search" && (
          <TextInput
            style={[styles.input, { borderColor: activeTabCfg.color + "40" }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Ex: un événement utile pour ma carrière en data..."
            placeholderTextColor="#BEC3CF"
            multiline
          />
        )}
        {activeTab === "planning" && (
          <TextInput
            style={[
              styles.input,
              styles.textarea,
              { borderColor: activeTabCfg.color + "40" },
            ]}
            value={planConstraints}
            onChangeText={setPlanConstraints}
            placeholder="Ex: J'ai cours lundi matin, exam mercredi après-midi..."
            placeholderTextColor="#BEC3CF"
            multiline
            numberOfLines={3}
          />
        )}
        {activeTab === "qa" && (
          <TextInput
            style={[styles.input, { borderColor: activeTabCfg.color + "40" }]}
            value={qaQuestion}
            onChangeText={setQaQuestion}
            placeholder="Pose ta question..."
            placeholderTextColor="#BEC3CF"
            multiline
          />
        )}

        {/* Action button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: activeTabCfg.color },
            isDisabled && styles.buttonDisabled,
          ]}
          onPress={
            activeTab === "search"
              ? handleSearch
              : activeTab === "recommendation"
                ? handleRecommendations
                : activeTab === "planning"
                  ? handlePlanning
                  : activeTab === "qa"
                    ? handleQA
                    : handleWeeklySummary
          }
          disabled={isDisabled}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>
              {activeTab === "search"
                ? "Rechercher"
                : activeTab === "recommendation"
                  ? "Générer mes recommandations"
                  : activeTab === "planning"
                    ? "Planifier ma semaine"
                    : activeTab === "qa"
                      ? "Poser la question"
                      : "Générer le résumé"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Errors */}
        {activeTab === "search" && searchError && (
          <ErrorCard message={searchError} onRetry={handleSearch} />
        )}
        {activeTab === "recommendation" && recoError && (
          <ErrorCard message={recoError} onRetry={handleRecommendations} />
        )}
        {activeTab === "planning" && planError && (
          <ErrorCard message={planError} onRetry={handlePlanning} />
        )}
        {activeTab === "qa" && qaError && (
          <ErrorCard message={qaError} onRetry={handleQA} />
        )}
        {activeTab === "weekly" && weeklyError && (
          <ErrorCard message={weeklyError} onRetry={handleWeeklySummary} />
        )}

        {/* Results */}
        {activeTab === "search" && searchResult && (
          <SearchResults
            data={searchResult}
            events={allEvents}
            accentColor={activeTabCfg.color}
            accentBg={activeTabCfg.bg}
          />
        )}
        {activeTab === "recommendation" && recoResult && (
          <RecoResults
            data={recoResult}
            accentColor={activeTabCfg.color}
            accentBg={activeTabCfg.bg}
          />
        )}
        {activeTab === "planning" && planResult && (
          <PlanResults
            data={planResult}
            accentColor={activeTabCfg.color}
            accentBg={activeTabCfg.bg}
          />
        )}
        {activeTab === "qa" && qaResult && (
          <QAResult
            data={qaResult}
            accentColor={activeTabCfg.color}
            accentBg={activeTabCfg.bg}
          />
        )}
        {activeTab === "weekly" && weeklyResult && (
          <WeeklySummary
            data={weeklyResult}
            accentColor={activeTabCfg.color}
            accentBg={activeTabCfg.bg}
          />
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Result components ────────────────────────────────────────────────────────

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={resultStyles.errorCard}>
      <Text style={resultStyles.errorTitle}>Erreur</Text>
      <Text style={resultStyles.errorMessage}>{message}</Text>
      <TouchableOpacity style={resultStyles.retryBtn} onPress={onRetry}>
        <RefreshCw size={13} color="#fff" style={{ marginRight: 6 }} />
        <Text style={resultStyles.retryBtnText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

function SearchResults({
  data,
  events,
  accentColor,
  accentBg,
}: {
  data: any;
  events: Event[];
  accentColor: string;
  accentBg: string;
}) {
  if (!data.results?.length) {
    return (
      <View style={resultStyles.emptyCard}>
        <Search
          size={36}
          color="#AFA9EC"
          strokeWidth={1.5}
          style={{ marginBottom: 8 }}
        />
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
            <View
              style={[
                resultStyles.resultAccentBar,
                { backgroundColor: accentColor },
              ]}
            />
            <View style={resultStyles.resultCardBody}>
              <Text style={resultStyles.resultTitle}>{r.titre}</Text>
              {event && (
                <View style={resultStyles.metaRow}>
                  <Calendar
                    size={12}
                    color="#9CA3AF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={resultStyles.resultMeta}>
                    {new Date(event.startDateTime).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                  <MapPin
                    size={12}
                    color="#9CA3AF"
                    style={{ marginLeft: 10, marginRight: 4 }}
                  />
                  <Text style={resultStyles.resultMeta}>
                    {event.locationName}
                  </Text>
                </View>
              )}
              <View
                style={[
                  resultStyles.justificationBox,
                  { backgroundColor: accentBg },
                ]}
              >
                <Text
                  style={[
                    resultStyles.justificationLabel,
                    { color: accentColor },
                  ]}
                >
                  Pourquoi ce résultat :
                </Text>
                <Text style={resultStyles.justificationText}>
                  {r.justification}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RecoResults({
  data,
  accentColor,
  accentBg,
}: {
  data: any;
  accentColor: string;
  accentBg: string;
}) {
  if (data.message && !data.recommendations?.length) {
    return (
      <View style={resultStyles.emptyCard}>
        <Target
          size={36}
          color="#AFA9EC"
          strokeWidth={1.5}
          style={{ marginBottom: 8 }}
        />
        <Text style={resultStyles.emptyText}>{data.message}</Text>
      </View>
    );
  }
  return (
    <View>
      {data.profil_detecte && (
        <View
          style={[
            resultStyles.profilCard,
            { backgroundColor: accentBg, borderLeftColor: accentColor },
          ]}
        >
          <Text style={[resultStyles.profilLabel, { color: accentColor }]}>
            Ton profil détecté :
          </Text>
          <Text style={resultStyles.profilText}>{data.profil_detecte}</Text>
        </View>
      )}
      {data.recommendations?.map((r: any, i: number) => (
        <View key={r.id ?? i} style={resultStyles.resultCard}>
          <View
            style={[
              resultStyles.resultAccentBar,
              { backgroundColor: accentColor },
            ]}
          />
          <View style={resultStyles.resultCardBody}>
            <View
              style={[resultStyles.rankBadge, { backgroundColor: accentColor }]}
            >
              <Text style={resultStyles.rankBadgeText}>#{i + 1}</Text>
            </View>
            <Text style={resultStyles.resultTitle}>{r.titre}</Text>
            <View
              style={[
                resultStyles.justificationBox,
                { backgroundColor: accentBg },
              ]}
            >
              <Text
                style={[
                  resultStyles.justificationLabel,
                  { color: accentColor },
                ]}
              >
                Recommandé parce que :
              </Text>
              <Text style={resultStyles.justificationText}>
                {r.justification}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function PlanResults({
  data,
  accentColor,
  accentBg,
}: {
  data: any;
  accentColor: string;
  accentBg: string;
}) {
  if (!data.planning?.length) {
    return (
      <View style={resultStyles.emptyCard}>
        <CalendarDays
          size={36}
          color="#AFA9EC"
          strokeWidth={1.5}
          style={{ marginBottom: 8 }}
        />
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
          <View
            style={[
              resultStyles.planDayBadge,
              { backgroundColor: accentColor },
            ]}
          >
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
          <Text style={resultStyles.conflictLabel}>Conflits évités :</Text>
          {data.conflits_evites.map((c: string, i: number) => (
            <Text key={i} style={resultStyles.conflictItem}>
              • {c}
            </Text>
          ))}
        </View>
      )}
      {data.conseils && (
        <View style={resultStyles.adviceCard}>
          <Text style={resultStyles.adviceLabel}>Conseil :</Text>
          <Text style={resultStyles.adviceText}>{data.conseils}</Text>
        </View>
      )}
    </View>
  );
}

function QAResult({
  data,
  accentColor,
  accentBg,
}: {
  data: any;
  accentColor: string;
  accentBg: string;
}) {
  return (
    <View>
      <View style={resultStyles.qaCard}>
        <View
          style={[
            resultStyles.resultAccentBar,
            { backgroundColor: accentColor },
          ]}
        />
        <View style={resultStyles.resultCardBody}>
          <Text style={resultStyles.qaText}>{data.reponse}</Text>
        </View>
      </View>
      {data.evenements_mentionnes?.length > 0 && (
        <View
          style={[resultStyles.mentionedCard, { backgroundColor: accentBg }]}
        >
          <Text style={[resultStyles.mentionedLabel, { color: accentColor }]}>
            Événements mentionnés :
          </Text>
          {data.evenements_mentionnes.map((titre: string, i: number) => (
            <Text key={i} style={resultStyles.mentionedItem}>
              · {titre}
            </Text>
          ))}
        </View>
      )}
      {data.suggestion && (
        <View style={resultStyles.adviceCard}>
          <Text style={resultStyles.adviceLabel}>Suggestion :</Text>
          <Text style={resultStyles.adviceText}>{data.suggestion}</Text>
        </View>
      )}
    </View>
  );
}

function WeeklySummary({
  data,
  accentColor,
  accentBg,
}: {
  data: any;
  accentColor: string;
  accentBg: string;
}) {
  return (
    <View>
      <View
        style={[resultStyles.weeklyHeader, { backgroundColor: accentColor }]}
      >
        <Text style={resultStyles.weeklyTitle}>{data.titre}</Text>
        <Text style={resultStyles.weeklyIntro}>{data.intro}</Text>
      </View>
      {data.highlights?.map((h: any, i: number) => (
        <View key={i} style={resultStyles.highlightRow}>
          <View
            style={[
              resultStyles.highlightDot,
              { backgroundColor: accentColor },
            ]}
          />
          <Text style={resultStyles.highlightText}>{h.texte}</Text>
        </View>
      ))}
      {data.evenement_star && (
        <View style={resultStyles.starCard}>
          <Text style={resultStyles.starLabel}>Événement de la semaine</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F3FF" },

  // Header
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFF8",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  headerTitle: { fontSize: 22, fontWeight: "600", color: "#1F1D3A" },
  headerSubtitle: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },

  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  warningBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAEEDA",
    borderLeftWidth: 3,
    borderLeftColor: "#BA7517",
    borderRadius: 8,
    padding: 10,
  },

  warningText: { fontSize: 12, color: "#BA7517", flex: 1 },

  // Tabs
  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFF8",
    paddingVertical: 10,
  },

  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },

  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E6FF",
    backgroundColor: "#fff",
  },

  tabLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  tabLabelActive: { color: "#fff" },

  // Content
  content: { padding: 16 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  sectionDesc: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 14,
    lineHeight: 20,
  },

  examples: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },

  exampleChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },

  exampleChipText: {
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "500",
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1F1D3A",
    marginBottom: 12,
  },

  textarea: { height: 90, textAlignVertical: "top" },

  actionButton: {
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 16,
  },

  buttonDisabled: { opacity: 0.45 },

  actionButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

const resultStyles = StyleSheet.create({
  errorCard: {
    backgroundColor: "#FCEBEB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#A32D2D",
    marginBottom: 6,
  },
  errorMessage: { fontSize: 14, color: "#A32D2D", marginBottom: 12 },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E24B4A",
    borderRadius: 8,
    padding: 10,
    justifyContent: "center",
  },
  retryBtnText: { color: "#fff", fontWeight: "600" },

  emptyCard: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBF5",
  },
  emptyText: { fontSize: 15, color: "#9CA3AF", textAlign: "center" },

  resultCount: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 10,
    fontWeight: "600",
  },

  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBEBF5",
  },

  resultAccentBar: {
    height: 4,
    width: "100%",
  },

  resultCardBody: {
    padding: 14,
  },

  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F1D3A",
    marginBottom: 8,
  },

  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  resultMeta: { fontSize: 12, color: "#6B7280" },

  justificationBox: {
    borderRadius: 8,
    padding: 10,
  },
  justificationLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  justificationText: { fontSize: 13, color: "#374151", lineHeight: 20 },

  profilCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  profilLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  profilText: { fontSize: 14, color: "#1F1D3A", fontStyle: "italic" },

  rankBadge: {
    borderRadius: 20,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  rankBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  planCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#EBEBF5",
  },
  planDayBadge: {
    borderRadius: 10,
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
    fontWeight: "600",
    color: "#1F1D3A",
    marginBottom: 4,
  },
  planReason: { fontSize: 13, color: "#6B7280", lineHeight: 18 },

  conflictCard: {
    backgroundColor: "#FAEEDA",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#BA7517",
  },
  conflictLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#BA7517",
    marginBottom: 6,
  },
  conflictItem: { fontSize: 13, color: "#BA7517", marginBottom: 2 },

  adviceCard: {
    backgroundColor: "#EAF3DE",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#3B6D11",
  },
  adviceLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B6D11",
    marginBottom: 4,
  },
  adviceText: { fontSize: 14, color: "#3B6D11", lineHeight: 20 },

  qaCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBEBF5",
  },
  qaText: { fontSize: 15, color: "#374151", lineHeight: 24 },

  mentionedCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  mentionedLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  mentionedItem: { fontSize: 14, color: "#374151", marginBottom: 4 },

  weeklyHeader: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    borderWidth: 1,
    borderColor: "#EBEBF5",
  },
  highlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  highlightText: { flex: 1, fontSize: 14, color: "#374151", lineHeight: 20 },

  starCard: {
    backgroundColor: "#FAEEDA",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#BA7517",
  },
  starLabel: {
    fontSize: 12,
    color: "#BA7517",
    fontWeight: "700",
    marginBottom: 6,
  },
  starTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F1D3A",
    marginBottom: 4,
  },
  starReason: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
});
