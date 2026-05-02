import { Registration } from "../types";
import { db } from "./init";

export const registrationsDb = {
  getByUser(userId: string): Registration[] {
    return db.getAllSync<Registration>(
      "SELECT * FROM registrations WHERE userId = ? AND status = ? ORDER BY createdAt DESC",
      [userId, "confirmed"],
    );
  },

  isRegistered(eventId: string, userId: string): boolean {
    const row = db.getFirstSync<any>(
      "SELECT id FROM registrations WHERE eventId = ? AND userId = ? AND status = ?",
      [eventId, userId, "confirmed"],
    );
    return !!row;
  },

  register(registration: Registration): void {
    db.runSync(
      "INSERT INTO registrations (id, eventId, userId, createdAt, status) VALUES (?, ?, ?, ?, ?)",
      [
        registration.id,
        registration.eventId,
        registration.userId,
        registration.createdAt,
        registration.status,
      ],
    );
  },

  cancel(eventId: string, userId: string): void {
    db.runSync(
      "UPDATE registrations SET status = ? WHERE eventId = ? AND userId = ?",
      ["cancelled", eventId, userId],
    );
  },

  getRegisteredEventIds(userId: string): string[] {
    const rows = db.getAllSync<{ eventId: string }>(
      "SELECT eventId FROM registrations WHERE userId = ? AND status = ?",
      [userId, "confirmed"],
    );
    return rows.map((r) => r.eventId);
  },
};
