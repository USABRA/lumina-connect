export type VCardData = {
  fullName: string;
  jobTitle?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  linkedin?: string;
};

function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function buildVCard(data: VCardData): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(data.fullName)}`,
    `N:${escapeVCard(data.fullName)};;;;`,
  ];

  if (data.jobTitle) lines.push(`TITLE:${escapeVCard(data.jobTitle)}`);
  if (data.company) lines.push(`ORG:${escapeVCard(data.company)}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone.replace(/\s/g, "")}`);
  if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(data.email)}`);
  if (data.website) {
    const url = data.website.startsWith("http") ? data.website : `https://${data.website}`;
    lines.push(`URL:${url}`);
  }
  if (data.linkedin) lines.push(`URL;TYPE=LinkedIn:${data.linkedin}`);

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export async function saveContact(data: VCardData): Promise<void> {
  const content = buildVCard(data);
  const filename = vcardFilename(data);
  const blob = new Blob([content], { type: "text/vcard;charset=utf-8" });
  const file = new File([content], filename, { type: "text/vcard" });

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: data.fullName });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.assign(`data:text/vcard;charset=utf-8,${encodeURIComponent(content)}`);
    return;
  }

  downloadVCard(data, filename);
}

function vcardFilename(data: VCardData) {
  return `${data.fullName.replace(/\s+/g, "-").toLowerCase() || "contact"}.vcf`;
}

export function downloadVCard(data: VCardData, filename?: string) {
  const content = buildVCard(data);
  const blob = new Blob([content], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `${data.fullName.replace(/\s+/g, "-").toLowerCase() || "contact"}.vcf`;
  link.click();
  URL.revokeObjectURL(url);
}

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
