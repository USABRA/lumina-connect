"use client";

import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
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

import ContentCard from "@/components/ui/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useApi } from "@/hooks/useApi";
import type { LeadEvent } from "@/lib/api";

function LeadTable({ leads }: { leads: LeadEvent[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Card</TableCell>
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
                  <Typography variant="body2">{lead.email}</Typography>
                  {lead.phone && (
                    <Typography variant="caption" color="text.secondary">
                      {lead.phone}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>{lead.company ?? "—"}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                  {lead.product_code}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lead.product_type}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Send email">
                  <IconButton size="small" component="a" href={`mailto:${lead.email}`}>
                    <EmailOutlinedIcon fontSize="small" />
                  </IconButton>
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
  const [leads, setLeads] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request<LeadEvent[]>("/leads?limit=100");
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [request]);

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

  const withPhone = leads.filter((lead) => lead.phone).length;
  const withCompany = leads.filter((lead) => lead.company).length;
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
            label="Teams"
            value={uniqueCampaigns}
            icon={CampaignOutlinedIcon}
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
          placeholder="Search across all campaigns…"
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
