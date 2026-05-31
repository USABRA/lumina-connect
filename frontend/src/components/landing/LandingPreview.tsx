"use client";

import Box from "@mui/material/Box";

import CardLanguageProvider from "@/components/landing/CardLanguageProvider";
import LandingPageRenderer from "@/components/landing/LandingPageRenderer";
import type { LandingPreviewData } from "@/lib/landingTemplates";

export default function LandingPreview({
  product,
  compact = false,
  preview = false,
}: {
  product: LandingPreviewData;
  compact?: boolean;
  preview?: boolean;
}) {
  const isNfcCard = product.landing_template === "nfc_card";
  const renderer = (
    <LandingPageRenderer product={product} preview={preview} compact={compact} />
  );
  const wrapped = isNfcCard ? (
    <CardLanguageProvider syncUrl={false}>{renderer}</CardLanguageProvider>
  ) : (
    renderer
  );

  if (compact) {
    return (
      <Box
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          maxHeight: 520,
          overflowY: "auto",
          bgcolor: "#f8fafc",
        }}
      >
        {wrapped}
      </Box>
    );
  }

  return wrapped;
}
