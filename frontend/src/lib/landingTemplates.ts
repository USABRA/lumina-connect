import type { LandingBlock } from "@/lib/landingBlocks";
import { createDefaultBlocksFromConfig, parseLandingBlocks } from "@/lib/landingBlocks";
import type { LandingPageUpdate } from "@/lib/api";

export type LandingTemplateId =
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

export type LandingTemplate = {
  id: LandingTemplateId;
  name: string;
  description: string;
  accent: string;
  sections: string[];
};

export const LANDING_TEMPLATES: LandingTemplate[] = [
  {
    id: "nfc_card",
    name: "NFC Business Card",
    description: "Mobile-first digital card — name, role, tap-to-call, email and booking links.",
    accent: "#0f172a",
    sections: ["Profile", "Quick actions", "Company brand"],
  },
  {
    id: "showcase",
    name: "Showcase",
    description: "Full hero banner, product highlights, video area and contact section.",
    accent: "#4f46e5",
    sections: ["Hero banner", "Highlights", "Video", "Contact"],
  },
  {
    id: "split",
    name: "Split Screen",
    description: "Two-column page — story on the left, hero image or video on the right.",
    accent: "#0ea5e9",
    sections: ["Split layout", "Bullet points", "CTA buttons", "Contact"],
  },
  {
    id: "trade_show",
    name: "Trade Show",
    description: "Event-style page with campaign ribbon, booth feel and side contact card.",
    accent: "#10b981",
    sections: ["Event header", "Booth layout", "Media", "Side form"],
  },
  {
    id: "media_center",
    name: "Media Center",
    description: "Dark cinematic page built around video or hero image.",
    accent: "#6366f1",
    sections: ["Dark hero", "Video stage", "CTA bar", "Contact"],
  },
  {
    id: "brand_story",
    name: "Brand Story",
    description: "Full-screen visual hero with brand narrative and feature cards.",
    accent: "#8b5cf6",
    sections: ["Cover hero", "Story", "Features", "Contact"],
  },
  {
    id: "custom",
    name: "Custom",
    description: "Build your own page by adding and arranging sections in any order.",
    accent: "#f59e0b",
    sections: ["Your sections", "Any order", "Full control"],
  },
];

export const DEFAULT_LANDING_CONFIG: LandingPageConfig = {
  landing_template: "showcase",
  primary_color: "#4f46e5",
  landing_headline: "",
  landing_description: "",
  logo_url: "",
  hero_image_url: "",
  highlight_1: "",
  highlight_2: "",
  highlight_3: "",
  video_url: "",
  pdf_url: "",
  meeting_url: "",
  contact_form_enabled: true,
};

type TemplateContext = {
  productType: string;
  companyName: string;
  campaignName: string;
};

function defaultHighlights(productType: string, companyName: string): [string, string, string] {
  return [
    `Discover ${productType} in action`,
    `Built for teams like ${companyName}`,
    "Fast follow-up after every scan",
  ];
}

