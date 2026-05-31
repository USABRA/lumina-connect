"use client";

import Box from "@mui/material/Box";

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
        <LandingPageRenderer product={product} preview={preview} compact />
      </Box>
    );
  }

  return <LandingPageRenderer product={product} preview={preview} />;
}
