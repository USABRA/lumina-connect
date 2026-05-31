"use client";

import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import NfcIcon from "@mui/icons-material/Nfc";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import TapAndPlayOutlinedIcon from "@mui/icons-material/TapAndPlayOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import MarketingNav from "@/components/marketing/MarketingNav";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";

const featureCards = [
  { icon: PersonOutlinedIcon, title: "Digital Identity", desc: "Professional profile pages at luminaconnect.com/username with photo, role, and company brand." },
  { icon: TapAndPlayOutlinedIcon, title: "Professional Landing Pages", desc: "Every NFC tap opens a mobile-first card with call, email, social links, and save contact." },
  { icon: HubOutlinedIcon, title: "Lead Capture", desc: "Custom forms for quotes, consultations, and mailing lists — triggered the moment someone taps." },
  { icon: AnalyticsOutlinedIcon, title: "Analytics", desc: "Track taps, locations, devices, and conversion from handshake to lead." },
  { icon: GroupsOutlinedIcon, title: "Team Management", desc: "Issue cards for every employee and compare networking performance across the org." },
  { icon: BusinessCenterOutlinedIcon, title: "Enterprise Reporting", desc: "Company-wide dashboards for interactions, leads, meetings, and top performers." },
];

const pricingTiers = [
  { name: "Starter", audience: "For individuals", price: "Free", features: ["1 digital card", "Basic analytics", "Save contact & share profile"] },
  { name: "Professional", audience: "For consultants & sales", price: "$19", features: ["Unlimited taps tracked", "Lead capture forms", "Calendly & custom links"] },
  { name: "Business", audience: "For growing teams", price: "$49", features: ["Team cards", "Geographic insights", "Performance dashboards"] },
  { name: "Enterprise", audience: "For large organizations", price: "Custom", features: ["Hundreds of employees", "CRM integrations", "Dedicated support"] },
];

const integrations = ["Salesforce", "HubSpot", "Zoho CRM", "Google Calendar", "Microsoft Outlook", "Calendly", "Slack"];

const roadmap = [
  "Apple Wallet Cards",
  "Google Wallet Cards",
  "AI Networking Assistant",
  "Business Relationship Scoring",
  "Automated Follow-Up Suggestions",
  "Lead Quality Prediction",
  "Meeting Attribution Analytics",
  "Sales Performance Analytics",
];

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <Box sx={{ textAlign: "center", mb: 5, maxWidth: 720, mx: "auto" }}>
      {eyebrow && (
        <Chip label={eyebrow} size="small" sx={{ mb: 2, bgcolor: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontWeight: 600 }} />
      )}
      <Typography variant="h3" sx={{ fontWeight: 800, color: "white", letterSpacing: "-0.03em", mb: 1.5, fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: "#94a3b8", lineHeight: 1.7, fontSize: "1.05rem" }}>{subtitle}</Typography>
      )}
    </Box>
  );
}

