export const PARTICIPANT_STORAGE_PREFIX = "lumina-meeting-participant:";

export function participantStorageKey(shareToken: string): string {
  return `${PARTICIPANT_STORAGE_PREFIX}${shareToken}`;
}

export type StoredParticipant = {
  session_id: string;
  name: string;
  participant_id: number;
};

export function loadStoredParticipant(shareToken: string): StoredParticipant | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(participantStorageKey(shareToken));
    if (!raw) return null;
    return JSON.parse(raw) as StoredParticipant;
  } catch {
    return null;
  }
}

export function saveStoredParticipant(shareToken: string, data: StoredParticipant): void {
  localStorage.setItem(participantStorageKey(shareToken), JSON.stringify(data));
}

export function clearStoredParticipant(shareToken: string): void {
  localStorage.removeItem(participantStorageKey(shareToken));
}

export const MEETING_POLL_MS = 3000;
