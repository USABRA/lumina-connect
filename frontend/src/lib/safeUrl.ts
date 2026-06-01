/**
 * Validates user-supplied external URLs (http/https only).
 * Blocks javascript:, data:, and protocol-relative open redirects.
 */
export function isSafeExternalUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (!parsed.hostname) return false;
    return true;
  } catch {
    return false;
  }
}

export function safeExternalUrlError(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return isSafeExternalUrl(value) ? null : "Use a valid http or https URL";
}
