"use client";

import NfcIcon from "@mui/icons-material/Nfc";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { APP_NAME } from "@/lib/branding";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Analytics", href: "#analytics" },
  { label: "Teams", href: "#teams" },
  { label: "Pricing", href: "#pricing" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Contact", href: "#contact" },
];

export default function MarketingNav() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(15, 23, 42, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64, gap: 2 }}>
          <Box component={Link} href="#home" sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none", color: "white", mr: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NfcIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {APP_NAME}
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", lg: "flex" }, gap: 0.5, flex: 1 }}>
            {navLinks.map((link) => (
              <Button
                key={link.href}
                component="a"
                href={link.href}
                sx={{ color: "#cbd5e1", fontWeight: 500, fontSize: "0.875rem", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.06)" } }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
            <Button component={Link} href="/login" sx={{ color: "#e2e8f0", display: { xs: "none", sm: "inline-flex" } }}>
              Login
            </Button>
            <Button component={Link} href="/register" variant="contained" sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}>
              Start Free Trial
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
