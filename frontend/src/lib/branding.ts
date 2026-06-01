export const APP_NAME = "Lumina Connect";
export const APP_TAGLINE = "NFC business cards & lead intelligence";
export const APP_DESCRIPTION =
  "Turn every handshake into measurable revenue. NFC business cards, lead capture, and networking analytics for professionals and teams.";
export const DEFAULT_BRAND_COLOR = "#6366f1";

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type PublicBrandFields = {
  company_name: string;
  brand_display_name?: string | null;
  hide_platform_branding?: boolean;
  white_label_enabled?: boolean;
};

export function publicCompanyName(product: PublicBrandFields): string {
  const display = product.brand_display_name?.trim();
  return display || product.company_name;
}

export function shouldHidePlatformBranding(product: PublicBrandFields): boolean {
  return Boolean(product.hide_platform_branding || product.white_label_enabled);
}
