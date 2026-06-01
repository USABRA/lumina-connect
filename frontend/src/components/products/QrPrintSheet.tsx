"use client";

import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import QRCode from "react-qr-code";

import { useFullScreenDialog } from "@/hooks/useFullScreenDialog";

import { printQrSheet } from "@/lib/qrDownload";
import type { Product } from "@/lib/api";

type QrPrintSheetProps = {
  open: boolean;
  onClose: () => void;
  products: Product[];
  campaignName: string;
};

export default function QrPrintSheet({ open, onClose, products, campaignName }: QrPrintSheetProps) {
  const fullScreen = useFullScreenDialog();
  const printable = products.filter((p) => p.qr_url && p.status === "active");

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper" fullScreen={fullScreen}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        QR sheet — {campaignName}
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {printable.length === 0 ? (
          <Typography color="text.secondary">No active products with QR URLs in this campaign.</Typography>
        ) : (
          <Box
            id="qr-print-sheet"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
              gap: 3,
              "@media print": {
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 2,
              },
            }}
          >
            {printable.map((product) => (
              <Box
                key={product.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2,
                  textAlign: "center",
                  breakInside: "avoid",
                  bgcolor: "background.paper",
                }}
              >
                <Box sx={{ display: "inline-block", p: 1.5, bgcolor: "white", borderRadius: 1, mb: 1 }}>
                  <QRCode value={product.qr_url!} size={140} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {product.unique_code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.product_type}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {product.qr_url}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          disabled={printable.length === 0}
          onClick={printQrSheet}
        >
          Print / Save PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
