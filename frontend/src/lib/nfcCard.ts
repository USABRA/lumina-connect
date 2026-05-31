import type { CompanyBrand } from "@/lib/api";
import type { LandingPageConfig } from "@/lib/landingTemplates";

export const NFC_PRODUCT_TYPE = "NFC Business Card";

type NfcCardInput = {
  holderName: string;
  jobTitle: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  linkedinUrl?: string;
  whatsapp?: string;
  contactFormEnabled?: boolean;
  eventTag?: string;
};

export function buildNfcCardLanding(
  brand: CompanyBrand,
  card: NfcCardInput
): LandingPageConfig {
  const color = brand.brand_color || "#4f46e5";
  const tagline = brand.brand_tagline || `${brand.company_name} — tap to connect`;

  return {
    landing_template: "nfc_card",
    primary_color: color,
    landing_headline: card.holderName.trim(),
    landing_description: tagline,
    logo_url: brand.brand_logo_url || "",
    hero_image_url: card.photoUrl?.trim() || "",
    highlight_1: card.jobTitle.trim(),
    highlight_2: card.phone?.trim() || brand.brand_phone || "",
    highlight_3: card.email?.trim() || "",
    linkedin_url: card.linkedinUrl?.trim() || "",
    whatsapp: card.whatsapp?.trim() || "",
    video_url: "",
    pdf_url: brand.default_pdf_url || "",
    meeting_url: brand.default_meeting_url || "",
    contact_form_enabled: card.contactFormEnabled ?? true,
    event_tag: card.eventTag?.trim() || null,
  };
}
