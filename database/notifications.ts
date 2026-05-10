import { db } from "./init";

export const notificationsDb = {
  save(eventId: string, userId: string, notifIds: string[]): void {
    for (const notifId of notifIds) {
      db.runSync(
        `INSERT OR IGNORE INTO notification_ids (eventId, userId, notifId)
         VALUES (?, ?, ?)`,
        [eventId, userId, notifId],
      );
    }
  },

  getByEvent(eventId: string, userId: string): string[] {
    const rows = db.getAllSync<{ notifId: string }>(
      "SELECT notifId FROM notification_ids WHERE eventId = ? AND userId = ?",
      [eventId, userId],
    );
    return rows.map((r) => r.notifId);
  },

  delete(eventId: string, userId: string): void {
    db.runSync(
      "DELETE FROM notification_ids WHERE eventId = ? AND userId = ?",
      [eventId, userId],
    );
  },
};
