"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { ChangeEvent, useEffect, useState } from "react";

import ImageCropDialog from "@/components/ui/ImageCropDialog";
import { resizeImageFile } from "@/lib/resizeImage";

type ImageUploadFieldProps = {
  label?: string;
  helperText?: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
  previewVariant?: "avatar" | "banner";
};

export default function ImageUploadField({
  label = "Photo",
  helperText = "JPG, PNG or WebP — max 2 MB",
  value,
  onChange,
  onUpload,
  disabled = false,
  previewVariant = "avatar",
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  function clearPending() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
    setPendingFile(null);
  }

  async function uploadFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const resized = await resizeImageFile(file);
      const url = await onUpload(resized);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (previewVariant === "avatar") {
      clearPending();
      setPendingFile(file);
      setPendingPreview(URL.createObjectURL(file));
      setCropOpen(true);
      return;
    }

    await uploadFile(file);
  }

  async function handleCropConfirm(croppedFile: File) {
    setCropOpen(false);
    clearPending();
    await uploadFile(croppedFile);
  }

  function handleCropCancel() {
    setCropOpen(false);
    clearPending();
  }

  function handleCropError(message: string) {
    setCropOpen(false);
    clearPending();
    setError(message);
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {label}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        {value ? (
          previewVariant === "avatar" ? (
            <Avatar src={value} alt="" sx={{ width: 72, height: 72 }} />
          ) : (
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          )
        ) : (
          <Avatar sx={{ width: 72, height: 72, bgcolor: "action.hover", color: "text.secondary" }}>
            <PhotoCameraOutlinedIcon />
          </Avatar>
        )}

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="outlined"
            component="label"
            disabled={disabled || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <PhotoCameraOutlinedIcon />}
            sx={{ minHeight: 44 }}
          >
            {uploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
          </Button>
          {value && (
            <Button
              variant="text"
              color="inherit"
              disabled={disabled || uploading}
              startIcon={<DeleteOutlineOutlinedIcon />}
              onClick={() => onChange("")}
              sx={{ minHeight: 44 }}
            >
              Remove
            </Button>
          )}
        </Box>
      </Box>

      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {helperText}
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <ImageCropDialog
        open={cropOpen}
        imageSrc={pendingPreview}
        fileName={pendingFile?.name ?? "photo.jpg"}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
        onError={handleCropError}
      />
    </Box>
  );
}
