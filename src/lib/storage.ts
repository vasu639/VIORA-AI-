import { SessionReport } from "../types";
import { auth, saveSessionToFirestore } from "./firebase";

const STORAGE_KEY = "viora_ai_sessions_v1";

export function getSavedSessions(): SessionReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load sessions from local storage:", e);
    return [];
  }
}

export function saveSessionToStorage(session: SessionReport): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSavedSessions();
    // Filter out if already exists
    const updated = [session, ...existing.filter((s) => s.id !== session.id)].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // If user is signed in to Firebase, sync session to their Firestore account
    const user = auth.currentUser;
    if (user) {
      saveSessionToFirestore(session, user).catch((err) => {
        console.warn("Background Firestore sync skipped:", err);
      });
    }
  } catch (e) {
    console.error("Failed to save session to storage:", e);
  }
}

export function deleteSessionFromStorage(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSavedSessions();
    const updated = existing.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete session:", e);
  }
}

