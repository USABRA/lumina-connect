"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
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

import TeamStructureFilter from "@/components/team/TeamStructureFilter";
import ContentCard from "@/components/ui/ContentCard";
import type { AnalyticsOverview, TeamStructure } from "@/lib/api";

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
] as const;

type ChartMetric = "taps" | "leads" | "conversion" | "meetings";
type ChartView = "aggregate" | "cards";
type ChartGroupBy = "time" | "team" | "location" | "device";

const METRIC_LABELS: Record<ChartMetric, string> = {
  taps: "Taps",
  leads: "Leads",
  conversion: "Conversion",
  meetings: "Meetings",
};

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
};

function truncateLabel(label: string, max = 16) {
  return label.length > max ? `${label.slice(0, max)}…` : label;
}

function buildTimeSeries(
  dailyScans: AnalyticsOverview["daily_scans"],
  dailyLeads: AnalyticsOverview["daily_leads"],
  metric: ChartMetric,
) {
  const leadByDate = new Map(dailyLeads.map((d) => [d.date, d.lead_count]));
  const scanByDate = new Map(dailyScans.map((d) => [d.date, d.scan_count]));
  const dates = [...new Set([...scanByDate.keys(), ...leadByDate.keys()])].sort();

  return dates.map((date) => {
    const taps = scanByDate.get(date) ?? 0;
    const leads = leadByDate.get(date) ?? 0;
    const conversion = taps > 0 ? Math.round((leads / taps) * 1000) / 10 : 0;
    return {
      label: date.slice(5),
      value: metric === "taps" ? taps : metric === "leads" ? leads : metric === "conversion" ? conversion : 0,
    };
  });
}

function metricSummary(data: AnalyticsOverview, metric: ChartMetric): string {
  switch (metric) {
    case "taps":
      return data.total_scans.toLocaleString();
    case "leads":
      return data.total_leads.toLocaleString();
    case "conversion":
      return `${data.conversion_rate}%`;
    case "meetings":
      return "0";
  }
}

type UnifiedAnalyticsChartProps = {
  data: AnalyticsOverview;
  days: number;
  onDaysChange: (days: number) => void;
  loading?: boolean;
  hasTeamStructure?: boolean;
  teamStructure?: TeamStructure;
  filterGroupId?: string | null;
  filterRoleId?: string | null;
  onGroupChange?: (groupId: string | null) => void;
  onRoleChange?: (roleId: string | null) => void;
};

