"use client";

import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useState } from "react";

import ContentCard from "@/components/ui/ContentCard";
import RoleBadge from "@/components/team/RoleBadge";
import type { DashboardAnalytics } from "@/lib/api";

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const HIGHLIGHT_STATES = new Set(["Texas", "Utah", "Florida", "California"]);

export function RecentActivityTable({
  rows,
  limit,
  viewAllHref,
  compact,
}: {
  rows: DashboardAnalytics["recent_activity"];
  limit?: number;
  viewAllHref?: string;
  compact?: boolean;
}) {
  const displayRows = limit ? rows.slice(0, limit) : rows;
  const showViewAll = Boolean(viewAllHref && (limit ? rows.length > 0 : false));

  return (
    <ContentCard
      title="Recent Activity"
      action={
        showViewAll ? (
          <Button component={Link} href={viewAllHref!} size="small">
            View all
          </Button>
        ) : undefined
      }
      noPadding
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              {!compact && <TableCell>Location</TableCell>}
              <TableCell>When</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={compact ? 3 : 4}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No interactions yet. Share a card to start tracking activity.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, i) => (
                <TableRow key={`${row.timestamp}-${i}`} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  {!compact && <TableCell>{row.location}</TableCell>}
                  <TableCell>{formatRelativeTime(row.timestamp)}</TableCell>
                  <TableCell>{row.action}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </ContentCard>
  );
}

export function CardPerformanceTable({
  rows,
  embedded,
}: {
  rows: DashboardAnalytics["card_performance"];
  embedded?: boolean;
}) {
  const table = (
    <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Card Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Total Taps</TableCell>
              <TableCell align="right">Leads</TableCell>
              <TableCell align="right">Conversion Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Issue business cards to see performance metrics.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.card_code} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.card_name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                      {row.card_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <RoleBadge roleName={row.team_role_name} groupName={row.team_group_name} />
                  </TableCell>
                  <TableCell align="right">{row.total_taps.toLocaleString()}</TableCell>
                  <TableCell align="right">{row.leads.toLocaleString()}</TableCell>
                  <TableCell align="right">{row.conversion_rate}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
  );

  if (embedded) return table;

  return (
    <ContentCard title="Card Performance" noPadding>
      {table}
    </ContentCard>
  );
}

export function PerformancePanel({ data }: { data: DashboardAnalytics }) {
  const hasTeam = data.team_leaderboard.length > 0;
  const hasRoles = data.role_performance.length > 0;
  const tabs = useMemo(() => {
    const items = [{ id: "cards", label: "Cards" }];
    if (hasTeam) items.push({ id: "team", label: "Team" });
    if (hasRoles) items.push({ id: "roles", label: "By role" });
    return items;
  }, [hasTeam, hasRoles]);
  const [tab, setTab] = useState(0);
  const activeTab = tabs[tab]?.id ?? "cards";

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: tabs.length > 1 ? 0.5 : 0 }}>
          Performance
        </Typography>
        {tabs.length > 1 && (
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            {tabs.map((item) => (
              <Tab key={item.id} label={item.label} />
            ))}
          </Tabs>
        )}
      </Box>
      {activeTab === "cards" && <CardPerformanceTable rows={data.card_performance} embedded />}
      {activeTab === "team" && <TeamLeaderboardWidget rows={data.team_leaderboard} embedded />}
      {activeTab === "roles" && <RolePerformanceTable rows={data.role_performance} embedded />}
    </Paper>
  );
}

export function InteractionMapWidget({
  byState,
  topCities,
}: {
  byState: DashboardAnalytics["by_state"];
  topCities: DashboardAnalytics["top_cities"];
}) {
  const max = byState[0]?.scan_count ?? 1;

  return (
    <ContentCard title="Interaction Map">
      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {byState.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">No geographic data yet.</Typography>
            </Grid>
          ) : (
            byState.map((state) => {
              const intensity = state.scan_count / max;
              const highlighted = HIGHLIGHT_STATES.has(state.state);
              return (
                <Grid key={state.state} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: highlighted ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.04)",
                      border: highlighted ? "1px solid rgba(99,102,241,0.35)" : "1px solid",
                      borderColor: highlighted ? "transparent" : "divider",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">{state.state}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{state.scan_count.toLocaleString()}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={intensity * 100}
                      sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: "action.hover" }}
                    />
                  </Paper>
                </Grid>
              );
            })
          )}
        </Grid>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Top Cities</Typography>
        {topCities.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No city data yet.</Typography>
        ) : (
          topCities.map((city) => (
            <Box key={`${city.city}-${city.state}`} sx={{ display: "flex", justifyContent: "space-between", py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="body2">
                {city.city}{city.state ? `, ${city.state}` : ""}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{city.scan_count}</Typography>
            </Box>
          ))
        )}
      </Box>
    </ContentCard>
  );
}

