"use client";

import Avatar from "@mui/material/Avatar";
import type { SxProps, Theme } from "@mui/material/styles";

function initialsFromName(name: string): string {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export default function UserAvatar({
  name,
  avatarUrl,
  size = 36,
  sx,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  sx?: SxProps<Theme>;
}) {
  return (
    <Avatar
      src={avatarUrl ?? undefined}
      alt={name}
      sx={{
        width: size,
        height: size,
        bgcolor: "primary.main",
        fontSize: size * 0.38,
        fontWeight: 700,
        ...sx,
      }}
    >
      {initialsFromName(name)}
    </Avatar>
  );
}