export default function UnifiedAnalyticsChart({
  data,
  days,
  onDaysChange,
  loading = false,
  hasTeamStructure = false,
  teamStructure,
  filterGroupId = null,
  filterRoleId = null,
  onGroupChange,
  onRoleChange,
}: UnifiedAnalyticsChartProps) {
  const [metric, setMetric] = useState<ChartMetric>("taps");
  const [groupBy, setGroupBy] = useState<ChartGroupBy>("time");
  const [view, setView] = useState<ChartView>("aggregate");

  const summary = metricSummary(data, metric);

  const chartContent = useMemo(() => {
    if (metric === "meetings") {
      return (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
          No meeting data yet. Meetings will appear here once scheduling is enabled.
        </Typography>
      );
    }

    if (view === "cards" && metric !== "conversion") {
      const cardData = data.top_products.map((p) => ({
        label: truncateLabel(p.unique_code),
        value: metric === "taps" ? p.scan_count : 0,
      }));
      if (metric === "leads") {
        return (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
            Per-card lead counts are available in the table below.
          </Typography>
        );
      }
      if (cardData.length === 0) {
        return (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
            No card tap data yet.
          </Typography>
        );
      }
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cardData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" fontSize={11} tick={{ fill: "#64748b" }} />
            <YAxis allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name={METRIC_LABELS[metric]} fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (groupBy === "time") {
      const timeData = buildTimeSeries(data.daily_scans, data.daily_leads, metric);
      if (timeData.length === 0) {
        return (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
            No {METRIC_LABELS[metric].toLowerCase()} data for this period.
          </Typography>
        );
      }
      const ySuffix = metric === "conversion" ? "%" : "";
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" fontSize={12} tick={{ fill: "#64748b" }} />
            <YAxis
              allowDecimals={metric === "conversion"}
              fontSize={12}
              tick={{ fill: "#64748b" }}
              tickFormatter={(v) => `${v}${ySuffix}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [`${value ?? 0}${ySuffix}`, METRIC_LABELS[metric]]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={metric === "leads" ? "#10b981" : metric === "conversion" ? "#6366f1" : "#0ea5e9"}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (groupBy === "team") {
      const teamData = hasTeamStructure
        ? data.top_roles.map((r) => ({
            label: truncateLabel(r.role_name),
            primary: metric === "taps" ? r.scan_count : metric === "leads" ? r.lead_count : r.conversion_rate,
          }))
        : data.top_campaigns.map((c) => ({
            label: truncateLabel(c.campaign_name),
            primary: metric === "taps" ? c.scan_count : metric === "leads" ? c.lead_count : c.conversion_rate,
          }));

      if (teamData.length === 0) {
        return (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
            {hasTeamStructure ? "No role data yet." : "No team data yet."}
          </Typography>
        );
      }

      const suffix = metric === "conversion" ? "%" : "";
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={teamData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" fontSize={11} tick={{ fill: "#64748b" }} />
            <YAxis allowDecimals={metric === "conversion"} fontSize={12} tick={{ fill: "#64748b" }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [`${value ?? 0}${suffix}`, METRIC_LABELS[metric]]}
            />
            <Bar
              dataKey="primary"
              name={METRIC_LABELS[metric]}
              fill={metric === "leads" ? "#10b981" : "#6366f1"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (groupBy === "location") {
      if (metric !== "taps") {
        return (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
            Location breakdown is available for taps. Switch metric to Taps or view Over time.
          </Typography>
        );
      }
      const locData = data.geo_points.slice(0, 10).map((g) => ({
        label: truncateLabel([g.city, g.country].filter(Boolean).join(", ") || g.country),
        value: g.scan_count,
      }));
      if (locData.length === 0) {
        return (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
            No location data yet.
          </Typography>
        );
      }
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={locData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
            <YAxis type="category" dataKey="label" width={110} fontSize={11} tick={{ fill: "#64748b" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Taps" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // device
    if (metric !== "taps") {
      return (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
          Device breakdown is available for taps. Switch metric to Taps or view Over time.
        </Typography>
      );
    }
    const deviceData = data.by_device.map((d) => ({
      label: d.device_type,
      value: d.scan_count,
    }));
    if (deviceData.length === 0) {
      return (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
          No device data yet.
        </Typography>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={deviceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" fontSize={12} tick={{ fill: "#64748b" }} />
          <YAxis allowDecimals={false} fontSize={12} tick={{ fill: "#64748b" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" name="Taps" radius={[4, 4, 0, 0]}>
            {deviceData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
          <Legend />
        </BarChart>
      </ResponsiveContainer>
    );
  }, [data, metric, groupBy, view, hasTeamStructure]);

  const chartTitle = view === "cards" ? "By card" : groupBy === "time" ? "Over time" : `By ${groupBy}`;

  return (
    <ContentCard title={`${METRIC_LABELS[metric]} · ${chartTitle}`}>
      <Box
        sx={{
          px: 2.5,
          pt: 1,
          pb: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {!loading && (
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {summary}
          </Typography>
        )}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Period
          </Typography>
          {PERIOD_OPTIONS.map((opt) => (
            <Chip
              key={opt.days}
              label={opt.label}
              size="small"
              clickable
              color={days === opt.days ? "primary" : "default"}
              variant={days === opt.days ? "filled" : "outlined"}
              onClick={() => onDaysChange(opt.days)}
              disabled={loading}
            />
          ))}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={metric}
            onChange={(_, v: ChartMetric | null) => v && setMetric(v)}
          >
            {(Object.keys(METRIC_LABELS) as ChartMetric[]).map((m) => (
              <ToggleButton key={m} value={m} sx={{ px: 1.5, py: 0.5, textTransform: "none", minHeight: 36 }}>
                {METRIC_LABELS[m]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, v: ChartView | null) => v && setView(v)}
          >
            <ToggleButton value="aggregate" sx={{ px: 1.5, py: 0.5, textTransform: "none", minHeight: 36 }}>
              Aggregate
            </ToggleButton>
            <ToggleButton value="cards" sx={{ px: 1.5, py: 0.5, textTransform: "none", minHeight: 36 }}>
              By card
            </ToggleButton>
          </ToggleButtonGroup>

          {view === "aggregate" && (
            <>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
              <ToggleButtonGroup
                size="small"
                exclusive
                value={groupBy}
                onChange={(_, v: ChartGroupBy | null) => v && setGroupBy(v)}
              >
                <ToggleButton value="time" sx={{ px: 1.5, py: 0.5, textTransform: "none", minHeight: 36 }}>
                  Over time
                </ToggleButton>
                <ToggleButton value="team" sx={{ px: 1.5, py: 0.5, textTransform: "none", minHeight: 36 }}>
                  {hasTeamStructure ? "By role" : "By team"}
                </ToggleButton>
                <ToggleButton value="location" sx={{ px: 1.5, py: 0.5, textTransform: "none", minHeight: 36 }}>
                  Location
                </ToggleButton>
                <ToggleButton value="device" sx={{ px: 1.5, py: 0.5, textTransform: "none", minHeight: 36 }}>
                  Device
                </ToggleButton>
              </ToggleButtonGroup>
            </>
          )}
        </Box>

        {hasTeamStructure && teamStructure && onGroupChange && onRoleChange && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Scope
            </Typography>
            <TeamStructureFilter
              structure={teamStructure}
              groupId={filterGroupId}
              roleId={filterRoleId}
              onGroupChange={onGroupChange}
              onRoleChange={onRoleChange}
            />
          </Box>
        )}

        <Box sx={{ width: "100%", height: { xs: 260, sm: 320 }, mt: 0.5, minWidth: 0 }}>
          {loading ? (
            <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
              Loading chart…
            </Typography>
          ) : (
            chartContent
          )}
        </Box>
      </Box>
    </ContentCard>
  );
}
