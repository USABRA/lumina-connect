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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";

import UnifiedAnalyticsChart from "@/components/analytics/UnifiedAnalyticsChart";
import RoleBadge from "@/components/team/RoleBadge";
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
import { parseTeamStructure } from "@/lib/teamStructure";

export default function AnalyticsPage() {
  const { request } = useApi();
  const { getAccessToken, profile } = useAuth();
  const teamStructure = parseTeamStructure(profile?.company?.team_structure);
  const hasTeamStructure = teamStructure.groups.length > 0 || teamStructure.roles.length > 0;
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [interactions, setInteractions] = useState<InteractionEvent[]>([]);
  const [leads, setLeads] = useState<LeadEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [filterRoleId, setFilterRoleId] = useState<string | null>(null);
  const [filterEventTag, setFilterEventTag] = useState("");
  const [days, setDays] = useState(30);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    if (filterRoleId) params.set("role_id", filterRoleId);
    else if (filterGroupId) params.set("group_id", filterGroupId);
    const eventTag = filterEventTag.trim();
    if (eventTag) params.set("event_tag", eventTag);
    return `?${params.toString()}`;
  }, [filterGroupId, filterRoleId, filterEventTag, days]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewData, events, leadRows] = await Promise.all([
        request<AnalyticsOverview>(`/analytics/overview${filterQuery}`),
        request<InteractionEvent[]>(`/analytics/interactions?limit=25${filterQuery ? filterQuery.replace("?", "&") : ""}`),
        request<LeadEvent[]>(`/leads?limit=25${filterQuery ? filterQuery.replace("?", "&") : ""}`),
      ]);
      setOverview(overviewData);
      setInteractions(events);
      setLeads(leadRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [request, filterQuery]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    setExporting(true);
    try {
      const token = await getAccessToken();
      await downloadAnalyticsExport(token);
    } catch {
      setError("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  }

  const stats = [
    { label: "Total Card Taps", value: overview?.total_scans ?? 0, icon: QrCodeScannerOutlinedIcon, color: "#0ea5e9" },
    { label: "Leads Captured", value: overview?.total_leads ?? 0, icon: PeopleOutlinedIcon, color: "#10b981" },
    { label: "Conversion Rate", value: overview ? `${overview.conversion_rate}%` : "—", icon: PercentIcon, color: "#6366f1" },
    { label: "Taps Today", value: overview?.scans_today ?? 0, icon: TodayOutlinedIcon, color: "#8b5cf6" },
  ];

  return (
    <Box>
      <PageHeader
        title="Analytics"
        subtitle="Card taps, geographic insights, lead capture, and conversion across your team's business cards."
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

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2, alignItems: "center" }}>
        <TextField
          size="small"
          label="Event tag"
          placeholder="feira-sp-2026"
          value={filterEventTag}
          onChange={(e) => setFilterEventTag(e.target.value)}
          sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" }, minWidth: { xs: 0, sm: 220 } }}
        />
      </Box>

      {overview && (
        <Box sx={{ mb: 3 }}>
          <UnifiedAnalyticsChart
            data={overview}
            days={days}
            onDaysChange={setDays}
            loading={loading}
            hasTeamStructure={hasTeamStructure}
            teamStructure={teamStructure}
            filterGroupId={filterGroupId}
            filterRoleId={filterRoleId}
            onGroupChange={setFilterGroupId}
            onRoleChange={setFilterRoleId}
          />
        </Box>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ContentCard title="Top Business Cards" noPadding>
            <TableContainer>
              <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Taps</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!overview?.top_products.length ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      {loading ? "Loading…" : "No taps yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.top_products.map((p) => (
                    <TableRow key={p.unique_code}>
                      <TableCell sx={{ fontFamily: "monospace" }}>{p.unique_code}</TableCell>
                      <TableCell>{p.product_type}</TableCell>
                      <TableCell>
                        <RoleBadge roleName={p.team_role_name} groupName={p.team_group_name} />
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
          <ContentCard title={hasTeamStructure ? "Top Roles" : "Top Teams"} noPadding>
            <TableContainer>
              <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{hasTeamStructure ? "Role" : "Team"}</TableCell>
                  <TableCell align="right">Taps</TableCell>
                  <TableCell align="right">Leads</TableCell>
                  <TableCell align="right">Conv.</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hasTeamStructure ? (
                  !overview?.top_roles.length ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        {loading ? "Loading…" : "No role data yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    overview.top_roles.map((r) => (
                      <TableRow key={r.role_id ?? r.role_name}>
                        <TableCell>
                          {r.role_name}
                          {r.group_name && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              {r.group_name}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{r.scan_count}</TableCell>
                        <TableCell align="right">{r.lead_count}</TableCell>
                        <TableCell align="right">{r.conversion_rate}%</TableCell>
                      </TableRow>
                    ))
                  )
                ) : !overview?.top_campaigns.length ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      {loading ? "Loading…" : "No team data yet."}
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

      {(overview?.top_events?.length ?? 0) > 0 && (
        <Box sx={{ mb: 3 }}>
          <ContentCard title="Performance by event" noPadding>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell align="right">Taps</TableCell>
                    <TableCell align="right">Leads</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overview!.top_events!.map((row) => (
                    <TableRow key={row.event_tag}>
                      <TableCell sx={{ fontFamily: "monospace" }}>{row.event_tag}</TableCell>
                      <TableCell align="right">{row.scan_count}</TableCell>
                      <TableCell align="right">{row.lead_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ContentCard>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <ContentCard title="Recent Taps" noPadding>
        <TableContainer>
          <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Card</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {interactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  {loading ? "Loading…" : "Tap a card to see interaction history here."}
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
                  <TableCell>
                    <RoleBadge roleName={event.team_role_name} groupName={event.team_group_name} />
                  </TableCell>
                  <TableCell>{event.campaign_name}</TableCell>
                  <TableCell>{event.event_tag ?? "—"}</TableCell>
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
              <TableCell>Card</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Event</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  {loading ? "Loading…" : "Leads from card contact forms appear here."}
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.company ?? "—"}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>{lead.product_code}</TableCell>
                  <TableCell>
                    <RoleBadge roleName={lead.team_role_name} groupName={lead.team_group_name} />
                  </TableCell>
                  <TableCell>{lead.campaign_name}</TableCell>
                  <TableCell>{lead.event_tag ?? "—"}</TableCell>
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
