"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import CustomBlocksEditor from "@/components/landing/CustomBlocksEditor";
import LandingPreview from "@/components/landing/LandingPreview";
import TemplateThumbnail from "@/components/landing/TemplateThumbnail";
import {
  buildLandingFromTemplate,
  configToPreview,
  LANDING_TEMPLATES,
  type LandingPageConfig,
  type LandingTemplateId,
} from "@/lib/landingTemplates";

type BuilderContext = {
  productType: string;
  companyName: string;
  campaignName: string;
  productCode?: string;
};

export default function LandingPageBuilder({
  value,
  onChange,
  context,
}: {
  value: LandingPageConfig;
  onChange: (next: LandingPageConfig) => void;
  context: BuilderContext;
}) {
  const [templateNotice, setTemplateNotice] = useState("");
  const isCustom = value.landing_template === "custom";

  function selectTemplate(templateId: LandingTemplateId) {
    if (templateId === value.landing_template) return;

    if (templateId === "custom") {
      const hasBlocks = (value.landing_blocks?.length ?? 0) > 0;
      onChange(buildLandingFromTemplate("custom", context, value));
      setTemplateNotice(
        hasBlocks
          ? "Your saved custom sections were kept."
          : "Sections were created from your current page content. You can rearrange them freely."
      );
      return;
    }

    if (value.landing_template === "custom" && (value.landing_blocks?.length ?? 0) > 0) {
      setTemplateNotice(
        "Switched to a preset layout. Your custom sections stay saved if you switch back to Custom."
      );
    } else {
      setTemplateNotice("");
    }

    onChange(buildLandingFromTemplate(templateId, context, value));
  }

  const preview = configToPreview(value, context);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Choose a page design
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each option is a full landing page with hero, content sections and contact area — not just a form.
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {LANDING_TEMPLATES.map((template) => {
          const selected = value.landing_template === template.id;
          return (
            <Grid key={template.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box
                onClick={() => selectTemplate(template.id)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "2px solid",
                  borderColor: selected ? template.accent : "divider",
                  bgcolor: selected ? `${template.accent}06` : "background.paper",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                  "&:hover": { borderColor: template.accent },
                }}
              >
                <TemplateThumbnail templateId={template.id} accent={template.accent} selected={selected} />
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mt: 1.5, gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {template.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                      {template.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                      {template.sections.join(" · ")}
                    </Typography>
                  </Box>
                  {selected && <CheckCircleIcon sx={{ color: template.accent, fontSize: 20, flexShrink: 0 }} />}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {templateNotice && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setTemplateNotice("")}>
          {templateNotice}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            {isCustom ? "Page sections" : "Page content"}
          </Typography>
          {isCustom ? (
            <CustomBlocksEditor
              blocks={value.landing_blocks ?? []}
              onChange={(landing_blocks) => onChange({ ...value, landing_blocks })}
              context={context}
              primaryColor={value.primary_color}
              onPrimaryColorChange={(primary_color) => onChange({ ...value, primary_color })}
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Headline"
                fullWidth
                value={value.landing_headline ?? ""}
                onChange={(e) => onChange({ ...value, landing_headline: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                value={value.landing_description ?? ""}
                onChange={(e) => onChange({ ...value, landing_description: e.target.value })}
              />
              <Divider />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                HIGHLIGHTS (3 cards on page)
              </Typography>
              <TextField
                label="Highlight 1"
                fullWidth
                value={value.highlight_1 ?? ""}
                onChange={(e) => onChange({ ...value, highlight_1: e.target.value })}
              />
              <TextField
                label="Highlight 2"
                fullWidth
                value={value.highlight_2 ?? ""}
                onChange={(e) => onChange({ ...value, highlight_2: e.target.value })}
              />
              <TextField
                label="Highlight 3"
                fullWidth
                value={value.highlight_3 ?? ""}
                onChange={(e) => onChange({ ...value, highlight_3: e.target.value })}
              />
              <Divider />
              <TextField
                label="Logo URL"
                fullWidth
                value={value.logo_url ?? ""}
                onChange={(e) => onChange({ ...value, logo_url: e.target.value })}
                placeholder="https://…"
              />
              <TextField
                label="Hero image URL"
                fullWidth
                value={value.hero_image_url ?? ""}
                onChange={(e) => onChange({ ...value, hero_image_url: e.target.value })}
                placeholder="Large banner / cover photo"
                helperText="Main visual for hero or split layout"
              />
              <TextField
                label="YouTube video URL"
                fullWidth
                value={value.video_url ?? ""}
                onChange={(e) => onChange({ ...value, video_url: e.target.value })}
              />
              <TextField
                label="PDF brochure URL"
                fullWidth
                value={value.pdf_url ?? ""}
                onChange={(e) => onChange({ ...value, pdf_url: e.target.value })}
              />
              <TextField
                label="Book demo URL (Calendly)"
                fullWidth
                value={value.meeting_url ?? ""}
                onChange={(e) => onChange({ ...value, meeting_url: e.target.value })}
              />
              <TextField
                label="Brand color"
                fullWidth
                type="color"
                value={value.primary_color}
                onChange={(e) => onChange({ ...value, primary_color: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={value.contact_form_enabled ?? true}
                    onChange={(e) => onChange({ ...value, contact_form_enabled: e.target.checked })}
                  />
                }
                label="Include contact section at bottom"
              />
            </Box>
          )}
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Page preview
          </Typography>
          <LandingPreview product={preview} compact preview />
        </Grid>
      </Grid>
    </Box>
  );
}
