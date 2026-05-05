export type UserRole = "admin" | "student";

export interface User {
  email: string;
  role: UserRole;
}

export type EventCategory = "Talk" | "Workshop" | "Club" | "Exam" | "Other";

export type LLMResultType =
  | "search"
  | "recommendation"
  | "planning"
  | "qa"
  | "weekly";

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
  type: LLMResultType;
  inputText: string;
  outputText: string;
  createdAt: string;
}

export interface StudentProfile {
  userId: string;
  displayName: string;
  filiere: string;
  annee: "1" | "2" | "3" | "4" | "5";
  interests: string[];
  updatedAt: string;
}
