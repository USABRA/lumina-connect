"use client";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { APP_NAME } from "@/lib/branding";

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", overflowX: "hidden" }}>
      <Box
        component="header"
        sx={{
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AdminPanelSettingsOutlinedIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Platform oversight
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {APP_NAME} — public tenant metadata only
            </Typography>
          </Box>
        </Box>
        <Button
          component={Link}
          href="/dashboard"
          startIcon={<ArrowBackOutlinedIcon />}
          variant="outlined"
          size="small"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Back to dashboard
        </Button>
      </Box>
      <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 1200, mx: "auto", width: "100%", minWidth: 0, overflowX: "hidden" }}>
        {children}
      </Box>
    </Box>
  );
}
