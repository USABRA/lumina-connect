"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";

import LandingPreview from "@/components/landing/LandingPreview";
import ImageUploadField from "@/components/ui/ImageUploadField";
import type { CompanyBrand, Product } from "@/lib/api";
import { buildNfcCardLanding } from "@/lib/nfcCard";
import { configToPreview, type LandingPageConfig } from "@/lib/landingTemplates";
import { useApi } from "@/hooks/useApi";

type NfcCardEditDialogProps = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  brand: CompanyBrand | null;
  companyName: string;
  onSave: (landing: LandingPageConfig) => Promise<void>;
  saving?: boolean;
};

export default function NfcCardEditDialog({
  open,
  onClose,
  product,
  brand,
  companyName,
  onSave,
  saving = false,
}: NfcCardEditDialogProps) {
  const { uploadImage } = useApi();
  const [holderName, setHolderName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!product) return;
    setHolderName(product.landing_headline ?? "");
    setJobTitle(product.highlight_1 ?? "");
    setPhone(product.highlight_2 ?? "");
    setEmail(product.highlight_3 ?? "");
    setPhotoUrl(product.hero_image_url ?? "");
    setLinkedinUrl(product.linkedin_url ?? "");
    setWhatsapp(product.whatsapp ?? "");
    setError("");
  }, [product]);

  const landingConfig = useMemo(() => {
    if (!brand) return null;
    return buildNfcCardLanding(brand, {
      holderName: holderName || "Name",
      jobTitle: jobTitle || "Title",
      phone: phone || undefined,
      email: email || undefined,
      photoUrl: photoUrl || undefined,
      linkedinUrl: linkedinUrl || undefined,
      whatsapp: whatsapp || undefined,
    });
  }, [brand, holderName, jobTitle, phone, email, photoUrl, linkedinUrl, whatsapp]);

  const preview = landingConfig
    ? {
        ...configToPreview(landingConfig, {
          productType: product?.product_type ?? "NFC Business Card",
          companyName,
          campaignName: companyName,
          productCode: product?.unique_code,
        }),
        brand_website: brand?.brand_website ?? null,
      }
    : null;

  async function handleSave() {
    if (!brand || !holderName.trim() || !jobTitle.trim()) {
      setError("Name and job title are required.");
      return;
    }
    setError("");
    await onSave(
      buildNfcCardLanding(brand, {
        holderName,
        jobTitle,
        phone: phone || undefined,
        email: email || undefined,
        photoUrl: photoUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        whatsapp: whatsapp || undefined,
      })
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper">
      <DialogTitle>Edit card — {product?.unique_code}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Full name" required fullWidth value={holderName} onChange={(e) => setHolderName(e.target.value)} />
              <TextField label="Job title" required fullWidth value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              <TextField label="Phone" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} />
              <TextField label="Email" fullWidth type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <ImageUploadField
                label="Profile photo"
                value={photoUrl}
                onChange={setPhotoUrl}
                onUpload={uploadImage}
                helperText="Shown on the NFC card. JPG, PNG or WebP."
              />
              <TextField
                label="LinkedIn"
                fullWidth
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/username"
              />
              <TextField
                label="WhatsApp"
                fullWidth
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+1 555 000 0000"
              />
            </Box>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Preview</Typography>
            {preview && <LandingPreview product={preview} compact preview />}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        {product?.qr_url && (
          <Button component="a" href={product.qr_url} target="_blank">
            Open live card
          </Button>
        )}
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save card"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
