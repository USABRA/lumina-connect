"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ContentCard from "@/components/ui/ContentCard";

type DailyPoint = { date: string; scan_count: number };

const RANGE_OPTIONS = [
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
  { label: "1 Year", days: 365 },
];

function aggregateWeekly(daily: DailyPoint[]) {
  const buckets = new Map<string, number>();
  for (const row of daily) {
    const d = new Date(row.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + row.scan_count);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, taps]) => ({ label: date.slice(5), taps }));
}

function aggregateMonthly(daily: DailyPoint[]) {
  const buckets = new Map<string, number>();
  for (const row of daily) {
    const key = row.date.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + row.scan_count);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, taps]) => ({ label: month, taps }));
}

export default function DashboardActivityChart({
  daily,
  days,
  onDaysChange,
}: {
  daily: DailyPoint[];
  days: number;
  onDaysChange: (days: number) => void;
}) {
  const [tab, setTab] = useState(0);

  const chartData = useMemo(() => {
    if (tab === 1) return aggregateWeekly(daily);
    if (tab === 2) return aggregateMonthly(daily);
    return daily.map((d) => ({ label: d.date.slice(5), taps: d.scan_count }));
  }, [daily, tab]);

  const empty = chartData.length === 0;

  return (
    <ContentCard
      title="Interaction Activity"
      action={
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {RANGE_OPTIONS.map((opt) => (
            <Chip
              key={opt.days}
              label={opt.label}
              size="small"
              clickable
              color={days === opt.days ? "primary" : "default"}
              variant={days === opt.days ? "filled" : "outlined"}
              onClick={() => onDaysChange(opt.days)}
            />
          ))}
        </Box>
      }
    >
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2.5, borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Daily Taps" />
        <Tab label="Weekly Taps" />
        <Tab label="Monthly Taps" />
      </Tabs>
      <Box sx={{ p: 2.5, height: 300 }}>
        {empty ? (
          <Typography color="text.secondary">No tap activity yet. Share a card to start tracking.</Typography>
        ) : tab === 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" fontSize={12} tick={{ fill: "#64748b" }} />
              <YAxis allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
              <Tooltip />
              <Line type="monotone" dataKey="taps" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" fontSize={12} tick={{ fill: "#64748b" }} />
              <YAxis allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
              <Tooltip />
              <Bar dataKey="taps" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </ContentCard>
  );
}
