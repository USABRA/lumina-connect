"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useState } from "react";

import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type {
  AnalyticsOverview,
  DashboardStats,
  InteractionEvent,
  LeadEvent,
} from "@/lib/api";

const quickLinks = [
  {
    label: "New campaign",
    description: "Launch a trade show or promo",
    href: "/campaigns",
    color: "#4f46e5",
  },
  {
    label: "Generate QR codes",
    description: "Create trackable products",
    href: "/products",
    color: "#0ea5e9",
  },
  {
    label: "View leads",
    description: "Contacts from landing forms",
    href: "/leads",
    color: "#10b981",
  },
  {
    label: "View analytics",
    description: "Scans, leads & conversion",
    href: "/analytics",
    color: "#6366f1",
  },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const { request } = useApi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentScans, setRecentScans] = useState<InteractionEvent[]>([]);
  const [recentLeads, setRecentLeads] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const name = profile?.user.name?.split(" ")[0] ?? "there";
  const company = profile?.company?.company_name;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [dash, anal, scans, leads] = await Promise.all([
          request<DashboardStats>("/products/stats/dashboard"),
          request<AnalyticsOverview>("/analytics/overview"),
          request<InteractionEvent[]>("/analytics/interactions?limit=5"),
          request<LeadEvent[]>("/leads?limit=5"),
        ]);
        setStats(dash);
        setOverview(anal);
        setRecentScans(scans);
        setRecentLeads(leads);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [request]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <Box>
      <PageHeader
        title={`${greeting}, ${name}`}
        subtitle={
          company
            ? `Here's how ${company} is performing across campaigns and products.`
            : "Track scans, leads, and campaign performance in one place."
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Active Campaigns"
            value={stats?.active_campaigns ?? 0}
            icon={CampaignOutlinedIcon}
            color="#4f46e5"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Products Tracked"
            value={stats?.products_tracked ?? 0}
            icon={QrCode2OutlinedIcon}
            color="#0ea5e9"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total Scans"
            value={stats?.total_interactions ?? 0}
            icon={QrCodeScannerOutlinedIcon}
            color="#8b5cf6"
            loading={loading}
            hint={overview ? `${overview.scans_today} today` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Leads Captured"
            value={stats?.leads_captured ?? 0}
            icon={PeopleOutlinedIcon}
            color="#10b981"
            loading={loading}
            hint={
              overview ? `${overview.conversion_rate}% conversion` : undefined
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ContentCard title="Quick actions">
            <List disablePadding>
              {quickLinks.map((item) => (
                <ListItem
                  key={item.href}
                  component={Link}
                  href={item.href}
                  disableGutters
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.15s",
                    "&:last-child": { borderBottom: 0 },
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: item.color,
                      mr: 2,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText
                    primary={item.label}
                    secondary={item.description}
                    slotProps={{
                      primary: { sx: { fontWeight: 600, fontSize: "0.9rem" } },
                    }}
                  />
                  <ArrowForwardIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </ListItem>
              ))}
            </List>
          </ContentCard>

          {!loading && overview && overview.conversion_rate > 0 && (
            <Box
              sx={{
                mt: 2.5,
                p: 2.5,
                borderRadius: 4,
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                color: "white",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: 0.9 }}>
                  Conversion rate
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {overview.conversion_rate}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                {overview.total_leads} leads from {overview.total_scans} scans
              </Typography>
            </Box>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <ContentCard
            title="Recent activity"
            action={
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button component={Link} href="/leads" size="small" endIcon={<ArrowForwardIcon />}>
                  Leads
                </Button>
                <Button component={Link} href="/analytics" size="small" endIcon={<ArrowForwardIcon />}>
                  Analytics
                </Button>
              </Box>
            }
          >
            {loading ? (
              <Box sx={{ p: 2.5 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={48} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : recentScans.length === 0 && recentLeads.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary" variant="body2">
                  No activity yet. Share a QR code to start tracking scans.
                </Typography>
                <Button
                  component={Link}
                  href="/products"
                  variant="contained"
                  size="small"
                  sx={{ mt: 2 }}
                >
                  Create a product
                </Button>
              </Box>
            ) : (
              <List disablePadding>
                {recentScans.slice(0, 4).map((scan) => (
                  <ListItem
                    key={`scan-${scan.id}`}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Scan on{" "}
                          <Box component="span" sx={{ fontFamily: "monospace", color: "primary.main" }}>
                            {scan.product_code}
                          </Box>
                        </Typography>
                      }
                      secondary={`${scan.campaign_name} · ${new Date(scan.timestamp).toLocaleString()}`}
                    />
                  </ListItem>
                ))}
                {recentLeads.slice(0, 2).map((lead) => (
                  <ListItem
                    key={`lead-${lead.id}`}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      "&:last-child": { borderBottom: 0 },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          New lead: {lead.name}
                        </Typography>
                      }
                      secondary={`${lead.email} · ${lead.product_code}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </ContentCard>
        </Grid>
      </Grid>
    </Box>
  );
}
