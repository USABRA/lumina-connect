"use client";

import AddIcon from "@mui/icons-material/Add";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import NfcIcon from "@mui/icons-material/Nfc";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import NewMeetingDialog from "@/components/meetings/NewMeetingDialog";
import RoleBadge from "@/components/team/RoleBadge";
import TeamStructureFilter from "@/components/team/TeamStructureFilter";
import ContentCard from "@/components/ui/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type {
  MeetingEvent,
  MeetingSessionDetail,
  MeetingSessionsListResponse,
  MeetingsListResponse,
} from "@/lib/api";
import { parseTeamStructure } from "@/lib/teamStructure";

const PERIOD_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last year", days: 365 },
] as const;

const SESSION_STATUS_COLOR: Record<string, "default" | "success" | "warning"> = {
  draft: "default",
  live: "success",
  closed: "warning",
};

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
  const router = useRouter();
  const { profile } = useAuth();
  const teamStructure = parseTeamStructure(profile?.company?.team_structure);
  const hasTeamStructure = teamStructure.groups.length > 0 || teamStructure.roles.length > 0;

  const [sessionsData, setSessionsData] = useState<MeetingSessionsListResponse | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const [data, setData] = useState<MeetingsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [filterRoleId, setFilterRoleId] = useState<string | null>(null);
  const [filterEventTag, setFilterEventTag] = useState("");
  const [periodDays, setPeriodDays] = useState(90);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError("");
    try {
      const result = await request<MeetingSessionsListResponse>("/meetings/sessions");
      setSessionsData(result);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : "Failed to load meeting sessions");
    } finally {
      setSessionsLoading(false);
    }
  }, [request]);

  const loadClicks = useCallback(async () => {
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
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadClicks();
  }, [loadClicks]);

  const handleCreateMeeting = async (payload: {
    title: string;
    scheduled_at?: string;
    event_tag?: string;
  }) => {
    const created = await request<MeetingSessionDetail>("/meetings/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await loadSessions();
    router.push(`/meetings/${created.id}`);
  };

  const events = data?.events ?? [];
  const summary = data?.summary;
  const sessions = sessionsData?.sessions ?? [];
  const reports = sessionsData?.reports ?? [];

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
  const liveCount = sessions.filter((s) => s.status === "live").length;

  return (
    <Box>
      <PageHeader
        title="Meetings"
        subtitle="Collaborative meeting rooms and schedule-click analytics from your cards."
        action={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              New meeting
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                loadSessions();
                loadClicks();
              }}
              disabled={loading || sessionsLoading}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {sessionsError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {sessionsError}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Meeting rooms"
            value={sessions.length}
            icon={GroupsOutlinedIcon}
            color="#6366f1"
            loading={sessionsLoading}
            hint="Collaborative sessions you created"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Live now"
            value={liveCount}
            icon={EventOutlinedIcon}
            color="#10b981"
            loading={sessionsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Reports"
            value={reports.length}
            icon={DescriptionOutlinedIcon}
            color="#f59e0b"
            loading={sessionsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Schedule clicks"
            value={summary?.total_clicks ?? 0}
            icon={CalendarMonthOutlinedIcon}
            color="#0ea5e9"
            loading={loading}
            hint="Card booking link clicks"
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <ContentCard
          title="Collaborative meetings"
          action={
            <Button size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              New
            </Button>
          }
          noPadding
        >
        {sessionsLoading ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">Loading sessions…</Typography>
          </Box>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={GroupsOutlinedIcon}
            title="No meeting rooms yet"
            description="Create a session, share the join link with your team or clients, and collaborate on notes in real time. Generate a report when you're done."
            action={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                Create first meeting
              </Button>
            }
          />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Meeting</TableCell>
                  <TableCell>When</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Participants</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {session.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Host: {session.host_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {session.scheduled_at ? formatWhen(session.scheduled_at) : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.status}
                        size="small"
                        color={SESSION_STATUS_COLOR[session.status] ?? "default"}
                      />
                    </TableCell>
                    <TableCell>{session.participant_count}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        endIcon={<ChevronRightIcon />}
                        component={Link}
                        href={`/meetings/${session.id}`}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </ContentCard>
      </Box>

      {reports.length > 0 && (
        <Box sx={{ mb: 3 }}>
        <ContentCard title="Saved reports" noPadding>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Meeting</TableCell>
                  <TableCell>Generated</TableCell>
                  <TableCell align="right">View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>{report.meeting_title}</TableCell>
                    <TableCell>{formatWhen(report.generated_at)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        component={Link}
                        href={`/meetings/${report.meeting_id}/report`}
                      >
                        Open report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ContentCard>
        </Box>
      )}

      <Accordion defaultExpanded={false} sx={{ mb: 0, "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Schedule click analytics
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Visitors who clicked Schedule / Book a demo on your cards
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, mx: 0 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2.5} sx={{ mb: 3, px: 0 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Schedule Clicks"
                value={summary?.total_clicks ?? 0}
                icon={CalendarMonthOutlinedIcon}
                color="#f59e0b"
                loading={loading}
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
                    ? "Share your cards and encourage visitors to use Schedule or Book a demo."
                    : "Set a meeting link on your cards to track schedule clicks here."
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
        </AccordionDetails>
      </Accordion>

      <NewMeetingDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadSessions}
        onSubmit={handleCreateMeeting}
      />
    </Box>
  );
}
