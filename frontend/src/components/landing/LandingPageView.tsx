"use client";

import Box from "@mui/material/Box";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import CardLanguageProvider from "@/components/landing/CardLanguageProvider";
import LandingPageRenderer from "@/components/landing/LandingPageRenderer";
import TrackScan from "@/components/TrackScan";
import type { ProductPublic } from "@/lib/api";
import { parseLandingBlocks } from "@/lib/landingBlocks";

function resolveEventTag(urlEvent: string | null | undefined, productEventTag?: string | null) {
  const fromUrl = urlEvent?.trim();
  if (fromUrl) return fromUrl;
  const fromProduct = productEventTag?.trim();
  return fromProduct || null;
}

function LandingPageViewInner({
  product,
  code,
  urlEvent,
  urlLang,
}: {
  product: ProductPublic;
  code: string;
  urlEvent?: string | null;
  urlLang?: string | null;
}) {
  const searchParams = useSearchParams();
  const eventFromUrl = searchParams.get("event") ?? urlEvent ?? null;
  const langFromUrl = searchParams.get("lang") ?? urlLang ?? null;
  const resolvedEventTag = resolveEventTag(eventFromUrl, product.event_tag);

  const previewProduct = useMemo(
    () => ({
      unique_code: code,
      product_type: product.product_type,
      campaign_name: product.campaign_name,
      company_name: product.company_name,
      landing_headline: product.landing_headline,
      landing_description: product.landing_description,
      logo_url: product.logo_url,
      video_url: product.video_url,
      pdf_url: product.pdf_url,
      meeting_url: product.meeting_url,
      contact_form_enabled: product.contact_form_enabled,
      landing_template: product.landing_template,
      primary_color: product.primary_color,
      hero_image_url: product.hero_image_url,
      highlight_1: product.highlight_1,
      highlight_2: product.highlight_2,
      highlight_3: product.highlight_3,
      landing_blocks: parseLandingBlocks(product.landing_blocks),
      brand_website: product.brand_website,
      brand_tagline: product.brand_tagline ?? null,
      brand_display_name: product.brand_display_name ?? null,
      brand_favicon_url: product.brand_favicon_url ?? null,
      brand_secondary_color: product.brand_secondary_color ?? null,
      white_label_enabled: product.white_label_enabled ?? false,
      hide_platform_branding: product.hide_platform_branding ?? false,
      linkedin_url: product.linkedin_url ?? null,
      whatsapp: product.whatsapp ?? null,
      event_tag: resolvedEventTag,
    }),
    [code, product, resolvedEventTag]
  );

  const isNfcCard = previewProduct.landing_template === "nfc_card";

  const content = (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <TrackScan code={code} eventTag={resolvedEventTag} />
      <LandingPageRenderer product={previewProduct} />
    </Box>
  );

  if (!isNfcCard) return content;

  return <CardLanguageProvider initialLang={langFromUrl}>{content}</CardLanguageProvider>;
}

export default function LandingPageView(props: {
  product: ProductPublic;
  code: string;
  urlEvent?: string | null;
  urlLang?: string | null;
}) {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
          <TrackScan code={props.code} eventTag={resolveEventTag(props.urlEvent, props.product.event_tag)} />
        </Box>
      }
    >
      <LandingPageViewInner {...props} />
    </Suspense>
  );
}
