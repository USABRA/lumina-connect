"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import NfcIcon from "@mui/icons-material/Nfc";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PercentIcon from "@mui/icons-material/Percent";
import RadioButtonUncheckedOutlinedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
import TapAndPlayOutlinedIcon from "@mui/icons-material/TapAndPlayOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useState } from "react";

import DashboardActivityChart from "@/components/analytics/DashboardActivityChart";
import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { APP_TAGLINE } from "@/lib/branding";
import type { AnalyticsOverview, CompanyBrand, DashboardStats, InteractionEvent } from "@/lib/api";

const setupSteps = [
  { label: "Configure brand kit", href: "/settings", key: "brand" as const },
  { label: "Issue first business card", href: "/products", key: "card" as const },
  { label: "Program NFC or share profile link", href: "/products", key: "nfc" as const },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const { request } = useApi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [brand, setBrand] = useState<CompanyBrand | null>(null);
  const [recentTaps, setRecentTaps] = useState<InteractionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const name = profile?.user.name?.split(" ")[0] ?? "there";
  const company = profile?.company?.company_name;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [dash, brandData, taps, overviewData] = await Promise.all([
          request<DashboardStats>("/products/stats/dashboard"),
          request<CompanyBrand>("/companies/brand"),
          request<InteractionEvent[]>("/analytics/interactions?limit=5"),
          request<AnalyticsOverview>("/analytics/overview"),
        ]);
        setStats(dash);
        setBrand(brandData);
        setRecentTaps(taps);
        setOverview(overviewData);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [request]);

  const hasBrand = Boolean(brand?.brand_logo_url || brand?.brand_tagline);
  const hasCards = (stats?.products_tracked ?? 0) > 0;
  const completed = {
    brand: hasBrand,
    card: hasCards,
    nfc: hasCards && (stats?.total_interactions ?? 0) > 0,
  };

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${name}`}
        subtitle={company ? `${company} · ${APP_TAGLINE}` : APP_TAGLINE}
        action={
          <Button component={Link} href="/products" variant="contained" startIcon={<NfcIcon />}>
            Issue business card
          </Button>
        }
      />

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #312e81 100%)",
          color: "white",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Turn every handshake into measurable revenue
        </Typography>
        <Typography sx={{ opacity: 0.85, maxWidth: 620, mb: 2.5 }}>
          Every NFC card is a lead generation tool. Track taps, capture contacts, and see how your network converts into business opportunities.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button component={Link} href="/products" variant="contained" sx={{ bgcolor: "white", color: "#0f172a", "&:hover": { bgcolor: "#f1f5f9" } }}>
            Business cards
          </Button>
          <Button component={Link} href="/analytics" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.4)", color: "white" }}>
            Lead intelligence
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(5, 1fr)" },
          gap: 2.5,
          mb: 3,
        }}
      >
        <StatCard label="Total Card Taps" value={stats?.total_interactions ?? 0} icon={TapAndPlayOutlinedIcon} color="#0ea5e9" loading={loading} />
        <StatCard label="Unique Visitors" value={stats?.unique_visitors ?? 0} icon={VisibilityOutlinedIcon} color="#6366f1" loading={loading} />
        <StatCard label="Leads Captured" value={stats?.leads_captured ?? 0} icon={PeopleOutlinedIcon} color="#10b981" loading={loading} />
        <StatCard label="Meetings Scheduled" value="—" icon={CalendarMonthOutlinedIcon} color="#f59e0b" loading={loading} hint="Via Calendly link" />
        <StatCard label="Conversion Rate" value={stats ? `${stats.conversion_rate}%` : "—"} icon={PercentIcon} color="#8b5cf6" loading={loading} />
      </Box>

      {overview && <Box sx={{ mb: 3 }}><DashboardActivityChart daily={overview.daily_scans} /></Box>}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ContentCard title="Get started">
            <List disablePadding>
              {setupSteps.map((step) => {
                const done = completed[step.key];
                return (
                  <ListItem
                    key={step.key}
                    component={Link}
                    href={step.href}
                    disableGutters
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      textDecoration: "none",
                      color: "inherit",
                      "&:last-child": { borderBottom: 0 },
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {done ? (
                        <CheckCircleOutlinedIcon color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedOutlinedIcon sx={{ color: "text.disabled" }} fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={step.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                    <ArrowForwardIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </ListItem>
                );
              })}
            </List>
          </ContentCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <ContentCard
            title="Recent card activity"
            action={
              <Button component={Link} href="/analytics" size="small" endIcon={<ArrowForwardIcon />}>
                Analytics
              </Button>
            }
          >
            {recentTaps.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary" variant="body2">
                  No taps yet. Share a card link or program an NFC tag to start lead intelligence.
                </Typography>
                <Button component={Link} href="/products" variant="contained" size="small" sx={{ mt: 2 }}>
                  Issue a card
                </Button>
              </Box>
            ) : (
              <List disablePadding>
                {recentTaps.map((tap) => (
                  <ListItem key={tap.id} sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Tap on{" "}
                          <Box component="span" sx={{ fontFamily: "monospace", color: "primary.main" }}>
                            {tap.product_code}
                          </Box>
                        </Typography>
                      }
                      secondary={`${tap.city ?? "Unknown"}, ${tap.country ?? "—"} · ${tap.device_type ?? "Unknown device"} · ${new Date(tap.timestamp).toLocaleString()}`}
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
