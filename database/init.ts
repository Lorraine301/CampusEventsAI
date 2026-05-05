import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("campusevents.db");

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      startDateTime TEXT NOT NULL,
      endDateTime TEXT,
      locationName TEXT NOT NULL,
      locationAddress TEXT,
      organizerName TEXT NOT NULL,
      capacity INTEGER,
      registeredCount INTEGER DEFAULT 0,
      imageUrl TEXT,
      tags TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (eventId, userId),
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS llm_results (
      id TEXT PRIMARY KEY,
      eventId TEXT,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      inputText TEXT NOT NULL,
      outputText TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      userId TEXT PRIMARY KEY,
      displayName TEXT NOT NULL,
      filiere TEXT NOT NULL,
      annee TEXT NOT NULL,
      interests TEXT NOT NULL DEFAULT '[]',
      updatedAt TEXT NOT NULL
    );
  `);
}

export { db };