export function buildLandingFromTemplate(
  templateId: LandingTemplateId,
  context: TemplateContext,
  current?: Partial<LandingPageConfig>
): LandingPageConfig {
  if (templateId === "custom") {
    const template = LANDING_TEMPLATES.find((t) => t.id === "custom") ?? LANDING_TEMPLATES[0];
    const existingBlocks = current?.landing_blocks?.length ? current.landing_blocks : undefined;
    return {
      ...DEFAULT_LANDING_CONFIG,
      ...current,
      landing_template: "custom",
      primary_color: current?.primary_color || template.accent,
      landing_blocks:
        existingBlocks ?? createDefaultBlocksFromConfig({ ...DEFAULT_LANDING_CONFIG, ...current }, context),
    };
  }

  const template = LANDING_TEMPLATES.find((t) => t.id === templateId) ?? LANDING_TEMPLATES[0];
  const { productType, companyName, campaignName } = context;
  const [h1, h2, h3] = defaultHighlights(productType, companyName);

  const base: LandingPageConfig = {
    ...DEFAULT_LANDING_CONFIG,
    ...current,
    landing_template: templateId,
    primary_color: template.accent,
    landing_headline: current?.landing_headline || productType,
    landing_description:
      current?.landing_description ||
      `${companyName} is showcasing ${productType} at ${campaignName}. Explore the page and connect with our team.`,
    highlight_1: current?.highlight_1 || h1,
    highlight_2: current?.highlight_2 || h2,
    highlight_3: current?.highlight_3 || h3,
    contact_form_enabled: current?.contact_form_enabled ?? true,
  };

  switch (templateId) {
    case "split":
      return {
        ...base,
        landing_description:
          current?.landing_description ||
          `${productType} helps your business stand out. Learn more about what ${companyName} offers at ${campaignName}.`,
        landing_blocks: current?.landing_blocks,
      };
    case "trade_show":
      return {
        ...base,
        landing_headline: current?.landing_headline || `Meet ${companyName} at ${campaignName}`,
        landing_description:
          current?.landing_description ||
          `Stop by our booth to see ${productType} up close. Can't wait? Leave your info and we'll reach out.`,
        landing_blocks: current?.landing_blocks,
      };
    case "media_center":
      return {
        ...base,
        landing_headline: current?.landing_headline || `See ${productType} in action`,
        landing_description:
          current?.landing_description ||
          `Watch the demo and discover how ${companyName} can help your team.`,
        landing_blocks: current?.landing_blocks,
      };
    case "brand_story":
      return {
        ...base,
        landing_headline: current?.landing_headline || companyName,
        landing_description:
          current?.landing_description ||
          `We build ${productType} experiences that turn every scan into a meaningful conversation.`,
        landing_blocks: current?.landing_blocks,
      };
    case "nfc_card":
      return {
        ...base,
        landing_template: "nfc_card",
        primary_color: current?.primary_color || "#0f172a",
        landing_headline: current?.landing_headline || companyName,
        landing_description: current?.landing_description || "Tap to connect",
        highlight_1: current?.highlight_1 || "Your role / title",
        highlight_2: current?.highlight_2 || "",
        highlight_3: current?.highlight_3 || "",
        contact_form_enabled: false,
        landing_blocks: current?.landing_blocks,
      };
    default:
      return { ...base, landing_blocks: current?.landing_blocks };
  }
}

export function productToLandingConfig(product: {
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
  contact_form_enabled?: boolean;
  landing_template?: string | null;
  primary_color?: string | null;
  landing_blocks?: unknown;
  product_type: string;
  linkedin_url?: string | null;
  whatsapp?: string | null;
}): LandingPageConfig {
  const legacyMap: Record<string, LandingTemplateId> = {
    classic: "showcase",
    video_first: "media_center",
    lead_capture: "brand_story",
    brochure: "split",
    minimal: "trade_show",
  };
  const templateId =
    legacyMap[product.landing_template ?? ""] ??
    (product.landing_template as LandingTemplateId) ??
    "showcase";

  return {
    landing_template: templateId,
    primary_color: product.primary_color || "#4f46e5",
    landing_headline: product.landing_headline ?? "",
    landing_description: product.landing_description ?? "",
    logo_url: product.logo_url ?? "",
    hero_image_url: product.hero_image_url ?? "",
    highlight_1: product.highlight_1 ?? "",
    highlight_2: product.highlight_2 ?? "",
    highlight_3: product.highlight_3 ?? "",
    video_url: product.video_url ?? "",
    pdf_url: product.pdf_url ?? "",
    meeting_url: product.meeting_url ?? "",
    contact_form_enabled: product.contact_form_enabled ?? true,
    landing_blocks: parseLandingBlocks(product.landing_blocks),
    linkedin_url: product.linkedin_url ?? "",
    whatsapp: product.whatsapp ?? "",
  };
}

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
  linkedin_url?: string | null;
  whatsapp?: string | null;
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
  };
}
