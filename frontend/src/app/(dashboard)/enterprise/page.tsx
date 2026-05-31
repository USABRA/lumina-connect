"use client";

import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import TapAndPlayOutlinedIcon from "@mui/icons-material/TapAndPlayOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { AnalyticsOverview, DashboardStats } from "@/lib/api";

export default function EnterprisePage() {
  const { profile } = useAuth();
  const { request } = useApi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, overviewData] = await Promise.all([
        request<DashboardStats>("/products/stats/dashboard"),
        request<AnalyticsOverview>("/analytics/overview"),
      ]);
      setStats(dash);
      setOverview(overviewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enterprise metrics");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  const company = profile?.company?.company_name ?? "Your company";

  return (
    <Box>
      <PageHeader
        title="Enterprise"
        subtitle={`Company-wide networking intelligence for ${company}.`}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total Employees (cards)" value={stats?.products_tracked ?? 0} icon={GroupsOutlinedIcon} color="#6366f1" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total Interactions" value={stats?.total_interactions ?? 0} icon={TapAndPlayOutlinedIcon} color="#0ea5e9" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total Leads" value={stats?.leads_captured ?? 0} icon={PeopleOutlinedIcon} color="#10b981" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Meetings Scheduled" value="—" icon={TrendingUpOutlinedIcon} color="#f59e0b" loading={loading} hint="Connect Calendly" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Conversion Rate" value={stats ? `${stats.conversion_rate}%` : "—"} icon={TrendingUpOutlinedIcon} color="#8b5cf6" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Unique Visitors" value={stats?.unique_visitors ?? 0} icon={GroupsOutlinedIcon} color="#14b8a6" loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ContentCard title="Top Performers" noPadding>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Card</TableCell>
                    <TableCell align="right">Taps</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!overview?.top_products.length ? (
                    <TableRow>
                      <TableCell colSpan={2}>{loading ? "Loading…" : "No card activity yet."}</TableCell>
                    </TableRow>
                  ) : (
                    overview.top_products.slice(0, 8).map((p) => (
                      <TableRow key={p.unique_code}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>{p.unique_code}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.product_type}</Typography>
                        </TableCell>
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
          <ContentCard title="Lead Sources by Team" noPadding>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Team</TableCell>
                    <TableCell align="right">Leads</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!overview?.leads_by_campaign.length ? (
                    <TableRow>
                      <TableCell colSpan={2}>{loading ? "Loading…" : "No leads captured yet."}</TableCell>
                    </TableRow>
                  ) : (
                    overview.leads_by_campaign.map((row) => (
                      <TableRow key={row.campaign_name}>
                        <TableCell>{row.campaign_name}</TableCell>
                        <TableCell align="right">{row.lead_count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </ContentCard>
        </Grid>
      </Grid>
    </Box>
  );
}
