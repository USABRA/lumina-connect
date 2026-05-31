"use client";

import Box from "@mui/material/Box";
import type { LandingTemplateId } from "@/lib/landingTemplates";

export default function TemplateThumbnail({
  templateId,
  accent,
  selected,
}: {
  templateId: LandingTemplateId;
  accent: string;
  selected?: boolean;
}) {
  const border = selected ? accent : "#e2e8f0";

  if (templateId === "nfc_card") {
    return (
      <Box sx={{ border: `2px solid ${border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: "#fff" }}>
        <Box sx={{ height: 36, background: `linear-gradient(135deg, ${accent}, #1e293b)` }} />
        <Box sx={{ p: 1, mt: -1.5 }}>
          <Box sx={{ mx: "auto", width: 16, height: 16, borderRadius: "50%", bgcolor: "#fff", mb: 0.5 }} />
          <Box sx={{ height: 4, width: "50%", bgcolor: "#cbd5e1", borderRadius: 1, mx: "auto", mb: 0.5 }} />
          <Box sx={{ height: 3, width: "35%", bgcolor: "#e2e8f0", borderRadius: 1, mx: "auto", mb: 1 }} />
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ height: 8, bgcolor: "#f8fafc", borderRadius: 0.5, border: "1px solid #e2e8f0", mb: 0.4 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (templateId === "showcase") {
    return (
      <Box sx={{ border: `2px solid ${border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: "#fff" }}>
        <Box sx={{ height: 28, background: `linear-gradient(90deg, ${accent}, #1e293b)` }} />
        <Box sx={{ p: 1 }}>
          <Box sx={{ height: 6, width: "70%", bgcolor: "#cbd5e1", borderRadius: 1, mb: 0.5 }} />
          <Box sx={{ height: 4, width: "90%", bgcolor: "#e2e8f0", borderRadius: 1 }} />
          <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ flex: 1, height: 18, bgcolor: "#f1f5f9", borderRadius: 0.5 }} />
            ))}
          </Box>
          <Box sx={{ height: 20, bgcolor: "#f8fafc", borderRadius: 0.5, mt: 1, border: "1px solid #e2e8f0" }} />
        </Box>
      </Box>
    );
  }

  if (templateId === "split") {
    return (
      <Box sx={{ border: `2px solid ${border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: "#fff" }}>
        <Box sx={{ display: "flex", height: 72 }}>
          <Box sx={{ flex: 1, p: 1 }}>
            <Box sx={{ height: 5, width: "60%", bgcolor: accent, borderRadius: 1, mb: 0.5 }} />
            <Box sx={{ height: 3, width: "80%", bgcolor: "#e2e8f0", borderRadius: 1, mb: 0.5 }} />
            <Box sx={{ height: 3, width: "70%", bgcolor: "#e2e8f0", borderRadius: 1 }} />
          </Box>
          <Box sx={{ width: "42%", bgcolor: `${accent}33` }} />
        </Box>
        <Box sx={{ height: 16, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }} />
      </Box>
    );
  }

  if (templateId === "trade_show") {
    return (
      <Box sx={{ border: `2px solid ${border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: "#fff" }}>
        <Box sx={{ height: 8, bgcolor: accent }} />
        <Box sx={{ height: 24, bgcolor: "#0f172a" }} />
        <Box sx={{ display: "flex", gap: 0.5, p: 0.75 }}>
          <Box sx={{ flex: 1.2, height: 32, bgcolor: "#f1f5f9", borderRadius: 0.5 }} />
          <Box sx={{ flex: 0.8, height: 32, bgcolor: "#fff", borderRadius: 0.5, border: "1px solid #e2e8f0" }} />
        </Box>
      </Box>
    );
  }

  if (templateId === "custom") {
    return (
      <Box sx={{ border: `2px solid ${border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: "#fff" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, p: 1 }}>
          <Box sx={{ height: 14, borderRadius: 0.5, bgcolor: `${accent}55`, border: `1px dashed ${accent}` }} />
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Box sx={{ flex: 1, height: 10, bgcolor: "#f1f5f9", borderRadius: 0.5 }} />
            <Box sx={{ flex: 1, height: 10, bgcolor: "#e2e8f0", borderRadius: 0.5 }} />
          </Box>
          <Box sx={{ height: 8, width: "40%", bgcolor: accent, borderRadius: 0.5, alignSelf: "center" }} />
          <Box sx={{ height: 12, bgcolor: "#f8fafc", borderRadius: 0.5, border: "1px solid #e2e8f0" }} />
        </Box>
      </Box>
    );
  }

  if (templateId === "media_center") {
    return (
      <Box sx={{ border: `2px solid ${border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: "#0f172a" }}>
        <Box sx={{ p: 1 }}>
          <Box sx={{ height: 5, width: "50%", bgcolor: "#64748b", borderRadius: 1, mb: 1 }} />
          <Box sx={{ height: 36, bgcolor: "#1e293b", borderRadius: 0.5, mb: 1 }} />
          <Box sx={{ height: 14, bgcolor: "#f8fafc", borderRadius: 0.5 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ border: `2px solid ${border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: "#fff" }}>
      <Box
        sx={{
          height: 40,
          background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), ${accent}`,
        }}
      />
      <Box sx={{ p: 1 }}>
        <Box sx={{ height: 4, width: "80%", bgcolor: "#e2e8f0", borderRadius: 1, mx: "auto", mb: 1 }} />
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ flex: 1, height: 14, bgcolor: "#f1f5f9", borderRadius: 0.5 }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
