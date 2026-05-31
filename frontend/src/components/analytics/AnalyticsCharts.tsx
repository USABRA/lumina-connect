"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ContentCard from "@/components/ui/ContentCard";
import type { AnalyticsOverview } from "@/lib/api";

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function ChartCard({
  title,
  children,
  height = 280,
}: {
  title: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <ContentCard title={title}>
      <Box sx={{ width: "100%", height }}>{children}</Box>
    </ContentCard>
  );
}

export default function AnalyticsCharts({ data }: { data: AnalyticsOverview }) {
  const dailyData = data.daily_scans.map((d) => ({
    date: d.date.slice(5),
    scans: d.scan_count,
  }));

  const countryData = data.by_country.slice(0, 8);
  const leadsData = data.leads_by_campaign;
  const campaignData = data.top_campaigns.map((c) => ({
    name: c.campaign_name.length > 18 ? `${c.campaign_name.slice(0, 18)}…` : c.campaign_name,
    scans: c.scan_count,
    leads: c.lead_count,
  }));

  const geoData = data.geo_points.map((g) => ({
    label: [g.city, g.country].filter(Boolean).join(", "),
    scans: g.scan_count,
  }));

  const deviceData = data.by_device;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mb: 3 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
        }}
      >
        <ChartCard title="Daily Taps">
          {dailyData.length === 0 ? (
            <Typography color="text.secondary">No tap data yet.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" fontSize={12} tick={{ fill: "#64748b" }} />
                <YAxis allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#6366f1" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Interaction Heatmap">
          {geoData.length === 0 ? (
            <Typography color="text.secondary">No location data yet.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
                <YAxis type="category" dataKey="label" width={100} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                  }}
                />
                <Bar dataKey="scans" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
        }}
      >
        <ChartCard title="Top Teams (Taps vs Leads)">
          {campaignData.length === 0 ? (
            <Typography color="text.secondary">No team data yet.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} />
                <YAxis allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                  }}
                />
                <Legend />
                <Bar dataKey="scans" fill="#6366f1" name="Taps" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leads" fill="#10b981" name="Leads" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Leads by Team">
          {leadsData.length === 0 ? (
            <Typography color="text.secondary">No leads captured yet.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={leadsData.map((l) => ({
                  name:
                    l.campaign_name.length > 16
                      ? `${l.campaign_name.slice(0, 16)}…`
                      : l.campaign_name,
                  leads: l.lead_count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} />
                <YAxis allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                  }}
                />
                <Bar dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
        }}
      >
        <ChartCard title="Taps by Country">
          {countryData.length === 0 ? (
            <Typography color="text.secondary">No country data yet.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="country" fontSize={12} tick={{ fill: "#64748b" }} />
                <YAxis allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                  }}
                />
                <Bar dataKey="scan_count" name="Taps" radius={[4, 4, 0, 0]}>
                  {countryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Taps by Device">
          {deviceData.length === 0 ? (
            <Typography color="text.secondary">No device data yet.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="device_type" fontSize={12} tick={{ fill: "#64748b" }} />
                <YAxis allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                  }}
                />
                <Bar dataKey="scan_count" name="Scans" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Box>
    </Box>
  );
}
