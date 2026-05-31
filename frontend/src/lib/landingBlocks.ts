type LandingBlockType =
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
