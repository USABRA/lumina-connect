"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import WhiteLabelPreview from "@/components/settings/WhiteLabelPreview";
import BrandColorPicker from "@/components/ui/BrandColorPicker";
import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { CompanyBrand, CompanyBrandUpdate } from "@/lib/api";
import { safeExternalUrlError } from "@/lib/safeUrl";

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
        white_label_enabled: data.white_label_enabled ?? false,
        hide_platform_branding: data.hide_platform_branding ?? false,
        brand_display_name: data.brand_display_name ?? "",
        brand_favicon_url: data.brand_favicon_url ?? "",
        brand_secondary_color: data.brand_secondary_color ?? "",
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
    const urlFields: Array<[string, string | null | undefined]> = [
      ["Website", form.brand_website],
      ["Meeting link", form.default_meeting_url],
      ["PDF link", form.default_pdf_url],
      ["Logo URL", form.brand_logo_url],
      ["Favicon URL", form.brand_favicon_url],
    ];
    for (const [label, value] of urlFields) {
      const msg = safeExternalUrlError(value ?? "");
      if (msg) {
        setError(`${label}: ${msg}`);
        setSaving(false);
        return;
      }
    }
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
          brand_display_name: form.brand_display_name || null,
          brand_favicon_url: form.brand_favicon_url || null,
          brand_secondary_color: form.brand_secondary_color || null,
          white_label_enabled: form.white_label_enabled,
          hide_platform_branding: form.hide_platform_branding,
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
          <BrandColorPicker
            label="Brand color"
            disabled={loading}
            value={form.brand_color ?? "#0f172a"}
            onChange={(hex) => setField("brand_color", hex)}
            fallbackColor="#0f172a"
          />
        </Box>
      </ContentCard>

      <Box sx={{ mt: 3 }}>
        <ContentCard title="White-label (public pages)">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Controls how NFC card pages (<code>/p/…</code>) appear to visitors. Your dashboard keeps Lumina Connect branding.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.white_label_enabled)}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setForm((prev) => ({
                      ...prev,
                      white_label_enabled: enabled,
                      hide_platform_branding: enabled ? true : prev.hide_platform_branding,
                    }));
                  }}
                  disabled={loading}
                />
              }
              label="Enable white-label mode"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.hide_platform_branding)}
                  onChange={(e) => setField("hide_platform_branding", e.target.checked)}
                  disabled={loading || Boolean(form.white_label_enabled)}
                />
              }
              label='Hide "Powered by Lumina Connect" on public landings'
            />
            <TextField
              label="Public display name"
              fullWidth
              disabled={loading}
              placeholder={form.company_name ?? "Your Company"}
              value={form.brand_display_name ?? ""}
              onChange={(e) => setField("brand_display_name", e.target.value)}
              helperText="Shown on cards instead of legal company name when set"
            />
            <BrandColorPicker
              label="Secondary brand color"
              disabled={loading}
              value={form.brand_secondary_color ?? ""}
              onChange={(hex) => setField("brand_secondary_color", hex)}
              allowEmpty
              helperText="Optional accent color for public landing pages"
            />
            <TextField
              label="Favicon URL (optional)"
              fullWidth
              disabled={loading}
              value={form.brand_favicon_url ?? ""}
              onChange={(e) => setField("brand_favicon_url", e.target.value)}
              placeholder="https://…/favicon.ico"
            />
            <WhiteLabelPreview
              brand={{
                company_name: form.company_name ?? profile?.company?.company_name,
                brand_display_name: form.brand_display_name || null,
                brand_logo_url: form.brand_logo_url || null,
                brand_color: form.brand_color,
                brand_tagline: form.brand_tagline,
                brand_phone: form.brand_phone,
                brand_website: form.brand_website,
                white_label_enabled: form.white_label_enabled,
                hide_platform_branding: form.hide_platform_branding,
              }}
            />
          </Box>
        </ContentCard>
      </Box>

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
