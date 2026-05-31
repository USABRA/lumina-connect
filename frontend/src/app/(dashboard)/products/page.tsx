"use client";

import DownloadIcon from "@mui/icons-material/Download";
import NfcIcon from "@mui/icons-material/Nfc";
import PrintIcon from "@mui/icons-material/Print";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

import CardsByRoleView from "@/components/products/CardsByRoleView";
import NfcCardEditDialog from "@/components/products/NfcCardEditDialog";
import NfcCardQuickCreate from "@/components/products/NfcCardQuickCreate";
import QrPrintSheet from "@/components/products/QrPrintSheet";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { Campaign, CompanyBrand, CompanyMember, Product } from "@/lib/api";
import { isAdmin } from "@/lib/permissions";
import { landingConfigToPayload, type LandingPageConfig } from "@/lib/landingTemplates";
import { parseTeamStructure } from "@/lib/teamStructure";
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
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const qrPreviewRef = useRef<HTMLDivElement>(null);

  const userIsAdmin = isAdmin(profile?.user.role);
  const companyName = profile?.company?.company_name ?? "Your company";
  const brandReady = Boolean(companyBrand?.brand_logo_url || companyBrand?.brand_tagline);
  const teamStructure = parseTeamStructure(companyBrand?.team_structure);
  const hasTeamStructure = teamStructure.groups.length > 0 || teamStructure.roles.length > 0;

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
        const [camps, brand, membersList] = await Promise.all([
          request<Campaign[]>("/campaigns"),
          request<CompanyBrand>("/companies/brand"),
          userIsAdmin
            ? request<CompanyMember[]>("/companies/members")
            : Promise.resolve([] as CompanyMember[]),
        ]);
        setCompanyBrand(brand);
        setMembers(membersList);
        if (camps.length > 0) {
          setCampaignId(camps[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [request, userIsAdmin]);

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
    team_role_id?: string | null;
    assigned_user_id?: number | null;
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
          team_role_id: payload.team_role_id ?? null,
          assigned_user_id: payload.assigned_user_id ?? null,
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

  async function handleEditSave(payload: {
    landing: LandingPageConfig;
    team_role_id: string | null;
    assigned_user_id?: number | null;
  }) {
    if (!editProduct) return;
    setSaving(true);
    setError("");
    try {
      await request(`/products/${editProduct.id}/landing`, {
        method: "PUT",
        body: JSON.stringify(landingConfigToPayload(payload.landing)),
      });
      if (userIsAdmin) {
        const productUpdate: Record<string, unknown> = { team_role_id: payload.team_role_id };
        if ("assigned_user_id" in payload) {
          productUpdate.assigned_user_id = payload.assigned_user_id ?? null;
        }
        await request(`/products/${editProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(productUpdate),
        });
      }
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

  async function handleRoleChange(card: Product, roleId: string | null) {
    if (card.team_role_id === roleId) return;
    try {
      await request(`/products/${card.id}`, {
        method: "PUT",
        body: JSON.stringify({ team_role_id: roleId }),
      });
      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
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
        subtitle={
          userIsAdmin
            ? "Digital identity for every team member — NFC tap, QR share, lead capture, and profile links."
            : "Your digital business card — edit your profile, share your link, and track your leads."
        }
        action={
          userIsAdmin ? (
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
          ) : undefined
        }
      />

      {!brandReady && userIsAdmin && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Set up your company look first in{" "}
          <Link href="/settings">Brand kit</Link> — logo, colors and default links apply to every card.
        </Alert>
      )}

      {!userIsAdmin && cards.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          You do not have a business card assigned yet. Ask your company admin to create one and assign it to you.
        </Alert>
      )}

      {!hasTeamStructure && userIsAdmin && cards.length > 0 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Organize cards by cargo in{" "}
          <Link href="/team">Team organization</Link> — create departments and roles however you want.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">Loading team cards…</Typography>
        </Box>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={NfcIcon}
          title={userIsAdmin ? "No cards yet" : "No card assigned"}
          description={
            userIsAdmin
              ? "Add your first team member to generate a digital NFC business card with tap-to-call, email and booking links."
              : "Your admin can create a card and assign it to your account."
          }
          action={
            userIsAdmin ? (
              <Button variant="contained" startIcon={<NfcIcon />} onClick={() => setNfcOpen(true)}>
                Add team member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <CardsByRoleView
          cards={cards}
          structure={teamStructure}
          canManage={userIsAdmin}
          members={members}
          onEdit={setEditProduct}
          onQr={setQrProduct}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onRoleChange={handleRoleChange}
          copyUrl={copyUrl}
        />
      )}

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
        members={members}
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
        members={members}
        userRole={profile?.user.role}
        onSave={handleEditSave}
        saving={saving}
      />
    </Box>
  );
}
