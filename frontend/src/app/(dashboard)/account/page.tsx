"use client";

import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChangeEvent, useEffect, useState } from "react";

import UserAvatar from "@/components/UserAvatar";
import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { APP_NAME } from "@/lib/branding";
import type { UserProfile } from "@/lib/api";

const MAX_AVATAR_BYTES = 500_000;

export default function AccountPage() {
  const { profile, logout, refreshProfile } = useAuth();
  const { request } = useApi();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.user.name);
      setAvatarUrl(profile.user.avatar_url ?? null);
    }
  }, [profile]);

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await request<UserProfile>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          avatar_url: avatarUrl,
        }),
      });
      await refreshProfile();
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Image must be smaller than 500 KB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  if (!profile) {
    return (
      <Box>
        <PageHeader title="Account" subtitle="Loading profile…" />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Account"
        subtitle="Manage your name, photo, and session."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <ContentCard title="Profile">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
            <UserAvatar name={name || profile.user.name} avatarUrl={avatarUrl} size={72} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {name || profile.user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.user.email}
              </Typography>
              {profile.company && (
                <Typography variant="caption" color="text.secondary">
                  {profile.company.company_name}
                </Typography>
              )}
            </Box>
          </Box>

          <TextField
            label="Display name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            label="Email"
            fullWidth
            value={profile.user.email}
            disabled
            helperText="Email is managed by your login provider."
          />

          <TextField
            label="Photo URL"
            fullWidth
            value={avatarUrl ?? ""}
            onChange={(e) => setAvatarUrl(e.target.value || null)}
            placeholder="https://…"
            helperText="Paste an image URL or upload a photo below."
          />

          <Box>
            <Button variant="outlined" component="label" startIcon={<PhotoCameraOutlinedIcon />} sx={{ minHeight: 44 }}>
              Upload photo
              <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            </Button>
            {avatarUrl && (
              <Button
                variant="text"
                color="inherit"
                sx={{ ml: 1 }}
                onClick={() => setAvatarUrl(null)}
              >
                Remove photo
              </Button>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button variant="contained" onClick={handleSave} disabled={saving || !name.trim()} sx={{ minHeight: 44 }}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </Box>
        </Box>
      </ContentCard>

      <Box sx={{ mt: 3 }}>
        <ContentCard title="Session">
          <Box sx={{ p: 2.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sign out of {APP_NAME} on this device.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutOutlinedIcon />}
              onClick={() => logout()}
            >
              Log out
            </Button>
          </Box>
        </ContentCard>
      </Box>
    </Box>
  );
}
