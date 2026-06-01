"use client";

import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
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
import { useCallback, useEffect, useMemo, useState } from "react";

import RoleBadge from "@/components/team/RoleBadge";
import TeamStructureFilter from "@/components/team/TeamStructureFilter";
import ContentCard from "@/components/ui/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { LeadEvent } from "@/lib/api";
import { buildLeadSections, parseTeamStructure } from "@/lib/teamStructure";

function LeadTable({ leads }: { leads: LeadEvent[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Card</TableCell>
            <TableCell>Event</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {lead.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                  {lead.email ? (
                    <Typography variant="body2">{lead.email}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No email
                    </Typography>
                  )}
                  {lead.phone && (
                    <Typography variant="caption" color="text.secondary">
                      {lead.phone}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                {lead.company ? (
                  <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={lead.company}>
                    {lead.company}
                  </Typography>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <RoleBadge roleName={lead.team_role_name} groupName={lead.team_group_name} />
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {lead.product_code}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary">
                      {lead.product_type}
                    </Typography>
                    <Chip label="Form" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                  </Box>
                </Box>
              </TableCell>
              <TableCell>{lead.event_tag ?? "—"}</TableCell>
              <TableCell align="right">
                <Tooltip title="Send email">
                  <span>
                    <IconButton
                      size="small"
                      component="a"
                      href={lead.email ? `mailto:${lead.email}` : undefined}
                      disabled={!lead.email}
                    >
                      <EmailOutlinedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="View landing page">
                  <IconButton
                    size="small"
                    component="a"
                    href={`/p/${lead.product_code}`}
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
  );
}

export default function LeadsPage() {
  const { request } = useApi();
  const { profile } = useAuth();
  const teamStructure = parseTeamStructure(profile?.company?.team_structure);
  const hasTeamStructure = teamStructure.groups.length > 0 || teamStructure.roles.length > 0;

  const [leads, setLeads] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [filterRoleId, setFilterRoleId] = useState<string | null>(null);
  const [filterEventTag, setFilterEventTag] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filterRoleId) params.set("role_id", filterRoleId);
      else if (filterGroupId) params.set("group_id", filterGroupId);
      const eventTag = filterEventTag.trim();
      if (eventTag) params.set("event_tag", eventTag);
      const data = await request<LeadEvent[]>(`/leads?${params.toString()}`);
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [request, filterGroupId, filterRoleId, filterEventTag]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;
    return leads.filter((lead) => {
      const haystack = [
        lead.name,
        lead.email,
        lead.phone ?? "",
        lead.company ?? "",
        lead.product_code,
        lead.product_type,
        lead.campaign_name,
        lead.team_role_name ?? "",
        lead.team_group_name ?? "",
        lead.event_tag ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [leads, search]);

  const leadsByCampaign = useMemo(() => {
    const grouped = new Map<string, LeadEvent[]>();
    for (const lead of filtered) {
      const list = grouped.get(lead.campaign_name) ?? [];
      list.push(lead);
      grouped.set(lead.campaign_name, list);
    }
    return [...grouped.entries()].sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
    );
  }, [filtered]);

  const leadSections = useMemo(
    () => (hasTeamStructure ? buildLeadSections(filtered, teamStructure) : []),
    [filtered, hasTeamStructure, teamStructure]
  );

  const withPhone = leads.filter((lead) => lead.phone).length;
  const withCompany = leads.filter((lead) => lead.company).length;
  const uniqueRoles = new Set(leads.map((lead) => lead.team_role_id).filter(Boolean)).size;
  const uniqueCampaigns = new Set(leads.map((lead) => lead.campaign_name)).size;

  return (
    <Box>
      <PageHeader
        title="Leads"
        subtitle="Contacts captured from business card taps and lead forms."
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={loading}
          >
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
            label="Total Leads"
            value={leads.length}
            icon={PeopleOutlinedIcon}
            color="#10b981"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="With Phone"
            value={withPhone}
            icon={PhoneOutlinedIcon}
            color="#0ea5e9"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="With Company"
            value={withCompany}
            icon={BusinessOutlinedIcon}
            color="#8b5cf6"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label={hasTeamStructure ? "Roles" : "Teams"}
            value={hasTeamStructure ? uniqueRoles : uniqueCampaigns}
            icon={hasTeamStructure ? GroupsOutlinedIcon : CampaignOutlinedIcon}
            color="#4f46e5"
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
          placeholder={hasTeamStructure ? "Search leads, roles, cards…" : "Search across all campaigns…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: { xs: "1 1 100%", sm: 1 }, minWidth: { xs: 0, sm: 220 }, maxWidth: { xs: "none", sm: 420 } }}
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
          placeholder="feira-sp-2026"
          value={filterEventTag}
          onChange={(e) => setFilterEventTag(e.target.value)}
          sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" }, minWidth: { xs: 0, sm: 180 } }}
        />
        <Typography variant="body2" color="text.secondary">
          {filtered.length} lead{filtered.length === 1 ? "" : "s"}
          {search.trim() ? ` matching "${search.trim()}"` : ""}
        </Typography>
      </Paper>

      {loading ? (
        <ContentCard title="Loading…" noPadding>
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">Fetching leads…</Typography>
          </Box>
        </ContentCard>
      ) : leads.length === 0 ? (
        <ContentCard noPadding>
          <EmptyState
            icon={PeopleOutlinedIcon}
            title="No contacts yet"
            description="When someone fills a contact form on a card, they'll appear here."
            action={
              <Button component={Link} href="/products" variant="contained">
                Add team card
              </Button>
            }
          />
        </ContentCard>
      ) : filtered.length === 0 ? (
        <ContentCard title="No results" noPadding>
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">
              No leads match your search. Try a different name, email, or product code.
            </Typography>
          </Box>
        </ContentCard>
      ) : hasTeamStructure ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {leadSections.map((section) => {
            const leadCount = section.roles.reduce((n, r) => n + r.leads.length, 0);
            return (
              <ContentCard
                key={section.key}
                title={section.title}
                action={
                  <Chip
                    icon={<PeopleOutlinedIcon sx={{ fontSize: "16px !important" }} />}
                    label={`${leadCount} lead${leadCount === 1 ? "" : "s"}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                }
                noPadding
              >
                {section.subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, pt: 2 }}>
                    {section.subtitle}
                  </Typography>
                )}
                {section.roles.map(({ role, leads: roleLeads }) => (
                  <Box key={role?.id ?? "unassigned"}>
                    {role && (
                      <Box
                        sx={{
                          px: 2.5,
                          py: 1.5,
                          bgcolor: "action.hover",
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {role.name}
                        </Typography>
                      </Box>
                    )}
                    <LeadTable leads={roleLeads} />
                  </Box>
                ))}
              </ContentCard>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {leadsByCampaign.map(([campaignName, campaignLeads]) => (
            <ContentCard
              key={campaignName}
              title={campaignName}
              action={
                <Chip
                  icon={<PeopleOutlinedIcon sx={{ fontSize: "16px !important" }} />}
                  label={`${campaignLeads.length} lead${campaignLeads.length === 1 ? "" : "s"}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              }
              noPadding
            >
              <LeadTable leads={campaignLeads} />
            </ContentCard>
          ))}
        </Box>
      )}
    </Box>
  );
}
