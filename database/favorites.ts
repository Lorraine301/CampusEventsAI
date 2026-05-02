import { Favorite } from "../types";
import { db } from "./init";

export const favoritesDb = {
  getByUser(userId: string): Favorite[] {
    return db.getAllSync<Favorite>(
      "SELECT * FROM favorites WHERE userId = ? ORDER BY createdAt DESC",
      [userId],
    );
  },

  isFavorite(eventId: string, userId: string): boolean {
    const row = db.getFirstSync<any>(
      "SELECT eventId FROM favorites WHERE eventId = ? AND userId = ?",
      [eventId, userId],
    );
    return !!row;
  },

  add(favorite: Favorite): void {
    db.runSync(
      "INSERT OR IGNORE INTO favorites (eventId, userId, createdAt) VALUES (?, ?, ?)",
      [favorite.eventId, favorite.userId, favorite.createdAt],
    );
  },

  remove(eventId: string, userId: string): void {
    db.runSync("DELETE FROM favorites WHERE eventId = ? AND userId = ?", [
      eventId,
      userId,
    ]);
  },

  getFavoriteEventIds(userId: string): string[] {
    const rows = db.getAllSync<{ eventId: string }>(
      "SELECT eventId FROM favorites WHERE userId = ?",
      [userId],
    );
    return rows.map((r) => r.eventId);
  },
};
