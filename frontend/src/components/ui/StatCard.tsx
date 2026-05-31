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
}: {
  label: string;
  value: string | number;
  icon: SvgIconComponent;
  color?: string;
  loading?: boolean;
  hint?: string;
}) {
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
          <Box>
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
                {value}
              </Typography>
            )}
            {hint && !loading && (
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
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