export default function MarketingPage() {
  return (
    <Box sx={{ bgcolor: "#0f172a", minHeight: "100vh", color: "#f8fafc" }}>
      <MarketingNav />

      {/* Hero */}
      <Box
        id="home"
        component="section"
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          background: `
            radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99, 102, 241, 0.35), transparent),
            linear-gradient(180deg, #0f172a 0%, #1e293b 100%)
          `,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip label={APP_TAGLINE} sx={{ mb: 3, bgcolor: "rgba(56,189,248,0.12)", color: "#7dd3fc", fontWeight: 600 }} />
              <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, mb: 2.5, fontSize: { xs: "2.25rem", md: "3.25rem" } }}>
                Turn Every Handshake Into Measurable Revenue
              </Typography>
              <Typography sx={{ color: "#94a3b8", fontSize: { xs: "1.05rem", md: "1.2rem" }, lineHeight: 1.7, maxWidth: 580, mb: 4 }}>
                Create professional NFC business cards, track interactions, capture leads, and understand how your network converts into real business opportunities.
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button component={Link} href="/register" variant="contained" size="large" sx={{ bgcolor: "#6366f1", px: 3, "&:hover": { bgcolor: "#4f46e5" } }}>
                  Start Free Trial
                </Button>
                <Button component="a" href="#contact" variant="outlined" size="large" sx={{ borderColor: "rgba(255,255,255,0.25)", color: "white", px: 3 }}>
                  Book a Demo
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <NfcIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>Alex Morgan</Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>VP Sales · Acme Corp</Typography>
                  </Box>
                </Box>
                {["Add to contacts", "Schedule meeting", "Request quote", "Share profile"].map((action) => (
                  <Box key={action} sx={{ py: 1.25, px: 2, mb: 1, borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: "0.9rem" }}>
                    {action}
                  </Box>
                ))}
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 2, textAlign: "center" }}>
                  luminaconnect.com/alex-morgan
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box id="features" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "#0f172a" }}>
        <Container maxWidth="lg">
          <SectionHeading eyebrow="Platform" title="More Than a Business Card" subtitle="Every NFC card becomes a lead generation and relationship management tool — not just a digital profile." />
          <Grid container spacing={2.5}>
            {featureCards.map(({ icon: Icon, title, desc }) => (
              <Grid key={title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: "100%", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "inherit" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
                      <Icon sx={{ color: "#a5b4fc" }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8", lineHeight: 1.7 }}>{desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Analytics preview */}
      <Box id="analytics" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "#1e293b" }}>
        <Container maxWidth="lg">
          <SectionHeading title="Lead Intelligence" subtitle="When someone taps a card, Lumina Connect records timestamp, location, device, traffic source, and actions taken — then turns it into actionable insights." />
          <Grid container spacing={2.5}>
            {[
              { label: "Total Card Taps", value: "12,480" },
              { label: "Unique Visitors", value: "8,214" },
              { label: "Leads Captured", value: "1,892" },
              { label: "Conversion Rate", value: "15.2%" },
            ].map((stat) => (
              <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
                <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>{stat.label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{stat.value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Paper sx={{ mt: 3, p: 3, borderRadius: 3, bgcolor: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Geographic Insights</Typography>
            <Grid container spacing={2}>
              {["United States · 4,210 taps", "Brazil · 1,840 taps", "United Kingdom · 920 taps", "Germany · 640 taps"].map((row) => (
                <Grid key={row} size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ py: 1.5, px: 2, borderRadius: 2, bgcolor: "rgba(99,102,241,0.1)", color: "#cbd5e1", fontSize: "0.9rem" }}>{row}</Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* Teams */}
      <Box id="teams" component="section" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeading title="Built for Teams" subtitle="Managers see employee performance, card usage, lead generation, meeting conversions, and networking activity — all in one place." />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {["Register & assign NFC cards", "Track card performance per employee", "View interaction history", "Compare top performers"].map((item) => (
                  <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)", "&:last-child": { borderBottom: 0 } }}>
                    <TrendingUpOutlinedIcon sx={{ color: "#6366f1", fontSize: 20 }} />
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing */}
      <Box id="pricing" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: "#1e293b" }}>
        <Container maxWidth="lg">
          <SectionHeading title="Pricing" subtitle="From solo professionals to enterprise teams managing hundreds of employees." />
          <Grid container spacing={2.5}>
            {pricingTiers.map((tier, i) => (
              <Grid key={tier.name} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ height: "100%", bgcolor: i === 1 ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)", border: i === 1 ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)", color: "inherit" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="overline" sx={{ color: "#94a3b8" }}>{tier.audience}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, my: 1 }}>{tier.name}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#a5b4fc", mb: 2 }}>{tier.price}{tier.price !== "Custom" && tier.price !== "Free" && <Typography component="span" variant="body2" sx={{ color: "#64748b" }}>/mo</Typography>}</Typography>
                    {tier.features.map((f) => (
                      <Typography key={f} variant="body2" sx={{ color: "#94a3b8", py: 0.5 }}>· {f}</Typography>
                    ))}
                    <Button component={Link} href="/register" fullWidth variant={i === 1 ? "contained" : "outlined"} sx={{ mt: 3, ...(i !== 1 && { borderColor: "rgba(255,255,255,0.2)", color: "white" }) }}>
                      Get started
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Enterprise */}
      <Box id="enterprise" component="section" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <SectionHeading title="Enterprise Dashboard" subtitle="Company-wide metrics: total employees, interactions, leads, meetings scheduled, lead sources, and top performers." />
          <Grid container spacing={2.5}>
            {["Total Employees", "Total Interactions", "Total Leads", "Meetings Scheduled", "Lead Sources", "Top Performers"].map((metric) => (
              <Grid key={metric} size={{ xs: 6, md: 4 }}>
                <Paper sx={{ p: 2.5, textAlign: "center", borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <ShareOutlinedIcon sx={{ color: "#6366f1", mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{metric}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Integrations + Roadmap */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: "#1e293b" }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Integrations</Typography>
              <Typography sx={{ color: "#94a3b8", mb: 3 }}>Connect your networking data to the tools your team already uses.</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {integrations.map((name) => (
                  <Chip key={name} label={name} sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#e2e8f0" }} />
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Roadmap</Typography>
              <Typography sx={{ color: "#94a3b8", mb: 2 }}>What&apos;s coming next for digital networking.</Typography>
              {roadmap.map((item) => (
                <Typography key={item} variant="body2" sx={{ color: "#cbd5e1", py: 0.75 }}>→ {item}</Typography>
              ))}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact */}
      <Box id="contact" component="section" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Ready to turn networking into revenue?</Typography>
          <Typography sx={{ color: "#94a3b8", mb: 4 }}>Join professionals and companies using {APP_NAME} to measure every handshake.</Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <Button component={Link} href="/register" variant="contained" size="large" sx={{ bgcolor: "#6366f1" }}>Start Free Trial</Button>
            <Button component="a" href="mailto:hello@luminaconnect.com" variant="outlined" size="large" sx={{ borderColor: "rgba(255,255,255,0.25)", color: "white" }}>Contact Sales</Button>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 4, borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
        <Typography variant="caption" sx={{ color: "#64748b" }}>© {new Date().getFullYear()} {APP_NAME}. NFC business cards & lead intelligence.</Typography>
      </Box>
    </Box>
  );
}
