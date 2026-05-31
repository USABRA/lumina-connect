"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { CompanyBrand, CompanyBrandUpdate } from "@/lib/api";

export default function SettingsPage() {
  const { profile } = useAuth();
  const { request } = useApi();
  const [form, setForm] = useState<CompanyBrandUpdate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBrand = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request<CompanyBrand>("/companies/brand");
      setForm({
        company_name: data.company_name,
        brand_logo_url: data.brand_logo_url ?? "",
        brand_color: data.brand_color ?? "#0f172a",
        brand_tagline: data.brand_tagline ?? "",
        brand_website: data.brand_website ?? "",
        brand_phone: data.brand_phone ?? "",
        default_meeting_url: data.default_meeting_url ?? "",
        default_pdf_url: data.default_pdf_url ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brand kit");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadBrand();
  }, [loadBrand]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await request<CompanyBrand>("/companies/brand", {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          brand_logo_url: form.brand_logo_url || null,
          brand_tagline: form.brand_tagline || null,
          brand_website: form.brand_website || null,
          brand_phone: form.brand_phone || null,
          default_meeting_url: form.default_meeting_url || null,
          default_pdf_url: form.default_pdf_url || null,
        }),
      });
      setSuccess("Brand kit saved. New NFC cards will use these defaults.");
      await loadBrand();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function setField<K extends keyof CompanyBrandUpdate>(key: K, value: CompanyBrandUpdate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Box>
      <PageHeader
        title="Brand kit"
        subtitle="Your company identity — every team member's NFC card inherits these settings."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Configure here first, then create cards in{" "}
        <Link href="/products">Team cards → Add team member</Link>. Each card only needs the person&apos;s name and title.
      </Alert>

      <ContentCard title="Company identity">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, p: 2.5 }}>
          <TextField
            label="Company name"
            fullWidth
            disabled={loading}
            value={form.company_name ?? profile?.company?.company_name ?? ""}
            onChange={(e) => setField("company_name", e.target.value)}
          />
          <TextField
            label="Tagline"
            fullWidth
            disabled={loading}
            placeholder="Precision engineering for modern teams"
            value={form.brand_tagline ?? ""}
            onChange={(e) => setField("brand_tagline", e.target.value)}
            helperText="Shown on every NFC card landing page"
          />
          <TextField
            label="Logo URL"
            fullWidth
            disabled={loading}
            value={form.brand_logo_url ?? ""}
            onChange={(e) => setField("brand_logo_url", e.target.value)}
            placeholder="https://…"
          />
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label="Brand color"
              fullWidth
              disabled={loading}
              value={form.brand_color ?? "#0f172a"}
              onChange={(e) => setField("brand_color", e.target.value)}
            />
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: form.brand_color || "#0f172a",
                border: "1px solid",
                borderColor: "divider",
                flexShrink: 0,
              }}
            />
          </Box>
        </Box>
      </ContentCard>

      <Box sx={{ mt: 3 }}>
        <ContentCard title="Default contact links">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Applied to all NFC cards unless overridden per card.
            </Typography>
            <TextField
              label="Company phone"
              fullWidth
              disabled={loading}
              value={form.brand_phone ?? ""}
              onChange={(e) => setField("brand_phone", e.target.value)}
            />
            <TextField
              label="Website"
              fullWidth
              disabled={loading}
              value={form.brand_website ?? ""}
              onChange={(e) => setField("brand_website", e.target.value)}
              placeholder="https://yourcompany.com"
            />
            <TextField
              label="Meeting link (Calendly, etc.)"
              fullWidth
              disabled={loading}
              value={form.default_meeting_url ?? ""}
              onChange={(e) => setField("default_meeting_url", e.target.value)}
            />
            <TextField
              label="PDF / vCard download URL"
              fullWidth
              disabled={loading}
              value={form.default_pdf_url ?? ""}
              onChange={(e) => setField("default_pdf_url", e.target.value)}
            />
            <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving…" : "Save brand kit"}
            </Button>
          </Box>
        </ContentCard>
      </Box>
    </Box>
  );
}
