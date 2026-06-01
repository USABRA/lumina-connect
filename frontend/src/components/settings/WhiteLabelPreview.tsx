"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import LandingPreview from "@/components/landing/LandingPreview";
import type { CompanyBrand } from "@/lib/api";
import { publicCompanyName } from "@/lib/branding";
import type { LandingPreviewData } from "@/lib/landingTemplates";

function buildPreviewProduct(brand: Partial<CompanyBrand>): LandingPreviewData {
  const companyName = brand.company_name || "Your Company";
  const displayName = publicCompanyName({
    company_name: companyName,
    brand_display_name: brand.brand_display_name,
  });
  const color = brand.brand_color || "#4f46e5";

  return {
    unique_code: "PREVIEW",
    product_type: "NFC Business Card",
    campaign_name: "Preview",
    company_name: companyName,
    brand_display_name: brand.brand_display_name ?? displayName,
    landing_headline: "Alex Morgan",
    landing_description: brand.brand_tagline || "Tap to connect",
    logo_url: brand.brand_logo_url || null,
    landing_template: "nfc_card",
    primary_color: color,
    highlight_1: "Head of Sales",
    highlight_2: brand.brand_phone || "+1 555 000 0000",
    highlight_3: "alex@company.com",
    brand_website: brand.brand_website || "https://example.com",
    contact_form_enabled: false,
    white_label_enabled: brand.white_label_enabled,
    hide_platform_branding: brand.hide_platform_branding,
  };
}

export default function WhiteLabelPreview({ brand }: { brand: Partial<CompanyBrand> }) {
  const product = buildPreviewProduct(brand);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Public card preview
      </Typography>
      <LandingPreview product={product} compact preview />
    </Box>
  );
}
