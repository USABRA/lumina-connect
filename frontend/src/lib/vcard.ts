export function whatsappHref(number: string, message?: string) {
  const digits = number.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function normalizeLinkedInUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("linkedin.com") || trimmed.startsWith("www.linkedin.com")) {
    return `https://${trimmed}`;
  }
  return `https://linkedin.com/in/${trimmed.replace(/^\/+/, "")}`;
}
