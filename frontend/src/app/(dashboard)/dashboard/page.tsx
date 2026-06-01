"use client";

import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import NfcIcon from "@mui/icons-material/Nfc";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PercentIcon from "@mui/icons-material/Percent";
import TapAndPlayOutlinedIcon from "@mui/icons-material/TapAndPlayOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import DashboardActivityChart from "@/components/analytics/DashboardActivityChart";
import { RecentActivityTable } from "@/components/dashboard/DashboardWidgets";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useApi } from "@/hooks/useApi";
import type { DashboardAnalytics } from "@/lib/api";

const RECENT_ACTIVITY_LIMIT = 4;

export default function DashboardPage() {
  const { request } = useApi();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const dashboard = await request<DashboardAnalytics>(`/analytics/dashboard?days=${days}`);
      setData(dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [request, days]);

  useEffect(() => {
    load();
  }, [load]);

  const conversionRate = useMemo(() => {
    if (!data) return "—";
    const taps = data.total_taps.value;
    const leads = data.leads_captured.value;
    if (taps === 0) return "0%";
    return `${Math.round((leads / taps) * 1000) / 10}%`;
  }, [data]);

  const activeCards = useMemo(
    () => data?.card_performance.filter((c) => c.total_taps > 0).length ?? 0,
    [data],
  );

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        action={
          <Button component={Link} href="/products" variant="contained" startIcon={<NfcIcon />}>
            Issue business card
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(4, 1fr)" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <StatCard
          label="Card Taps"
          value={data?.total_taps.value ?? 0}
          growthPct={data?.total_taps.growth_pct}
          icon={TapAndPlayOutlinedIcon}
          color="#0ea5e9"
          loading={loading}
        />
        <StatCard
          label="Leads"
          value={data?.leads_captured.value ?? 0}
          growthPct={data?.leads_captured.growth_pct}
          icon={PeopleOutlinedIcon}
          color="#10b981"
          loading={loading}
        />
        <StatCard
          label="Conversion"
          value={conversionRate}
          icon={PercentIcon}
          color="#6366f1"
          loading={loading}
        />
        <StatCard
          label="Active Cards"
          value={activeCards}
          icon={CreditCardOutlinedIcon}
          color="#f59e0b"
          loading={loading}
        />
      </Box>

      {data && (
        <>
          <Box sx={{ mb: 2 }}>
            <DashboardActivityChart daily={data.daily_scans} days={days} onDaysChange={setDays} />
          </Box>
          <Box sx={{ mb: 2 }}>
            <RecentActivityTable
              rows={data.recent_activity}
              limit={RECENT_ACTIVITY_LIMIT}
              compact
              viewAllHref="/analytics"
            />
          </Box>
        </>
      )}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          component={Link}
          href="/products"
          size="small"
          variant="text"
          startIcon={<CreditCardOutlinedIcon sx={{ fontSize: 18 }} />}
          sx={{ color: "text.secondary" }}
        >
          Business cards
        </Button>
        <Button
          component={Link}
          href="/leads"
          size="small"
          variant="text"
          startIcon={<PeopleOutlinedIcon sx={{ fontSize: 18 }} />}
          sx={{ color: "text.secondary" }}
        >
          Leads
        </Button>
        <Button
          component={Link}
          href="/analytics"
          size="small"
          variant="text"
          startIcon={<AnalyticsOutlinedIcon sx={{ fontSize: 18 }} />}
          sx={{ color: "text.secondary" }}
        >
          Analytics
        </Button>
      </Box>
    </Box>
  );
}
