"use client";

import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

type RoleBadgeProps = {
  roleName?: string | null;
  groupName?: string | null;
  size?: "small" | "medium";
};

export default function RoleBadge({ roleName, groupName, size = "small" }: RoleBadgeProps) {
  if (!roleName) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Chip
      label={groupName ? `${roleName} · ${groupName}` : roleName}
      size={size}
      variant="outlined"
      sx={{ maxWidth: 220 }}
    />
  );
}
