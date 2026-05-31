"use client";

import DownloadIcon from "@mui/icons-material/Download";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PercentIcon from "@mui/icons-material/Percent";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import {
  downloadAnalyticsExport,
  type AnalyticsOverview,
  type InteractionEvent,
  type LeadEvent,
} from "@/lib/api";

export default function AnalyticsPage() {
  const { request } = useApi();
  const { firebaseUser } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [interactions, setInteractions] = useState<InteractionEvent[]>([]);
  const [leads, setLeads] = useState<LeadEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewData, events, leadRows] = await Promise.all([
        request<AnalyticsOverview>("/analytics/overview"),
        request<InteractionEvent[]>("/analytics/interactions?limit=25"),
        request<LeadEvent[]>("/leads?limit=25"),
      ]);
      setOverview(overviewData);
      setInteractions(events);
      setLeads(leadRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    setExporting(true);
    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : undefined;
      await downloadAnalyticsExport(token);
    } catch {
      setError("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  }

  const stats = [
    { label: "Total Scans", value: overview?.total_scans ?? 0, icon: QrCodeScannerOutlinedIcon, color: "#8b5cf6" },
    { label: "Total Leads", value: overview?.total_leads ?? 0, icon: PeopleOutlinedIcon, color: "#10b981" },
    { label: "Conversion Rate", value: overview ? `${overview.conversion_rate}%` : "—", icon: PercentIcon, color: "#4f46e5" },
    { label: "Scans Today", value: overview?.scans_today ?? 0, icon: TodayOutlinedIcon, color: "#0ea5e9" },
  ];

  return (
    <Box>
      <PageHeader
        title="Analytics"
        subtitle="Conversion rates, campaign performance, and geographic insights."
        action={
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exporting || loading}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>

      {overview && !loading && <AnalyticsCharts data={overview} />}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ContentCard title="Top Products" noPadding>
            <TableContainer>
              <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Scans</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!overview?.top_products.length ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      {loading ? "Loading…" : "No scans yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.top_products.map((p) => (
                    <TableRow key={p.unique_code}>
                      <TableCell sx={{ fontFamily: "monospace" }}>{p.unique_code}</TableCell>
                      <TableCell>{p.product_type}</TableCell>
                      <TableCell align="right">{p.scan_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </TableContainer>
          </ContentCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ContentCard title="Top Campaigns" noPadding>
            <TableContainer>
              <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Campaign</TableCell>
                  <TableCell align="right">Scans</TableCell>
                  <TableCell align="right">Leads</TableCell>
                  <TableCell align="right">Conv.</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!overview?.top_campaigns.length ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      {loading ? "Loading…" : "No campaign data yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.top_campaigns.map((c) => (
                    <TableRow key={c.campaign_name}>
                      <TableCell>{c.campaign_name}</TableCell>
                      <TableCell align="right">{c.scan_count}</TableCell>
                      <TableCell align="right">{c.lead_count}</TableCell>
                      <TableCell align="right">{c.conversion_rate}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </TableContainer>
          </ContentCard>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <ContentCard title="Recent Scans" noPadding>
        <TableContainer>
          <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Campaign</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {interactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  {loading ? "Loading…" : "Scan a QR code to see interactions here."}
                </TableCell>
              </TableRow>
            ) : (
              interactions.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {event.product_code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {event.product_type}
                    </Typography>
                  </TableCell>
                  <TableCell>{event.campaign_name}</TableCell>
                  <TableCell>{event.device_type ?? "—"}</TableCell>
                  <TableCell>
                    {[event.city, event.country].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </ContentCard>
      </Box>

      <ContentCard title="Recent Leads" noPadding>
        <TableContainer>
          <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Campaign</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  {loading ? "Loading…" : "Leads from landing page forms appear here."}
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.company ?? "—"}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>{lead.product_code}</TableCell>
                  <TableCell>{lead.campaign_name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </ContentCard>
    </Box>
  );
}
