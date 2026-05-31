const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function trackCardAction(
  code: string,
  action: "meeting_scheduled",
  eventTag?: string | null
): Promise<void> {
  if (!code || code === "PREVIEW") return;

  const params = new URLSearchParams({ action });
  if (eventTag?.trim()) params.set("event", eventTag.trim());

  try {
    await fetch(`${API_URL}/track/${encodeURIComponent(code)}?${params.toString()}`, {
      method: "POST",
    });
  } catch {
    // Silent fail — navigation still proceeds
  }
}

export function openTrackedMeetingLink(
  code: string,
  url: string,
  eventTag?: string | null,
  preview?: boolean
): void {
  if (preview) return;
  void trackCardAction(code, "meeting_scheduled", eventTag);
  window.open(url, "_blank", "noopener,noreferrer");
}