export function LeadFunnelWidget({ funnel }: { funnel: DashboardAnalytics["lead_funnel"] }) {
  const stages = [
    { label: "Card Tap", value: funnel.card_taps, pct: 100 },
    { label: "Profile View", value: funnel.profile_views, pct: funnel.tap_to_view_pct },
    { label: "Contact Saved", value: funnel.contact_saved, pct: funnel.view_to_contact_pct },
    { label: "Lead Submitted", value: funnel.lead_submitted, pct: funnel.contact_to_lead_pct },
    { label: "Meeting Scheduled", value: funnel.meeting_scheduled, pct: funnel.lead_to_meeting_pct },
  ];

  return (
    <ContentCard title="Lead Funnel">
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
        {stages.map((stage, index) => (
          <Box key={stage.label}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{stage.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stage.value.toLocaleString()}
                {index > 0 ? ` · ${stage.pct}%` : ""}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.max(stage.pct, index === 0 && stage.value ? 8 : 0)}
              sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover" }}
            />
          </Box>
        ))}
      </Box>
    </ContentCard>
  );
}

export function NetworkingInsightsWidget({ insights }: { insights: DashboardAnalytics["networking_insights"] }) {
  const items = [
    { label: "Most Active Day", value: insights.most_active_day },
    { label: "Most Active Time", value: insights.most_active_time },
    { label: "Top Performing Card", value: insights.top_performing_card },
    { label: "Average Conversion Rate", value: `${insights.average_conversion_rate}%` },
    { label: "Total Profile Views", value: insights.total_profile_views.toLocaleString() },
    { label: "Average Session Duration", value: insights.average_session_duration },
  ];

  return (
    <ContentCard title="Networking Insights">
      <Box sx={{ p: 0 }}>
        {items.map((item) => (
          <Box
            key={item.label}
            sx={{
              px: 2.5,
              py: 1.75,
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-child": { borderBottom: 0 },
            }}
          >
            <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>{item.value}</Typography>
          </Box>
        ))}
      </Box>
    </ContentCard>
  );
}

export function TeamLeaderboardWidget({
  rows,
  embedded,
}: {
  rows: DashboardAnalytics["team_leaderboard"];
  embedded?: boolean;
}) {
  const table = (
    <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Card Taps</TableCell>
              <TableCell align="right">Leads</TableCell>
              <TableCell align="right">Meetings</TableCell>
              <TableCell align="right">Conv.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Add team member cards to compare employee performance.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.card_code} hover>
                  <TableCell>{row.rank}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell>
                    <RoleBadge roleName={row.team_role_name} groupName={row.team_group_name} />
                  </TableCell>
                  <TableCell align="right">{row.card_taps.toLocaleString()}</TableCell>
                  <TableCell align="right">{row.leads.toLocaleString()}</TableCell>
                  <TableCell align="right">{row.meetings || "—"}</TableCell>
                  <TableCell align="right">{row.conversion_rate}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
  );

  if (embedded) return table;

  return (
    <ContentCard title="Teams Dashboard" noPadding>
      {table}
    </ContentCard>
  );
}

export function RolePerformanceTable({
  rows,
  embedded,
}: {
  rows: DashboardAnalytics["role_performance"];
  embedded?: boolean;
}) {
  if (rows.length === 0) return null;

  const table = (
    <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="right">Cards</TableCell>
              <TableCell align="right">Taps</TableCell>
              <TableCell align="right">Leads</TableCell>
              <TableCell align="right">Conv.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.role_id ?? row.role_name} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.role_name}</TableCell>
                <TableCell>{row.group_name ?? "—"}</TableCell>
                <TableCell align="right">{row.card_count}</TableCell>
                <TableCell align="right">{row.total_taps.toLocaleString()}</TableCell>
                <TableCell align="right">{row.leads.toLocaleString()}</TableCell>
                <TableCell align="right">{row.conversion_rate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
  );

  if (embedded) return table;

  return (
    <ContentCard title="Performance by Role" noPadding>
      {table}
    </ContentCard>
  );
}

export function AiInsightsPanel({ insights }: { insights: string[] }) {
  return (
    <ContentCard title="AI Insights">
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {insights.map((insight) => (
          <Box
            key={insight}
            sx={{
              display: "flex",
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.12)",
            }}
          >
            <AutoAwesomeOutlinedIcon sx={{ color: "#6366f1", fontSize: 20, mt: 0.25 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{insight}</Typography>
          </Box>
        ))}
      </Box>
    </ContentCard>
  );
}

export function LeadTimelineWidget({ timelines }: { timelines: DashboardAnalytics["lead_timelines"] }) {
  return (
    <ContentCard title="Contact Timeline">
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 3 }}>
        {timelines.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Lead timelines appear here once contacts engage with your cards.
          </Typography>
        ) : (
          timelines.map((timeline) => (
            <Box key={timeline.lead_id}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>{timeline.lead_name}</Typography>
              {timeline.events.map((event, i) => (
                <Box key={`${event.timestamp}-${i}`} sx={{ display: "flex", gap: 2, py: 1, borderLeft: "2px solid", borderColor: "divider", pl: 2, ml: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{event.action}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(event.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ))
        )}
      </Box>
    </ContentCard>
  );
}
