import { StudentProfile } from "../types";
import { db } from "./init";

export const profileDb = {
  init() {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS profiles (
        userId TEXT PRIMARY KEY,
        displayName TEXT NOT NULL,
        filiere TEXT NOT NULL,
        annee TEXT NOT NULL,
        interests TEXT NOT NULL DEFAULT '[]',
        updatedAt TEXT NOT NULL
      );
    `);
  },

  get(userId: string): StudentProfile | null {
    const row = db.getFirstSync<any>(
      "SELECT * FROM profiles WHERE userId = ?",
      [userId],
    );
    if (!row) return null;
    return { ...row, interests: JSON.parse(row.interests) };
  },

  upsert(profile: StudentProfile): void {
    db.runSync(
      `INSERT INTO profiles (userId, displayName, filiere, annee, interests, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(userId) DO UPDATE SET
         displayName = excluded.displayName,
         filiere = excluded.filiere,
         annee = excluded.annee,
         interests = excluded.interests,
         updatedAt = excluded.updatedAt`,
      [
        profile.userId,
        profile.displayName,
        profile.filiere,
        profile.annee,
        JSON.stringify(profile.interests),
        profile.updatedAt,
      ],
    );
  },
};
