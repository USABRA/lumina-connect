"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SvgIconComponent } from "@mui/icons-material";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: SvgIconComponent;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: "center",
        color: "text.secondary",
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 3,
          bgcolor: "action.hover",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
          color: "text.disabled",
        }}
      >
        <Icon sx={{ fontSize: 28 }} />
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: "auto", mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
