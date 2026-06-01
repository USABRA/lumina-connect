import type { LandingBlock } from "@/lib/landingBlocks";
import type { LandingPageUpdate } from "@/lib/api";

type LandingTemplateId =
  | "showcase"
  | "split"
  | "trade_show"
  | "media_center"
  | "brand_story"
  | "custom"
  | "nfc_card";

export type LandingPageConfig = LandingPageUpdate & {
  landing_template: LandingTemplateId;
  primary_color: string;
  landing_blocks?: LandingBlock[];
};

export function landingConfigToPayload(config: LandingPageConfig): LandingPageUpdate {
  return {
    landing_template: config.landing_template,
    primary_color: config.primary_color || null,
    landing_headline: config.landing_headline || null,
    landing_description: config.landing_description || null,
    logo_url: config.logo_url || null,
    hero_image_url: config.hero_image_url || null,
    highlight_1: config.highlight_1 || null,
    highlight_2: config.highlight_2 || null,
    highlight_3: config.highlight_3 || null,
    video_url: config.video_url || null,
    pdf_url: config.pdf_url || null,
    meeting_url: config.meeting_url || null,
    contact_form_enabled: config.contact_form_enabled,
    landing_blocks: config.landing_blocks?.length ? config.landing_blocks : null,
    linkedin_url: config.linkedin_url || null,
    whatsapp: config.whatsapp || null,
    event_tag: config.event_tag || null,
  };
}

export type LandingPreviewData = {
  unique_code: string;
  product_type: string;
  campaign_name: string;
  company_name: string;
  landing_headline?: string | null;
  landing_description?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  highlight_1?: string | null;
  highlight_2?: string | null;
  highlight_3?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  meeting_url?: string | null;
  contact_form_enabled: boolean;
  landing_template: string;
  primary_color?: string | null;
  landing_blocks?: LandingBlock[];
  brand_website?: string | null;
  brand_tagline?: string | null;
  brand_display_name?: string | null;
  brand_favicon_url?: string | null;
  brand_secondary_color?: string | null;
  white_label_enabled?: boolean;
  hide_platform_branding?: boolean;
  linkedin_url?: string | null;
  whatsapp?: string | null;
  event_tag?: string | null;
};

type TemplateContext = {
  productType: string;
  companyName: string;
  campaignName: string;
};

export function configToPreview(
  config: LandingPageConfig,
  context: TemplateContext & { productCode?: string }
): LandingPreviewData {
  return {
    unique_code: context.productCode || "PREVIEW",
    product_type: context.productType,
    campaign_name: context.campaignName,
    company_name: context.companyName,
    landing_headline: config.landing_headline || context.productType,
    landing_description: config.landing_description,
    logo_url: config.logo_url || null,
    hero_image_url: config.hero_image_url || null,
    highlight_1: config.highlight_1 || null,
    highlight_2: config.highlight_2 || null,
    highlight_3: config.highlight_3 || null,
    video_url: config.video_url || null,
    pdf_url: config.pdf_url || null,
    meeting_url: config.meeting_url || null,
    contact_form_enabled: config.contact_form_enabled ?? true,
    landing_template: config.landing_template,
    primary_color: config.primary_color,
    landing_blocks: config.landing_blocks,
    linkedin_url: config.linkedin_url || null,
    whatsapp: config.whatsapp || null,
    event_tag: config.event_tag || null,
  };
}
