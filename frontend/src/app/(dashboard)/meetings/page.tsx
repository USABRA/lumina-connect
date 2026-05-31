"use client";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import NfcIcon from "@mui/icons-material/Nfc";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";

import RoleBadge from "@/components/team/RoleBadge";
import TeamStructureFilter from "@/components/team/TeamStructureFilter";
import ContentCard from "@/components/ui/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { MeetingEvent, MeetingsListResponse } from "@/lib/api";
import { parseTeamStructure } from "@/lib/teamStructure";

const PERIOD_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last year", days: 365 },
] as const;

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function visitorLocation(event: MeetingEvent) {
  const parts = [event.city, event.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Unknown location";
}

export default function MeetingsPage() {
  const { request } = useApi();
  const { profile } = useAuth();
  const teamStructure = parseTeamStructure(profile?.company?.team_structure);
  const hasTeamStructure = teamStructure.groups.length > 0 || teamStructure.roles.length > 0;

  const [data, setData] = useState<MeetingsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [filterRoleId, setFilterRoleId] = useState<string | null>(null);
  const [filterEventTag, setFilterEventTag] = useState("");
  const [periodDays, setPeriodDays] = useState(90);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        limit: "100",
        days: String(periodDays),
      });
      if (filterRoleId) params.set("role_id", filterRoleId);
      else if (filterGroupId) params.set("group_id", filterGroupId);
      const eventTag = filterEventTag.trim();
      if (eventTag) params.set("event_tag", eventTag);
      const result = await request<MeetingsListResponse>(`/meetings?${params.toString()}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [request, filterGroupId, filterRoleId, filterEventTag, periodDays]);

  useEffect(() => {
    load();
  }, [load]);

  const events = data?.events ?? [];
  const summary = data?.summary;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) => {
      const haystack = [
        event.card_name,
        event.product_code,
        event.product_type,
        event.campaign_name,
        event.team_role_name ?? "",
        event.team_group_name ?? "",
        event.event_tag ?? "",
        event.city ?? "",
        event.country ?? "",
        event.device_type ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [events, search]);

  const uniqueCampaigns = new Set(events.map((e) => e.campaign_name)).size;
  const withLocation = events.filter((e) => e.city || e.country).length;

  return (
    <Box>
      <PageHeader
        title="Meetings"
        subtitle="Schedule clicks from business cards with a meeting link (Calendly, etc.)."
        action={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Schedule Clicks"
            value={summary?.total_clicks ?? 0}
            icon={CalendarMonthOutlinedIcon}
            color="#f59e0b"
            loading={loading}
            hint="Visitors who opened your booking link"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Cards Clicked"
            value={summary?.unique_cards ?? 0}
            icon={NfcIcon}
            color="#6366f1"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Cards With Link"
            value={summary?.cards_with_meeting_link ?? 0}
            icon={EventOutlinedIcon}
            color="#0ea5e9"
            loading={loading}
            hint="Active cards that expose a meeting URL"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label={hasTeamStructure ? "Campaigns" : "With Location"}
            value={hasTeamStructure ? uniqueCampaigns : withLocation}
            icon={hasTeamStructure ? EventOutlinedIcon : PlaceOutlinedIcon}
            color="#10b981"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Paper
        variant="outlined"
        sx={{
          px: 2.5,
          py: 2,
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Search cards, campaigns, locations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220, maxWidth: 420 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="meetings-period-label">Period</InputLabel>
          <Select
            labelId="meetings-period-label"
            label="Period"
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <MenuItem key={opt.days} value={opt.days}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {hasTeamStructure && (
          <TeamStructureFilter
            structure={teamStructure}
            groupId={filterGroupId}
            roleId={filterRoleId}
            onGroupChange={setFilterGroupId}
            onRoleChange={setFilterRoleId}
          />
        )}
        <TextField
          size="small"
          label="Event tag"
          placeholder="e.g. expo-2026"
          value={filterEventTag}
          onChange={(e) => setFilterEventTag(e.target.value)}
          sx={{ minWidth: 160 }}
        />
      </Paper>

      {loading ? (
        <ContentCard title="Loading…" noPadding>
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">Fetching meeting activity…</Typography>
          </Box>
        </ContentCard>
      ) : filtered.length === 0 ? (
        <ContentCard noPadding>
          <EmptyState
            icon={CalendarMonthOutlinedIcon}
            title="No meeting clicks yet"
            description={
              summary?.cards_with_meeting_link
                ? "Share your cards and encourage visitors to use Schedule or Book a demo. Clicks on those buttons are tracked here."
                : "Set a default meeting link in Brand kit or add one on each business card, then share your card. When visitors click Schedule or Book a demo, activity appears here."
            }
          />
        </ContentCard>
      ) : (
        <ContentCard title="Schedule activity" noPadding>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Visitor</TableCell>
                  <TableCell>Card</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>
                      <Typography variant="body2">{formatWhen(event.timestamp)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Visitor
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {visitorLocation(event)}
                        </Typography>
                        {event.device_type && (
                          <Chip
                            icon={<DevicesOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                            label={event.device_type}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5, height: 22, fontSize: "0.65rem", width: "fit-content" }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {event.card_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                          {event.product_code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.campaign_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <RoleBadge roleName={event.team_role_name} groupName={event.team_group_name} />
                    </TableCell>
                    <TableCell>{event.event_tag ?? "—"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Open card">
                        <IconButton
                          size="small"
                          component="a"
                          href={`/p/${event.product_code}`}
                          target="_blank"
                          rel="noopener"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ContentCard>
      )}
    </Box>
  );
}
