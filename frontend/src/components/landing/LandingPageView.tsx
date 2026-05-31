"use client";

import Box from "@mui/material/Box";

import LandingPageRenderer from "@/components/landing/LandingPageRenderer";
import TrackScan from "@/components/TrackScan";
import type { ProductPublic } from "@/lib/api";
import { parseLandingBlocks } from "@/lib/landingBlocks";

export default function LandingPageView({
  product,
  code,
}: {
  product: ProductPublic;
  code: string;
}) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <TrackScan code={code} />
      <LandingPageRenderer
        product={{
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
        }}
      />
    </Box>
  );
}
