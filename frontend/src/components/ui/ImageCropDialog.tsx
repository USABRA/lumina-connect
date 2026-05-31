"use client";

import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { getCroppedImageFile } from "@/lib/cropImage";

type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  fileName: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
};

export default function ImageCropDialog({
  open,
  imageSrc,
  fileName,
  onConfirm,
  onCancel,
  onError,
}: ImageCropDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setProcessing(false);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName);
      onConfirm(file);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not crop image.");
      setProcessing(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={processing ? undefined : onCancel}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Adjust photo</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag to position your photo. Use the slider to zoom. The circle shows how it will appear on
          your card.
        </Typography>

        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: { xs: 280, sm: 360 },
            bgcolor: "grey.900",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2.5, px: 0.5 }}>
          <ZoomInOutlinedIcon fontSize="small" color="action" aria-hidden />
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            onChange={(_, value) => setZoom(value as number)}
            aria-label="Zoom"
            sx={{ flex: 1 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={processing || !croppedAreaPixels}
          startIcon={processing ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {processing ? "Processing…" : "Use photo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
