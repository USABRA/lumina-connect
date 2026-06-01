"use client";

import NfcIcon from "@mui/icons-material/Nfc";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { APP_NAME, APP_TAGLINE } from "@/lib/branding";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 1.5, sm: 2 },
        background: `
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.2), transparent),
          linear-gradient(180deg, #0f172a 0%, #1e293b 100%)
        `,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              mb: 1.5,
            }}
          >
            <NfcIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "white" }}>
            {APP_NAME}
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            {APP_TAGLINE}
          </Typography>
        </Box>
        <Card sx={{ bgcolor: "background.paper" }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {subtitle}
              </Typography>
            )}
            {children}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
