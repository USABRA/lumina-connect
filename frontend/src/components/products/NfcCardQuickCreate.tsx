"use client";

import NfcIcon from "@mui/icons-material/Nfc";
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
import Link from "next/link";
import { useMemo, useState } from "react";

import LandingPreview from "@/components/landing/LandingPreview";
import ImageUploadField from "@/components/ui/ImageUploadField";
import AssignedUserSelectField from "@/components/products/AssignedUserSelectField";
import RoleSelectField from "@/components/products/RoleSelectField";
import type { CompanyBrand, CompanyMember, TeamStructure } from "@/lib/api";
import { buildNfcCardLanding, NFC_PRODUCT_TYPE } from "@/lib/nfcCard";
import { configToPreview, type LandingPageConfig } from "@/lib/landingTemplates";
import { parseTeamStructure } from "@/lib/teamStructure";
import { useApi } from "@/hooks/useApi";

type NfcCardQuickCreateProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    product_type: string;
    unique_code?: string;
    team_role_id?: string | null;
    assigned_user_id?: number | null;
    landing: LandingPageConfig;
  }) => Promise<void>;
  members: CompanyMember[];
  brand: CompanyBrand | null;
  companyName: string;
  campaignName: string;
  saving?: boolean;
};

export default function NfcCardQuickCreate({
  open,
  onClose,
  onCreate,
  members,
  brand,
  companyName,
  campaignName,
  saving = false,
}: NfcCardQuickCreateProps) {
  const { uploadImage } = useApi();
  const [holderName, setHolderName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [teamRoleId, setTeamRoleId] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [contactFormEnabled, setContactFormEnabled] = useState(true);
  const [error, setError] = useState("");

  const brandReady = Boolean(brand?.company_name);
  const teamStructure: TeamStructure = parseTeamStructure(brand?.team_structure);

  function handleRoleChange(roleId: string | null, roleName: string | null) {
    setTeamRoleId(roleId);
    if (roleName) setJobTitle(roleName);
  }

  const landingConfig = useMemo(() => {
    if (!brand) return null;
    return buildNfcCardLanding(brand, {
      holderName: holderName || "Your Name",
      jobTitle: jobTitle || "Job title",
      phone: phone || undefined,
      email: email || undefined,
      photoUrl: photoUrl || undefined,
      linkedinUrl: linkedinUrl || undefined,
      whatsapp: whatsapp || undefined,
      contactFormEnabled,
    });
  }, [brand, holderName, jobTitle, phone, email, photoUrl, linkedinUrl, whatsapp, contactFormEnabled]);

  const preview = landingConfig
    ? {
        ...configToPreview(landingConfig, {
          productType: NFC_PRODUCT_TYPE,
          companyName,
          campaignName,
          productCode: customCode || "PREVIEW",
        }),
        brand_website: brand?.brand_website ?? null,
      }
    : null;

  async function handleSubmit() {
    if (!brand || !holderName.trim() || !jobTitle.trim()) {
      setError("Name and job title are required.");
      return;
    }
    setError("");
    const landing = buildNfcCardLanding(brand, {
      holderName,
      jobTitle,
      phone: phone || undefined,
      email: email || undefined,
      photoUrl: photoUrl || undefined,
      linkedinUrl: linkedinUrl || undefined,
      whatsapp: whatsapp || undefined,
      contactFormEnabled,
    });
    await onCreate({
      product_type: NFC_PRODUCT_TYPE,
      unique_code: customCode.trim() || undefined,
      team_role_id: teamRoleId,
      assigned_user_id: assignedUserId,
      landing,
    });
    setHolderName("");
    setJobTitle("");
    setTeamRoleId(null);
    setAssignedUserId(null);
    setPhone("");
    setEmail("");
    setPhotoUrl("");
    setLinkedinUrl("");
    setWhatsapp("");
    setCustomCode("");
    setContactFormEnabled(true);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <NfcIcon color="primary" />
        New team member card
      </DialogTitle>
      <DialogContent dividers>
        {!brandReady ? (
          <Alert severity="warning">
            Set up your <Link href="/settings">Brand kit</Link> first — logo, color and default links.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                Card holder
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Full name"
                  required
                  fullWidth
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="Maria Silva"
                />
                <AssignedUserSelectField
                  members={members}
                  value={assignedUserId}
                  onChange={setAssignedUserId}
                />
                <RoleSelectField structure={teamStructure} value={teamRoleId} onChange={handleRoleChange} />
                <TextField
                  label="Job title"
                  required
                  fullWidth
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Sales Director"
                  helperText="Auto-filled from role — you can edit anytime"
                />
                <TextField
                  label="Phone (optional)"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={brand?.brand_phone || "+1 555 000 0000"}
                />
                <TextField
                  label="Email (optional)"
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <ImageUploadField
                  label="Profile photo (optional)"
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  onUpload={uploadImage}
                  helperText="Shown on the NFC card. JPG, PNG or WebP."
                />
                <TextField
                  label="LinkedIn (optional)"
                  fullWidth
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/username"
                />
                <TextField
                  label="WhatsApp (optional)"
                  fullWidth
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+1 555 000 0000"
                />
                <TextField
                  label="Custom code (optional)"
                  fullWidth
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  helperText="Leave blank to auto-generate"
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
              </Box>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                Live preview
              </Typography>
              {preview && <LandingPreview product={preview} compact preview />}
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!brandReady || saving || !holderName.trim() || !jobTitle.trim()}
        >
          {saving ? "Creating…" : "Create & publish card"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
