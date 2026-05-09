import { Event } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!key) throw new Error("Clé API Groq manquante. Vérifie ton fichier .env");
  return key;
}

async function callGroq(
  systemPrompt: string,
  userContent: string,
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401)
      throw new Error("Clé API invalide ou expirée.");
    if (response.status === 429)
      throw new Error("Quota dépassé. Réessaie dans quelques secondes.");
    throw new Error(
      err?.error?.message ?? `Erreur serveur (${response.status})`,
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Sérialise les événements en JSON compact pour le contexte LLM
function serializeEvents(events: Event[]): string {
  const compact = events.slice(0, 30).map((e) => ({
    id: e.id,
    titre: e.title,
    categorie: e.category,
    debut: e.startDateTime,
    fin: e.endDateTime,
    lieu: e.locationName,
    organisateur: e.organizerName,
    capacite: e.capacity,
    inscrits: e.registeredCount,
    tags: e.tags,
    description: e.description?.slice(0, 200),
  }));
  return JSON.stringify(compact);
}

// ─────────────────────────────────────────────
// PROMPT 1 — Recherche en langage naturel
// ─────────────────────────────────────────────

export async function searchEventsNL(
  query: string,
  events: Event[],
): Promise<string> {
  const systemPrompt = `Tu es un assistant universitaire spécialisé dans la recherche d'événements campus.
Tu reçois un catalogue d'événements au format JSON et une requête en langage naturel.
Ta mission : identifier les événements pertinents, même si les mots-clés ne correspondent pas exactement.
Utilise le sens sémantique (ex: "IA" peut correspondre à "Machine Learning", "TensorFlow", "data science").

FORMAT DE RÉPONSE OBLIGATOIRE (JSON uniquement, sans texte avant ni après) :
{
  "results": [
    {
      "id": "uuid de l'événement",
      "titre": "titre exact",
      "justification": "courte phrase expliquant pourquoi cet événement correspond"
    }
  ],
  "message": "message si aucun résultat ou remarque générale"
}

Retourne maximum 5 résultats. Si aucun événement ne correspond, retourne results vide avec un message utile.
Ne retourne JAMAIS du texte en dehors du JSON.`;

  const userContent = `Catalogue des événements :
${serializeEvents(events)}

Requête de l'étudiant : "${query}"`;

  return callGroq(systemPrompt, userContent);
}

// ─────────────────────────────────────────────
// PROMPT 2 — Recommandation personnalisée
// ─────────────────────────────────────────────
export async function getRecommendations(
  upcomingEvents: Event[],
  favoriteEvents: Event[],
  registeredEvents: Event[],
): Promise<string> {
  const systemPrompt = `Tu es un assistant de recommandation d'événements universitaires.
Tu analyses les préférences d'un étudiant (favoris et inscriptions passées) pour suggérer de nouveaux événements.
Identifie les patterns : catégories préférées, thèmes récurrents dans les tags, types d'activités.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON uniquement, sans texte avant ni après) :
{
  "recommendations": [
    {
      "id": "uuid de l'événement",
      "titre": "titre exact",
      "justification": "explication personnalisée basée sur les préférences détectées"
    }
  ],
  "profil_detecte": "résumé en une phrase des centres d'intérêt détectés",
  "message": "message si pas assez d'historique"
}

Retourne exactement 3 recommandations parmi les événements à venir non déjà favoris/inscrits.
Ne retourne JAMAIS du texte en dehors du JSON.`;

  const userContent = `Événements à venir :
${serializeEvents(upcomingEvents)}

Favoris de l'étudiant :
${JSON.stringify(favoriteEvents.map((e) => ({ titre: e.title, categorie: e.category, tags: e.tags })))}

Inscriptions de l'étudiant :
${JSON.stringify(registeredEvents.map((e) => ({ titre: e.title, categorie: e.category, tags: e.tags })))}`;

  return callGroq(systemPrompt, userContent);
}

// ─────────────────────────────────────────────
// PROMPT 3 — Planification hebdomadaire
// ─────────────────────────────────────────────
export async function planWeek(
  constraints: string,
  weekEvents: Event[],
): Promise<string> {
  const systemPrompt = `Tu es un assistant de planification pour étudiant universitaire.
Tu reçois les contraintes horaires de l'étudiant et les événements de la semaine.
Ta mission : proposer un planning de participation sans conflit d'horaire.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON uniquement, sans texte avant ni après) :
{
  "planning": [
    {
      "jour": "Lundi 10 juin",
      "heure": "14:00",
      "evenement_id": "uuid",
      "evenement_titre": "titre exact",
      "raison": "pourquoi cet événement est recommandé ce jour"
    }
  ],
  "conflits_evites": ["liste des événements exclus à cause de conflits"],
  "conseils": "conseil général sur la semaine",
  "message": "message si planning vide"
}

Ne propose que des événements qui ne chevauchent pas les contraintes de l'étudiant.
Ne retourne JAMAIS du texte en dehors du JSON.`;

  const userContent = `Contraintes de l'étudiant : "${constraints}"

Événements disponibles cette semaine :
${serializeEvents(weekEvents)}

Date actuelle : ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`;

  return callGroq(systemPrompt, userContent);
}

// ─────────────────────────────────────────────
// PROMPT 4 — Questions sur le catalogue global
// ─────────────────────────────────────────────
export async function askCatalog(
  question: string,
  events: Event[],
): Promise<string> {
  const systemPrompt = `Tu es un assistant campus expert du catalogue des événements universitaires.
Tu réponds à des questions ouvertes sur l'ensemble du catalogue.
Tu es précis, utile, et tu cites les événements concernés par leur titre.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON uniquement, sans texte avant ni après) :
{
  "reponse": "réponse claire et structurée à la question",
  "evenements_mentionnes": ["titre1", "titre2"],
  "suggestion": "suggestion complémentaire optionnelle"
}

Réponds toujours en français. Si le catalogue ne permet pas de répondre, dis-le clairement.
Ne retourne JAMAIS du texte en dehors du JSON.`;

  const userContent = `Catalogue complet :
${serializeEvents(events)}

Question : "${question}"`;

  return callGroq(systemPrompt, userContent);
}

export async function getWeeklySummary(events: Event[]): Promise<string> {
  const systemPrompt = `Tu es un rédacteur de newsletter universitaire.
Tu génères un résumé hebdomadaire dynamique et engageant des événements à venir sur le campus.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON uniquement) :
{
  "titre": "titre accrocheur pour la semaine",
  "intro": "phrase d'accroche sur la semaine",
  "highlights": [
    { "emoji": "emoji", "texte": "point fort en une phrase" }
  ],
  "evenement_star": { "titre": "titre", "raison": "pourquoi ne pas manquer cet événement" },
  "conclusion": "phrase de conclusion motivante"
}

Sois enthousiaste, positif et concis. Ne retourne JAMAIS du texte en dehors du JSON.`;

  const userContent = `Événements de la semaine :
${serializeEvents(events)}
Semaine du : ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`;

  return callGroq(systemPrompt, userContent);
}
