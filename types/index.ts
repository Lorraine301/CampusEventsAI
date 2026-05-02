export type UserRole = "admin" | "student";

export interface User {
  email: string;
  role: UserRole;
}

export type EventCategory = "Talk" | "Workshop" | "Club" | "Exam" | "Other";

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startDateTime: string;
  endDateTime?: string;
  locationName: string;
  locationAddress?: string;
  organizerName: string;
  capacity?: number;
  registeredCount: number;
  imageUrl?: string;
  tags?: string[];
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
  status: "confirmed" | "cancelled";
}

export interface Favorite {
  eventId: string;
  userId: string;
  createdAt: string;
}

export interface LLMResult {
  id: string;
  eventId?: string;
  userId: string;
  type: "search" | "recommendation" | "planning" | "qa";
  inputText: string;
  outputText: string;
  createdAt: string;
}
