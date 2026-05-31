export type LandingBlockType =
  | "hero"
  | "text"
  | "highlights"
  | "image"
  | "video"
  | "cta_buttons"
  | "contact_form"
  | "spacer";

export type LandingBlock = {
  id: string;
  type: LandingBlockType;
  headline?: string;
  description?: string;
  body?: string;
  logo_url?: string;
  image_url?: string;
  alt?: string;
  video_url?: string;
  pdf_url?: string;
  meeting_url?: string;
  title?: string;
  items?: string[];
  align?: "left" | "center";
  show_campaign?: boolean;
  size?: "sm" | "md" | "lg";
};

export const BLOCK_TYPE_LABELS: Record<LandingBlockType, string> = {
  hero: "Hero",
  text: "Text",
  highlights: "Highlights",
  image: "Image",
  video: "Video",
  cta_buttons: "CTA buttons",
  contact_form: "Contact form",
  spacer: "Spacer",
};

export const BLOCK_TYPE_DESCRIPTIONS: Record<LandingBlockType, string> = {
  hero: "Banner with headline, description and optional logo",
  text: "Headline and paragraph",
  highlights: "Three feature cards",
  image: "Full-width image",
  video: "Embedded YouTube video",
  cta_buttons: "Brochure download and demo booking links",
  contact_form: "Lead capture form",
  spacer: "Vertical spacing between sections",
};

type BlockContext = {
  productType: string;
  companyName: string;
  campaignName: string;
};

export function generateBlockId(): string {
  return `block_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyBlock(type: LandingBlockType, context?: BlockContext): LandingBlock {
  const id = generateBlockId();
  switch (type) {
    case "hero":
      return {
        id,
        type,
        headline: context?.productType ?? "",
        description: context
          ? `${context.companyName} is showcasing ${context.productType} at ${context.campaignName}.`
          : "",
        show_campaign: true,
      };
    case "text":
      return { id, type, headline: "About us", body: "", align: "left" };
    case "highlights":
      return {
        id,
        type,
        items: context
          ? [
              `Discover ${context.productType} in action`,
              `Built for teams like ${context.companyName}`,
              "Fast follow-up after every scan",
            ]
          : ["Highlight 1", "Highlight 2", "Highlight 3"],
      };
    case "image":
      return { id, type, image_url: "", alt: "" };
    case "video":
      return { id, type, video_url: "" };
    case "cta_buttons":
      return { id, type, align: "center" };
    case "contact_form":
      return { id, type, title: "Let's connect" };
    case "spacer":
      return { id, type, size: "md" };
    default:
      return { id, type: "text", body: "" };
  }
}

export function createDefaultBlocksFromConfig(
  config: {
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
  },
  context: BlockContext
): LandingBlock[] {
  const blocks: LandingBlock[] = [
    {
      id: generateBlockId(),
      type: "hero",
      headline: config.landing_headline || context.productType,
      description:
        config.landing_description ||
        `${context.companyName} is showcasing ${context.productType} at ${context.campaignName}.`,
      logo_url: config.logo_url || "",
      show_campaign: true,
    },
  ];

  if (config.hero_image_url) {
    blocks.push({
      id: generateBlockId(),
      type: "image",
      image_url: config.hero_image_url,
      alt: config.landing_headline || context.productType,
    });
  }

  const highlights = [config.highlight_1, config.highlight_2, config.highlight_3].filter(
    (item): item is string => Boolean(item)
  );
  if (highlights.length > 0) {
    blocks.push({
      id: generateBlockId(),
      type: "highlights",
      items: highlights.length >= 3 ? highlights : [...highlights, "", "", ""].slice(0, 3),
    });
  }

  if (config.video_url) {
    blocks.push({ id: generateBlockId(), type: "video", video_url: config.video_url });
  }

  if (config.pdf_url || config.meeting_url) {
    blocks.push({
      id: generateBlockId(),
      type: "cta_buttons",
      pdf_url: config.pdf_url || "",
      meeting_url: config.meeting_url || "",
      align: "center",
    });
  }

  if (config.contact_form_enabled !== false) {
    blocks.push({ id: generateBlockId(), type: "contact_form", title: "Let's connect" });
  }

  return blocks;
}

export function parseLandingBlocks(raw: unknown): LandingBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (block): block is LandingBlock =>
      typeof block === "object" &&
      block !== null &&
      typeof (block as LandingBlock).id === "string" &&
      typeof (block as LandingBlock).type === "string"
  );
}

export function moveBlock(blocks: LandingBlock[], index: number, direction: -1 | 1): LandingBlock[] {
  const next = [...blocks];
  const target = index + direction;
  if (target < 0 || target >= next.length) return blocks;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function updateBlock(blocks: LandingBlock[], id: string, patch: Partial<LandingBlock>): LandingBlock[] {
  return blocks.map((block) => (block.id === id ? { ...block, ...patch } : block));
}

export function removeBlock(blocks: LandingBlock[], id: string): LandingBlock[] {
  return blocks.filter((block) => block.id !== id);
}

export function insertBlock(blocks: LandingBlock[], block: LandingBlock, index?: number): LandingBlock[] {
  const next = [...blocks];
  if (index === undefined || index >= next.length) {
    next.push(block);
  } else {
    next.splice(index, 0, block);
  }
  return next;
}
