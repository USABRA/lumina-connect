"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useState } from "react";

import { submitLead } from "@/lib/api";

export default function LeadForm({
  productCode,
  preview = false,
  accentColor,
}: {
  productCode: string;
  preview?: boolean;
  accentColor?: string;
}) {
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
    setSubmitting(true);
    try {
      await submitLead({
        product_code: productCode,
        name,
        email,
        phone: phone || undefined,
        company: company || undefined,
      });
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit form");
    } finally {
      setSubmitting(false);
    }
  }

  if (preview) {
    return (
      <Box sx={{ textAlign: "left", opacity: 0.85, pointerEvents: "none" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Get in touch
        </Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          <TextField label="Name" size="small" fullWidth disabled />
          <TextField label="Email" size="small" fullWidth disabled />
          <TextField label="Phone" size="small" fullWidth disabled />
        </Box>
        <Button variant="contained" fullWidth size="small" disabled sx={{ mt: 1.5 }}>
          Submit
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ textAlign: "left" }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        Get in touch
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Leave your details and we&apos;ll follow up shortly.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          Thank you! We&apos;ll be in touch soon.
        </Alert>
      )}
      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Name"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField
            label="Phone"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            label="Company"
            fullWidth
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </Box>
      </Box>
      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={submitting}
        sx={{
          mt: 2.5,
          py: 1.25,
          ...(accentColor ? { bgcolor: accentColor, "&:hover": { bgcolor: accentColor, filter: "brightness(0.92)" } } : {}),
        }}
      >
        {submitting ? "Sending…" : "Submit"}
      </Button>
    </Box>
  );
}
