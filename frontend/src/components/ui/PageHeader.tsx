"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        mb: 4,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: "100%", sm: "auto" },
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
}
