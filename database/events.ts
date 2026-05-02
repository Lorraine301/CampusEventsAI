import { Event } from "../types";
import { db } from "./init";

export const eventsDb = {
  getAll(): Event[] {
    const rows = db.getAllSync<any>(
      "SELECT * FROM events ORDER BY startDateTime ASC",
    );
    return rows.map(parseEvent);
  },

  getById(id: string): Event | null {
    const row = db.getFirstSync<any>("SELECT * FROM events WHERE id = ?", [id]);
    return row ? parseEvent(row) : null;
  },

  getUpcoming(): Event[] {
    const now = new Date().toISOString();
    const rows = db.getAllSync<any>(
      "SELECT * FROM events WHERE startDateTime >= ? ORDER BY startDateTime ASC",
      [now],
    );
    return rows.map(parseEvent);
  },

  getPast(): Event[] {
    const now = new Date().toISOString();
    const rows = db.getAllSync<any>(
      "SELECT * FROM events WHERE startDateTime < ? ORDER BY startDateTime DESC",
      [now],
    );
    return rows.map(parseEvent);
  },

  getByCategory(category: string): Event[] {
    const rows = db.getAllSync<any>(
      "SELECT * FROM events WHERE category = ? ORDER BY startDateTime ASC",
      [category],
    );
    return rows.map(parseEvent);
  },

  search(query: string): Event[] {
    const rows = db.getAllSync<any>(
      "SELECT * FROM events WHERE LOWER(title) LIKE ? ORDER BY startDateTime ASC",
      [`%${query.toLowerCase()}%`],
    );
    return rows.map(parseEvent);
  },

  create(event: Event): void {
    db.runSync(
      `INSERT INTO events (
        id, title, description, category, startDateTime, endDateTime,
        locationName, locationAddress, organizerName, capacity,
        registeredCount, imageUrl, tags, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.title,
        event.description,
        event.category,
        event.startDateTime,
        event.endDateTime ?? null,
        event.locationName,
        event.locationAddress ?? null,
        event.organizerName,
        event.capacity ?? null,
        event.registeredCount,
        event.imageUrl ?? null,
        event.tags ? JSON.stringify(event.tags) : null,
        event.createdAt,
      ],
    );
  },

  update(event: Event): void {
    db.runSync(
      `UPDATE events SET
        title = ?, description = ?, category = ?, startDateTime = ?,
        endDateTime = ?, locationName = ?, locationAddress = ?,
        organizerName = ?, capacity = ?, imageUrl = ?, tags = ?
       WHERE id = ?`,
      [
        event.title,
        event.description,
        event.category,
        event.startDateTime,
        event.endDateTime ?? null,
        event.locationName,
        event.locationAddress ?? null,
        event.organizerName,
        event.capacity ?? null,
        event.imageUrl ?? null,
        event.tags ? JSON.stringify(event.tags) : null,
        event.id,
      ],
    );
  },

  delete(id: string): void {
    db.runSync("DELETE FROM events WHERE id = ?", [id]);
  },

  incrementRegistered(id: string): void {
    db.runSync(
      "UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?",
      [id],
    );
  },

  decrementRegistered(id: string): void {
    db.runSync(
      "UPDATE events SET registeredCount = MAX(0, registeredCount - 1) WHERE id = ?",
      [id],
    );
  },
};

function parseEvent(row: any): Event {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    capacity: row.capacity ?? undefined,
    endDateTime: row.endDateTime ?? undefined,
    locationAddress: row.locationAddress ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
  };
}
