"use client";

import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";

import LandingPageBuilder from "@/components/landing/LandingPageBuilder";
import QrPrintSheet from "@/components/products/QrPrintSheet";
import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { Campaign, Product } from "@/lib/api";
import {
  buildLandingFromTemplate,
  DEFAULT_LANDING_CONFIG,
  landingConfigToPayload,
  productToLandingConfig,
  type LandingPageConfig,
} from "@/lib/landingTemplates";
import { downloadSvgAsPng } from "@/lib/qrDownload";

const CREATE_STEPS = ["Product", "Landing page"];

export default function ProductsPage() {
  const { profile } = useAuth();
  const { request } = useApi();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [landingProduct, setLandingProduct] = useState<Product | null>(null);
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [form, setForm] = useState({ product_type: "", unique_code: "" });
  const [saving, setSaving] = useState(false);
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const qrPreviewRef = useRef<HTMLDivElement>(null);

  const companyName = profile?.company?.company_name ?? "Your company";
  const selectedCampaignName =
    campaigns.find((c) => c.id === selectedCampaign)?.name ?? "Campaign";

  const builderContext = useMemo(
    () => ({
      productType: form.product_type || productTypes[0] || "Product",
      companyName,
      campaignName: landingProduct
        ? campaigns.find((c) => c.id === landingProduct.campaign_id)?.name ?? selectedCampaignName
        : selectedCampaignName,
      productCode: landingProduct?.unique_code,
    }),
    [form.product_type, productTypes, companyName, selectedCampaignName, landingProduct, campaigns]
  );

  const loadCampaigns = useCallback(async () => {
    return request<Campaign[]>("/campaigns");
  }, [request]);

  const loadProducts = useCallback(async () => {
    if (!selectedCampaign) {
      setProducts([]);
      return;
    }
    const data = await request<Product[]>(`/products?campaign_id=${selectedCampaign}`);
    setProducts(data);
  }, [request, selectedCampaign]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [types, camps] = await Promise.all([
          request<string[]>("/products/types"),
          loadCampaigns(),
        ]);
        setProductTypes(types);
        setCampaigns(camps);
        if (camps.length > 0) {
          setSelectedCampaign((prev) => prev || camps[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [request, loadCampaigns]);

  useEffect(() => {
    if (selectedCampaign) {
      loadProducts().catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load products")
      );
    }
  }, [selectedCampaign, loadProducts]);

  function openCreateDialog() {
    const type = productTypes[0] ?? "";
    setForm({ product_type: type, unique_code: "" });
    setCreateStep(0);
    setLandingConfig(
      buildLandingFromTemplate("showcase", {
        productType: type,
        companyName,
        campaignName: selectedCampaignName,
      })
    );
    setCreateOpen(true);
  }

  function goToLandingStep() {
    if (!form.product_type) return;
    setLandingConfig((prev) =>
      buildLandingFromTemplate(prev.landing_template, {
        productType: form.product_type,
        companyName,
        campaignName: selectedCampaignName,
      }, prev)
    );
    setCreateStep(1);
  }

  async function handleCreate() {
    if (!selectedCampaign) return;
    setSaving(true);
    setError("");
    try {
      await request<Product>("/products", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: selectedCampaign,
          product_type: form.product_type,
          unique_code: form.unique_code || undefined,
          landing: landingConfigToPayload(landingConfig),
        }),
      });
      setCreateOpen(false);
      setCreateStep(0);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete product ${product.unique_code}?`)) return;
    try {
      await request(`/products/${product.id}`, { method: "DELETE" });
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  function openLandingEditor(product: Product) {
    setLandingProduct(product);
    setLandingConfig(productToLandingConfig(product));
  }

  async function handleSaveLanding() {
    if (!landingProduct) return;
    setSaving(true);
    setError("");
    try {
      await request(`/products/${landingProduct.id}/landing`, {
        method: "PUT",
        body: JSON.stringify(landingConfigToPayload(landingConfig)),
      });
      setLandingProduct(null);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save landing page");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(product: Product, status: Product["status"]) {
    if (product.status === status) return;
    setError("");
    try {
      await request(`/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  function downloadSingleQr() {
    const svg = qrPreviewRef.current?.querySelector("svg");
    if (!svg || !qrProduct) return;
    downloadSvgAsPng(svg, `${qrProduct.unique_code}-qr.png`);
  }

  return (
    <Box>
      <PageHeader
        title="Products & QR"
        subtitle="Create products with auto-generated landing pages — pick a layout, customize, and publish."
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              disabled={!selectedCampaign || products.length === 0}
              onClick={() => setQrSheetOpen(true)}
            >
              QR sheet
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!selectedCampaign}
              onClick={openCreateDialog}
            >
              New product
            </Button>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2.5, maxWidth: 400 }}>
        <InputLabel>Campaign</InputLabel>
        <Select
          value={selectedCampaign}
          label="Campaign"
          onChange={(e) => setSelectedCampaign(e.target.value as number)}
        >
          {campaigns.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <ContentCard noPadding>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Landing</TableCell>
                <TableCell>Landing URL</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>Loading…</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    {campaigns.length === 0
                      ? "Create a campaign first."
                      : "No products in this campaign yet."}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                      {product.unique_code}
                    </TableCell>
                    <TableCell>{product.product_type}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.landing_template?.replace("_", " ") ?? "classic"}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                          {product.qr_url}
                        </Typography>
                        {product.qr_url && (
                          <>
                            <IconButton size="small" onClick={() => copyUrl(product.qr_url!)}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              component="a"
                              href={product.qr_url!}
                              target="_blank"
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={product.status}
                        onChange={(e) =>
                          handleStatusChange(product, e.target.value as Product["status"])
                        }
                        sx={{ minWidth: 110, textTransform: "capitalize" }}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="archived">Archived</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="edit landing"
                        size="small"
                        onClick={() => openLandingEditor(product)}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="qr" size="small" onClick={() => setQrProduct(product)}>
                        <QrCode2Icon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="delete" size="small" onClick={() => handleDelete(product)}>
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </ContentCard>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="lg"
        scroll="paper"
      >
        <DialogTitle>Create product & landing page</DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={createStep} alternativeLabel sx={{ mb: 3 }}>
            {CREATE_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {createStep === 0 ? (
            <Box sx={{ maxWidth: 480 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Basic product info for QR tracking. Next step: choose a landing page layout.
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Product type</InputLabel>
                <Select
                  value={form.product_type}
                  label="Product type"
                  onChange={(e) => setForm({ ...form, product_type: e.target.value })}
                >
                  {productTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Custom code (optional)"
                fullWidth
                margin="normal"
                helperText="Leave blank to auto-generate a unique code"
                value={form.unique_code}
                onChange={(e) => setForm({ ...form, unique_code: e.target.value.toUpperCase() })}
              />
            </Box>
          ) : (
            <LandingPageBuilder
              value={landingConfig}
              onChange={setLandingConfig}
              context={{
                productType: form.product_type,
                companyName,
                campaignName: selectedCampaignName,
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          {createStep === 1 && (
            <Button onClick={() => setCreateStep(0)}>Back</Button>
          )}
          {createStep === 0 ? (
            <Button variant="contained" onClick={goToLandingStep} disabled={!form.product_type}>
              Next: design landing
            </Button>
          ) : (
            <Button variant="contained" onClick={handleCreate} disabled={saving}>
              {saving ? "Creating…" : "Create product & publish page"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!landingProduct}
        onClose={() => setLandingProduct(null)}
        fullWidth
        maxWidth="lg"
        scroll="paper"
      >
        <DialogTitle>Edit landing page — {landingProduct?.unique_code}</DialogTitle>
        <DialogContent dividers>
          <LandingPageBuilder
            value={landingConfig}
            onChange={setLandingConfig}
            context={builderContext}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setLandingProduct(null)}>Cancel</Button>
          {landingProduct?.qr_url && (
            <Button component="a" href={landingProduct.qr_url} target="_blank">
              Open live page
            </Button>
          )}
          <Button variant="contained" onClick={handleSaveLanding} disabled={saving}>
            {saving ? "Saving…" : "Save landing page"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!qrProduct} onClose={() => setQrProduct(null)} maxWidth="xs" fullWidth>
        <DialogTitle>QR Code — {qrProduct?.unique_code}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {qrProduct?.qr_url && (
            <>
              <Box ref={qrPreviewRef} sx={{ p: 2, bgcolor: "white", borderRadius: 1 }}>
                <QRCode value={qrProduct.qr_url} size={200} />
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                {qrProduct.qr_url}
              </Typography>
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

      <QrPrintSheet
        open={qrSheetOpen}
        onClose={() => setQrSheetOpen(false)}
        products={products}
        campaignName={selectedCampaignName}
      />
    </Box>
  );
}
