"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { SvgIconComponent } from "@mui/icons-material";

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "#4f46e5",
  loading = false,
  hint,
  description,
  growthPct,
}: {
  label: string;
  value: string | number;
  icon: SvgIconComponent;
  color?: string;
  loading?: boolean;
  hint?: string;
  description?: string;
  growthPct?: number | null;
}) {
  const growthLabel =
    growthPct != null
      ? `${growthPct >= 0 ? "+" : ""}${growthPct}% this month`
      : null;
  const growthColor = growthPct != null && growthPct >= 0 ? "#10b981" : "#ef4444";

  return (
    <Card
      sx={{
        height: "100%",
        transition: "border-color 0.2s, box-shadow 0.2s",
        "&:hover": {
          borderColor: `${color}40`,
          boxShadow: `0 4px 24px ${color}14`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "0.68rem",
              }}
            >
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={64} height={40} sx={{ mt: 0.5 }} />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, letterSpacing: "-0.02em" }}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </Typography>
            )}
            {!loading && growthLabel && (
              <Typography variant="caption" sx={{ color: growthColor, fontWeight: 600, display: "block", mt: 0.5 }}>
                {growthLabel}
              </Typography>
            )}
            {!loading && description && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block", lineHeight: 1.5 }}>
                {description}
              </Typography>
            )}
            {hint && !loading && !description && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {hint}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${color}14`,
              color,
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
