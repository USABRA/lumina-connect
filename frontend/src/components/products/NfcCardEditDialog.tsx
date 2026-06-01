"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";

import LandingPreview from "@/components/landing/LandingPreview";
import ImageUploadField from "@/components/ui/ImageUploadField";
import AssignedUserSelectField from "@/components/products/AssignedUserSelectField";
import RoleSelectField from "@/components/products/RoleSelectField";
import type { CompanyBrand, CompanyMember, Product } from "@/lib/api";
import { isAdmin } from "@/lib/permissions";
import { buildNfcCardLanding } from "@/lib/nfcCard";
import { configToPreview, type LandingPageConfig } from "@/lib/landingTemplates";
import { parseTeamStructure } from "@/lib/teamStructure";
import { useFullScreenDialog } from "@/hooks/useFullScreenDialog";
import { useApi } from "@/hooks/useApi";

type NfcCardEditDialogProps = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  brand: CompanyBrand | null;
  companyName: string;
  members?: CompanyMember[];
  userRole?: "admin" | "company_user";
  onSave: (payload: {
    landing: LandingPageConfig;
    team_role_id: string | null;
    assigned_user_id?: number | null;
  }) => Promise<void>;
  saving?: boolean;
};

export default function NfcCardEditDialog({
  open,
  onClose,
  product,
  brand,
  companyName,
  members = [],
  userRole = "company_user",
  onSave,
  saving = false,
}: NfcCardEditDialogProps) {
  const { uploadImage } = useApi();
  const fullScreen = useFullScreenDialog();
  const [holderName, setHolderName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [teamRoleId, setTeamRoleId] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const userIsAdmin = isAdmin(userRole);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactFormEnabled, setContactFormEnabled] = useState(true);
  const [eventTag, setEventTag] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!product) return;
    setHolderName(product.landing_headline ?? "");
    setJobTitle(product.highlight_1 ?? "");
    setTeamRoleId(product.team_role_id ?? null);
    setAssignedUserId(product.assigned_user_id ?? null);
    setPhone(product.highlight_2 ?? "");
    setEmail(product.highlight_3 ?? "");
    setPhotoUrl(product.hero_image_url ?? "");
    setLinkedinUrl(product.linkedin_url ?? "");
    setWhatsapp(product.whatsapp ?? "");
    setContactFormEnabled(product.contact_form_enabled ?? true);
    setEventTag(product.event_tag ?? "");
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
      contactFormEnabled,
      eventTag: eventTag.trim() || undefined,
    });
  }, [brand, holderName, jobTitle, phone, email, photoUrl, linkedinUrl, whatsapp, contactFormEnabled, eventTag]);

  const preview = landingConfig
    ? {
        ...configToPreview(landingConfig, {
          productType: product?.product_type ?? "NFC Business Card",
          companyName,
          campaignName: companyName,
          productCode: product?.unique_code,
        }),
        brand_website: brand?.brand_website ?? null,
        event_tag: eventTag.trim() || null,
      }
    : null;

  const teamStructure = parseTeamStructure(brand?.team_structure);

  function handleRoleChange(roleId: string | null, roleName: string | null) {
    setTeamRoleId(roleId);
    if (roleName) setJobTitle(roleName);
  }

  async function handleSave() {
    if (!brand || !holderName.trim() || !jobTitle.trim()) {
      setError("Name and job title are required.");
      return;
    }
    setError("");
    await onSave({
      landing: buildNfcCardLanding(brand, {
        holderName,
        jobTitle,
        phone: phone || undefined,
        email: email || undefined,
        photoUrl: photoUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        whatsapp: whatsapp || undefined,
        contactFormEnabled,
        eventTag: eventTag.trim() || undefined,
      }),
      team_role_id: teamRoleId,
      assigned_user_id: userIsAdmin ? assignedUserId : undefined,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper" fullScreen={fullScreen}>
      <DialogTitle>Edit card — {product?.unique_code}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Full name" required fullWidth value={holderName} onChange={(e) => setHolderName(e.target.value)} />
              {userIsAdmin && (
                <AssignedUserSelectField
                  members={members}
                  value={assignedUserId}
                  onChange={setAssignedUserId}
                />
              )}
              {userIsAdmin && (
                <RoleSelectField structure={teamStructure} value={teamRoleId} onChange={handleRoleChange} />
              )}
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
              <FormControlLabel
                control={
                  <Switch
                    checked={contactFormEnabled}
                    onChange={(e) => setContactFormEnabled(e.target.checked)}
                  />
                }
                label="Enable contact form on card"
              />
              <TextField
                label="Default event tag"
                fullWidth
                value={eventTag}
                onChange={(e) => setEventTag(e.target.value)}
                placeholder="feira-sp-2026"
                helperText="Optional. Tracks taps/leads for trade shows. Override with ?event= on the card URL."
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
