"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useState } from "react";

import { useCardLanguage } from "@/components/landing/CardLanguageProvider";
import { submitLead } from "@/lib/api";

export default function NfcCardContactForm({
  productCode,
  preview = false,
  accentColor,
  eventTag,
}: {
  productCode: string;
  preview?: boolean;
  accentColor?: string;
  eventTag?: string | null;
}) {
  const { t } = useCardLanguage();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError(t("emailOrPhoneRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await submitLead({
        product_code: productCode,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        event_tag: eventTag?.trim() || undefined,
      });
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (preview) {
    return (
      <Accordion
        expanded={false}
        disableGutters
        elevation={0}
        sx={{
          mt: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "8px !important",
          "&:before": { display: "none" },
          opacity: 0.85,
          pointerEvents: "none",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 48,
            "& .MuiAccordionSummary-content": { justifyContent: "center", textAlign: "center" },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "center" }}>
            {t("leaveContact")}
          </Typography>
        </AccordionSummary>
      </Accordion>
    );
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      elevation={0}
      sx={{
        mt: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px !important",
        "&:before": { display: "none" },
        bgcolor: "transparent",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 48,
          px: 1.5,
          "& .MuiAccordionSummary-content": { my: 1, justifyContent: "center", textAlign: "center" },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "center", width: "100%" }}>
          {t("leaveContact")}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pb: 2, pt: 0, textAlign: "left" }}>
        {success ? (
          <Alert severity="success" sx={{ borderRadius: 2, textAlign: "center" }}>
            {t("successMessage")}
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ textAlign: "left" }}>
            {error && (
              <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <TextField
                label={t("name")}
                size="small"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                label={t("email")}
                type="email"
                size="small"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText={t("emailOrWhatsapp")}
              />
              <TextField
                label={t("whatsappPhone")}
                size="small"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <TextField
                label={t("company")}
                size="small"
                fullWidth
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                helperText={t("companyOptional")}
              />
            </Box>
            <Button
              type="submit"
              variant="outlined"
              fullWidth
              size="small"
              disabled={submitting}
              sx={{
                mt: 1.5,
                ...(accentColor
                  ? { borderColor: accentColor, color: accentColor, "&:hover": { borderColor: accentColor, bgcolor: `${accentColor}08` } }
                  : {}),
              }}
            >
              {submitting ? t("sending") : t("send")}
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
