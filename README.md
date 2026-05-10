# CampusEvents AI 🎓

Application mobile multiplateforme développée avec **Expo / React Native** qui centralise les événements du campus universitaire et aide chaque étudiant à trouver les événements qui lui correspondent, grâce à un assistant IA propulsé par **Groq (LLaMA 3.3)**.


## Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Installation](#installation)
- [Configuration](#configuration)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Utilisation](#utilisation)
- [Fonctionnalités IA](#fonctionnalités-ia)
- [Fonctionnalités bonus](#fonctionnalités-bonus)
- [Structure des fichiers](#structure-des-fichiers)
- [Base de données](#base-de-données)
- [Limitations connues](#limitations-connues)

---

## Aperçu

CampusEvents AI répond à un problème concret : les événements universitaires sont dispersés sur de multiples canaux (affiches, WhatsApp, groupes Facebook), ce qui entraîne une faible visibilité et une faible participation.

L'application propose :
- Un **catalogue centralisé** géré par l'administration
- Un **assistant IA** capable de raisonner sur l'ensemble du catalogue
- Une expérience personnalisée pour chaque étudiant

### Rôles

| Rôle | Accès |
|------|-------|
| **Admin** | Créer, modifier, supprimer les événements — exporter le catalogue |
| **Étudiant** | Consulter, s'inscrire, gérer ses favoris, interagir avec l'IA |

---

## Fonctionnalités

### Interface Admin



- **Tableau de bord** avec statistiques (total / à venir / passés)
- **CRUD complet** : créer, modifier, supprimer des événements
- **Formulaire** avec validation (champs obligatoires, format de date, capacité)
- **Export JSON** du catalogue complet via le partage natif

### Interface Étudiant



- **Catalogue** trié par date avec états loading / erreur / vide
- **Recherche exacte** sur le titre (insensible à la casse)
- **Filtres** par catégorie (Talk, Workshop, Club, Exam, Other) et par période (à venir / passés / tous)
- **Détail événement** avec barre de capacité, description, tags



- **Favoris** : ajout / retrait, persistants en base
- **Inscriptions** : s'inscrire / annuler avec compteur de places
- **Partage natif** d'un événement via WhatsApp, SMS, email...



## Fonctionnalités IA

L'assistant IA est accessible depuis l'onglet **Assistant** et propose 5 modes :



### 1. Recherche en langage naturel
L'étudiant décrit ce qu'il cherche sans connaître les mots-clés exacts.
> Exemple : *"quelque chose sur l'IA ce weekend"* → trouve un workshop Machine Learning



### 2. Recommandations personnalisées
Basées sur les favoris et inscriptions, l'IA suggère 3 événements avec justification.



### 3. Planification de semaine
L'étudiant décrit ses contraintes horaires, l'IA génère un planning sans conflit.
> Exemple : *"cours lundi matin, exam mercredi"*



### 4. Questions sur le catalogue
Questions ouvertes sur l'ensemble des événements.
> Exemple : *"Quels clubs sont actifs ce mois-ci ?"*



### 5. Résumé hebdomadaire
Digest automatique des événements de la semaine avec l'événement star.



---

## Fonctionnalités bonus

- **Profil étudiant enrichi** : filière, année, centres d'intérêt → améliore la pertinence des recommandations IA



- **Export JSON admin** : exporter le catalogue complet en un clic
- **Rappels locaux** : notification push 24h et 1h avant un événement inscrit *(nécessite un development build — voir Limitations)*
- **Partage natif** : partager une fiche événement via le système natif Android/iOS

---

## Stack technique

| Catégorie | Technologie |
|-----------|------------|
| Framework mobile | Expo SDK 53 / React Native |
| Navigation | Expo Router (file-based) |
| Base de données | expo-sqlite (SQLite local) |
| LLM | Groq API — modèle `llama-3.3-70b-versatile` |
| Icônes | lucide-react-native |
| Session | @react-native-async-storage/async-storage |
| Partage | React Native Share (natif) |
| Notifications | expo-notifications *(development build requis)* |
| Langage | TypeScript |

---

## Architecture du projet

```
CampusEventsAI/
├── app/                          ← Pages (expo-router)
│   ├── welcome.tsx               ← Écran d'accueil animé
│   ├── index.tsx                 ← Redirection
│   ├── _layout.tsx               ← Layout racine + AuthProvider
│   ├── (auth)/
│   │   └── login.tsx             ← Connexion avec comptes démo
│   ├── (admin)/
│   │   ├── _layout.tsx           ← Stack navigation admin
│   │   ├── index.tsx             ← Tableau de bord + liste
│   │   ├── create.tsx            ← Formulaire création
│   │   └── edit/[id].tsx         ← Formulaire modification
│   └── (student)/
│       ├── _layout.tsx           ← Tabs navigation étudiant
│       ├── events/
│       │   ├── index.tsx         ← Catalogue avec filtres
│       │   └── [id].tsx          ← Détail + inscription + rappel
│       ├── favorites.tsx         ← Mes favoris
│       ├── registrations.tsx     ← Mes inscriptions
│       ├── assistant.tsx         ← Assistant IA (5 onglets)
│       └── profile.tsx           ← Profil étudiant
│
├── database/                     ← Couche d'accès SQLite
│   ├── init.ts                   ← Création des tables
│   ├── events.ts                 ← CRUD événements
│   ├── registrations.ts          ← CRUD inscriptions
│   ├── favorites.ts              ← CRUD favoris
│   ├── llmResults.ts             ← Cache des résultats IA
│   ├── notifications.ts          ← IDs des notifications programmées
│   └── profile.ts                ← Profil étudiant
│
├── services/
│   ├── llm.ts                    ← Appels Groq API (5 prompts)
│   └── notifications.ts          ← Rappels push locaux
│
├── context/
│   └── AuthContext.tsx           ← Session utilisateur (rôle)
│
├── types/
│   └── index.ts                  ← Types TypeScript partagés
│
├── .env                          ← Clé API Groq (non commitée)
├── .gitignore
└── app.json
```

---

## Installation

### Prérequis

- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm ou yarn
- Application **Expo Go** sur votre téléphone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/Lorraine301/CampusEventsAI.git
cd CampusEventsAI

# 2. Installer les dépendances
npm install

# 3. Configurer la clé API (voir section Configuration)
cp .env.example .env

# 4. Lancer le projet
npx expo start
```

Scannez le QR code affiché avec **Expo Go** (Android) ou l'application Appareil photo (iOS).

---

## Configuration

### Clé API Groq

1. Créez un compte gratuit sur [console.groq.com](https://console.groq.com)
2. Générez une clé API dans `API Keys` → `Create API Key`
3. Créez un fichier `.env` à la racine du projet :

```env
EXPO_PUBLIC_GROQ_API_KEY=votre_clé_groq_ici
```

> **Important :** Le fichier `.env` est dans `.gitignore` — ne commitez jamais votre clé API.

---

## Comptes de démonstration

L'application propose deux comptes préconfigurés, sans inscription :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@campus.ma` | `admin123` |
| Étudiant | `etudiant@campus.ma` | `etudiant123` |

> **Note :** Les deux comptes partagent la même base de données SQLite locale. C'est une contrainte inhérente à une architecture 100 % locale, acceptable dans le cadre d'une démonstration.

---

## Utilisation

### Démarrage rapide Admin

1. Connectez-vous avec `admin@campus.ma`
2. Appuyez sur **+ Créer un événement**
3. Remplissez le formulaire (titre, catégorie, date, lieu, organisateur)
4. Sauvegardez → l'événement apparaît dans la liste

### Démarrage rapide Étudiant

1. Connectez-vous avec `etudiant@campus.ma`
2. Parcourez le catalogue dans l'onglet **Événements**
3. Appuyez sur ★ pour ajouter un favori
4. Ouvrez un événement → appuyez sur **S'inscrire**
5. Allez dans l'onglet **Assistant** pour tester l'IA

---

## Base de données

Toutes les données sont stockées localement avec `expo-sqlite`. La base est initialisée automatiquement au premier lancement.

### Tables

| Table | Description |
|-------|-------------|
| `events` | Catalogue des événements |
| `registrations` | Inscriptions des étudiants |
| `favorites` | Favoris par utilisateur |
| `llm_results` | Cache des résultats IA |
| `profiles` | Profils étudiants enrichis |
| `notification_ids` | IDs des rappels programmés |

Les suppressions d'événements propagent en cascade sur `registrations` et `favorites` (`ON DELETE CASCADE`).

---

## Limitations connues

### Notifications push (Expo Go)

Depuis le SDK 53, `expo-notifications` n'est plus entièrement supporté dans **Expo Go** pour Android. Un avertissement non bloquant apparaît dans la console, mais l'application fonctionne normalement.

Le code de rappels est entièrement implémenté (`services/notifications.ts`, `database/notifications.ts`). Pour tester les notifications, générez un build de développement natif :

```bash
npx expo run:android
```

### Données locales uniquement

Il n'y a pas de backend distant. Toutes les données sont stockées sur l'appareil. Dans un contexte de production, il faudrait ajouter un serveur et une base de données partagée.

### Clé API exposée côté client

La clé Groq est stockée dans les variables d'environnement Expo (`EXPO_PUBLIC_`), ce qui la rend accessible dans le bundle. En production, les appels LLM devraient passer par un serveur intermédiaire.

---

## Auteur

Projet réalisé dans le cadre du cours de développement mobile — **Université Abdelmalek Essaâdi**, Département Informatique.
