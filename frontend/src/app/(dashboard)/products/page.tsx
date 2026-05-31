"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import NfcIcon from "@mui/icons-material/Nfc";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PrintIcon from "@mui/icons-material/Print";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

import NfcCardEditDialog from "@/components/products/NfcCardEditDialog";
import NfcCardQuickCreate from "@/components/products/NfcCardQuickCreate";
import QrPrintSheet from "@/components/products/QrPrintSheet";
import ContentCard from "@/components/ui/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { Campaign, CompanyBrand, Product } from "@/lib/api";
import { landingConfigToPayload, type LandingPageConfig } from "@/lib/landingTemplates";
import { downloadSvgAsPng } from "@/lib/qrDownload";

export default function TeamCardsPage() {
  const { profile } = useAuth();
  const { request } = useApi();
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [cards, setCards] = useState<Product[]>([]);
  const [companyBrand, setCompanyBrand] = useState<CompanyBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [nfcOpen, setNfcOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const qrPreviewRef = useRef<HTMLDivElement>(null);

  const companyName = profile?.company?.company_name ?? "Your company";
  const brandReady = Boolean(companyBrand?.brand_logo_url || companyBrand?.brand_tagline);

  const loadCards = useCallback(async () => {
    if (!campaignId) {
      setCards([]);
      return;
    }
    const data = await request<Product[]>(`/products?campaign_id=${campaignId}`);
    setCards(data);
  }, [request, campaignId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [camps, brand] = await Promise.all([
          request<Campaign[]>("/campaigns"),
          request<CompanyBrand>("/companies/brand"),
        ]);
        setCompanyBrand(brand);
        if (camps.length > 0) {
          setCampaignId(camps[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [request]);

  useEffect(() => {
    if (campaignId) {
      loadCards().catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load cards")
      );
    }
  }, [campaignId, loadCards]);

  async function handleNfcCreate(payload: {
    product_type: string;
    unique_code?: string;
    landing: LandingPageConfig;
  }) {
    if (!campaignId) return;
    setSaving(true);
    setError("");
    try {
      await request<Product>("/products", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: campaignId,
          product_type: payload.product_type,
          unique_code: payload.unique_code,
          landing: landingConfigToPayload(payload.landing),
        }),
      });
      setNfcOpen(false);
      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create card");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(landing: LandingPageConfig) {
    if (!editProduct) return;
    setSaving(true);
    setError("");
    try {
      await request(`/products/${editProduct.id}/landing`, {
        method: "PUT",
        body: JSON.stringify(landingConfigToPayload(landing)),
      });
      setEditProduct(null);
      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save card");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(card: Product) {
    const name = card.landing_headline || card.unique_code;
    if (!confirm(`Remove card for ${name}?`)) return;
    try {
      await request(`/products/${card.id}`, { method: "DELETE" });
      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleStatusChange(card: Product, status: Product["status"]) {
    if (card.status === status) return;
    try {
      await request(`/products/${card.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  function downloadSingleQr() {
    const svg = qrPreviewRef.current?.querySelector("svg");
    if (!svg || !qrProduct) return;
    downloadSvgAsPng(svg, `${qrProduct.unique_code}-nfc-card.png`);
  }

  return (
    <Box>
      <PageHeader
        title="Business cards"
        subtitle="Digital identity for every team member — NFC tap, QR share, lead capture, and profile links."
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              disabled={cards.length === 0}
              onClick={() => setQrSheetOpen(true)}
            >
              Print QR sheet
            </Button>
            <Button
              variant="contained"
              startIcon={<NfcIcon />}
              disabled={!campaignId}
              onClick={() => setNfcOpen(true)}
            >
              Add team member
            </Button>
          </Box>
        }
      />

      {!brandReady && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Set up your company look first in{" "}
          <Link href="/settings">Brand kit</Link> — logo, colors and default links apply to every card.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <ContentCard noPadding>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">Loading team cards…</Typography>
          </Box>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={NfcIcon}
            title="No cards yet"
            description="Add your first team member to generate a digital NFC business card with tap-to-call, email and booking links."
            action={
              <Button variant="contained" startIcon={<NfcIcon />} onClick={() => setNfcOpen(true)}>
                Add team member
              </Button>
            }
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Card link</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {card.landing_headline || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                        {card.unique_code}
                      </Typography>
                    </TableCell>
                    <TableCell>{card.highlight_1 || "—"}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                          {card.qr_url}
                        </Typography>
                        {card.qr_url && (
                          <>
                            <IconButton size="small" onClick={() => copyUrl(card.qr_url!)}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" component="a" href={card.qr_url!} target="_blank">
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={card.status}
                        onChange={(e) => handleStatusChange(card, e.target.value as Product["status"])}
                        sx={{ minWidth: 110, textTransform: "capitalize" }}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="archived">Archived</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton aria-label="edit" size="small" onClick={() => setEditProduct(card)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="qr" size="small" onClick={() => setQrProduct(card)}>
                        <QrCode2Icon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="delete" size="small" onClick={() => handleDelete(card)}>
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </ContentCard>

      <Dialog open={!!qrProduct} onClose={() => setQrProduct(null)} maxWidth="xs" fullWidth>
        <DialogTitle>NFC / QR — {qrProduct?.landing_headline || qrProduct?.unique_code}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {qrProduct?.qr_url && (
            <>
              <Box ref={qrPreviewRef} sx={{ p: 2, bgcolor: "white", borderRadius: 1 }}>
                <QRCode value={qrProduct.qr_url} size={200} />
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                Program this URL on your NFC tag or print the QR code.
              </Typography>
              <Chip label={qrProduct.qr_url} size="small" sx={{ maxWidth: "100%" }} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrProduct(null)}>Close</Button>
          <Button startIcon={<DownloadIcon />} onClick={downloadSingleQr} disabled={!qrProduct?.qr_url}>
            Download PNG
          </Button>
        </DialogActions>
      </Dialog>

      <QrPrintSheet open={qrSheetOpen} onClose={() => setQrSheetOpen(false)} products={cards} campaignName={companyName} />

      <NfcCardQuickCreate
        open={nfcOpen}
        onClose={() => setNfcOpen(false)}
        onCreate={handleNfcCreate}
        brand={companyBrand}
        companyName={companyName}
        campaignName={companyName}
        saving={saving}
      />

      <NfcCardEditDialog
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        product={editProduct}
        brand={companyBrand}
        companyName={companyName}
        onSave={handleEditSave}
        saving={saving}
      />
    </Box>
  );
}
