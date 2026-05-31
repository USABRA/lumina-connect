"use client";

import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import type { MouseEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { CardLanguageToggle, useCardLanguage } from "@/components/landing/CardLanguageProvider";
import LeadForm from "@/components/landing/LeadForm";
import NfcCardContactForm from "@/components/landing/NfcCardContactForm";
import { cardWhatsAppGreeting } from "@/lib/cardI18n";
import type { LandingBlock } from "@/lib/landingBlocks";
import type { LandingPreviewData } from "@/lib/landingTemplates";
import { APP_NAME } from "@/lib/branding";
import { getContactVcardUrl } from "@/lib/api";
import { openTrackedMeetingLink } from "@/lib/trackInteraction";
import { normalizeLinkedInUrl, whatsappHref } from "@/lib/vcard";

const LEGACY_TEMPLATES: Record<string, string> = {
  classic: "showcase",
  video_first: "media_center",
  lead_capture: "brand_story",
  brochure: "split",
  minimal: "trade_show",
};

function normalizeTemplate(id: string) {
  return LEGACY_TEMPLATES[id] ?? id;
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const vid = parsed.searchParams.get("v");
      return vid ? `https://www.youtube.com/embed/${vid}` : null;
    }
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
  } catch {
    return null;
  }
  return null;
}

function Highlights({
  items,
  color,
  compact,
}: {
  items: string[];
  color: string;
  compact?: boolean;
}) {
  const icons = [BoltOutlinedIcon, VerifiedOutlinedIcon, AutoAwesomeOutlinedIcon];
  return (
    <Grid container spacing={compact ? 1 : 2}>
      {items.map((text, i) => {
        const Icon = icons[i % icons.length];
        return (
          <Grid key={text} size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: compact ? 1.5 : 2.5,
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  width: compact ? 32 : 40,
                  height: compact ? 32 : 40,
                  borderRadius: 2,
                  bgcolor: `${color}18`,
                  color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <Icon sx={{ fontSize: compact ? 18 : 22 }} />
              </Box>
              <Typography variant={compact ? "caption" : "body2"} sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                {text}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

function CtaButtons({
  product,
  color,
  compact,
  inverted,
  preview,
}: {
  product: LandingPreviewData;
  color: string;
  compact?: boolean;
  inverted?: boolean;
  preview?: boolean;
}) {
  if (!product.pdf_url && !product.meeting_url) return null;
  const code = product.unique_code;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: inverted ? "center" : "flex-start" }}>
      {product.pdf_url && (
        <Button
          variant={inverted ? "outlined" : "outlined"}
          size={compact ? "small" : "medium"}
          href={product.pdf_url}
          target="_blank"
          rel="noopener"
          sx={inverted ? { borderColor: "white", color: "white" } : { borderColor: color, color }}
        >
          Download brochure
        </Button>
      )}
      {product.meeting_url && (
        <Button
          variant="contained"
          size={compact ? "small" : "medium"}
          component={preview ? "button" : "a"}
          href={preview ? undefined : product.meeting_url}
          target={preview ? undefined : "_blank"}
          rel={preview ? undefined : "noopener"}
          onClick={
            preview
              ? undefined
              : (e: MouseEvent) => {
                  e.preventDefault();
                  openTrackedMeetingLink(code, product.meeting_url!, product.event_tag);
                }
          }
          sx={{ bgcolor: inverted ? "white" : color, color: inverted ? color : "white", "&:hover": { bgcolor: inverted ? "#f8fafc" : color, filter: inverted ? "none" : "brightness(0.92)" } }}
        >
          Book a demo
        </Button>
      )}
    </Box>
  );
}

function ContactSection({
  product,
  preview,
  color,
  compact,
  title = "Let's connect",
  enabled,
}: {
  product: LandingPreviewData;
  preview: boolean;
  color: string;
  compact?: boolean;
  title?: string;
  enabled?: boolean;
}) {
  if (enabled === false || (enabled !== true && !product.contact_form_enabled)) return null;
  return (
    <Box id="contact" sx={{ py: compact ? 2 : { xs: 4, sm: 6 } }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: compact ? 2 : { xs: 3, sm: 4 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <Typography variant={compact ? "subtitle1" : "h5"} sx={{ fontWeight: 700, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: compact ? 2 : 3 }}>
            Fill out the form and {product.company_name} will get back to you.
          </Typography>
          <LeadForm productCode={product.unique_code} preview={preview} accentColor={preview ? undefined : color} />
        </Paper>
      </Container>
    </Box>
  );
}

function HeroImage({ url, alt, compact }: { url: string; alt: string; compact?: boolean }) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: compact ? "none" : "0 20px 50px rgba(15,23,42,0.12)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        style={{ width: "100%", display: "block", maxHeight: compact ? 140 : 420, objectFit: "cover" }}
      />
    </Box>
  );
}

function VideoBlock({ embedUrl, compact }: { embedUrl: string; compact?: boolean }) {
  return (
    <Box sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      <Box
        component="iframe"
        src={embedUrl}
        title="Product video"
        sx={{ width: "100%", aspectRatio: "16/9", border: 0, display: "block", minHeight: compact ? 120 : undefined }}
      />
    </Box>
  );
}

function PageShowcase({
  product,
  color,
  headline,
  highlights,
  embedUrl,
  preview,
  compact,
}: PageProps) {
  return (
    <Box>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 50%, #0f172a 100%)`,
          color: "white",
          py: compact ? 3 : { xs: 6, sm: 10 },
          px: compact ? 2 : 0,
        }}
      >
        <Container maxWidth="lg">
          {product.logo_url && (
            <Box sx={{ mb: 2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.logo_url} alt="" style={{ maxHeight: compact ? 36 : 56, filter: "brightness(0) invert(1)" }} />
            </Box>
          )}
          <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 2 }}>
            {product.campaign_name}
          </Typography>
          <Typography variant={compact ? "h5" : "h2"} sx={{ fontWeight: 800, mt: 1, mb: 2, maxWidth: 720, letterSpacing: "-0.03em" }}>
            {headline}
          </Typography>
          {product.landing_description && (
            <Typography variant={compact ? "body2" : "h6"} sx={{ opacity: 0.9, maxWidth: 600, mb: 3, fontWeight: 400, lineHeight: 1.6 }}>
              {product.landing_description}
            </Typography>
          )}
          <CtaButtons product={product} color={color} compact={compact} inverted preview={preview} />
        </Container>
      </Box>

      {product.hero_image_url && (
        <Container maxWidth="lg" sx={{ mt: compact ? -2 : -6, position: "relative", zIndex: 1 }}>
          <HeroImage url={product.hero_image_url} alt={headline} compact={compact} />
        </Container>
      )}

      <Container maxWidth="lg" sx={{ py: compact ? 2 : 5 }}>
        {highlights.length > 0 && (
          <Box sx={{ mb: compact ? 2 : 4 }}>
            <Highlights items={highlights} color={color} compact={compact} />
          </Box>
        )}
        {embedUrl && <VideoBlock embedUrl={embedUrl} compact={compact} />}
      </Container>

      <ContactSection product={product} preview={preview} color={color} compact={compact} />
    </Box>
  );
}

function PageSplit({ product, color, headline, highlights, embedUrl, preview, compact }: PageProps) {
  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: compact ? "auto" : "100vh" }}>
      <Container maxWidth="lg" sx={{ py: compact ? 2 : { xs: 4, sm: 6 } }}>
        <Grid container spacing={compact ? 2 : 4} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            {product.logo_url && (
              <Box sx={{ mb: 2 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.logo_url} alt="" style={{ maxHeight: compact ? 40 : 64 }} />
              </Box>
            )}
            <Typography variant="overline" color="text.secondary">{product.company_name}</Typography>
            <Typography variant={compact ? "h5" : "h3"} sx={{ fontWeight: 800, mt: 1, mb: 2, letterSpacing: "-0.02em" }}>
              {headline}
            </Typography>
            {product.landing_description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                {product.landing_description}
              </Typography>
            )}
            {highlights.length > 0 && (
              <Box component="ul" sx={{ pl: 2.5, mb: 3, color: "text.secondary" }}>
                {highlights.map((h) => (
                  <Typography component="li" variant="body2" key={h} sx={{ mb: 0.5 }}>{h}</Typography>
                ))}
              </Box>
            )}
            <CtaButtons product={product} color={color} compact={compact} preview={preview} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {product.hero_image_url ? (
              <HeroImage url={product.hero_image_url} alt={headline} compact={compact} />
            ) : embedUrl ? (
              <VideoBlock embedUrl={embedUrl} compact={compact} />
            ) : (
              <Box
                sx={{
                  height: compact ? 160 : 360,
                  borderRadius: 3,
                  background: `linear-gradient(145deg, ${color}22, ${color}44)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed",
                  borderColor: `${color}66`,
                }}
              >
                <Typography color="text.secondary" variant="body2">Add a hero image URL</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
      <ContactSection product={product} preview={preview} color={color} compact={compact} />
    </Box>
  );
}

function PageTradeShow({ product, color, headline, highlights, embedUrl, preview, compact }: PageProps) {
  return (
    <Box>
      <Box sx={{ bgcolor: color, color: "white", py: compact ? 1 : 1.5, textAlign: "center" }}>
        <Typography variant={compact ? "caption" : "subtitle2"} sx={{ fontWeight: 700, letterSpacing: 1 }}>
          {product.campaign_name.toUpperCase()}
        </Typography>
      </Box>
      <Box sx={{ bgcolor: "#0f172a", color: "white", py: compact ? 3 : 6, textAlign: "center" }}>
        <Container maxWidth="md">
          {product.logo_url && (
            <Box sx={{ mb: 2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.logo_url} alt="" style={{ maxHeight: compact ? 48 : 80 }} />
            </Box>
          )}
          <Typography variant={compact ? "h5" : "h3"} sx={{ fontWeight: 800, mb: 1 }}>{headline}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>{product.product_type}</Typography>
          {product.landing_description && (
            <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 560, mx: "auto" }}>
              {product.landing_description}
            </Typography>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: compact ? 2 : 4 }}>
        <Grid container spacing={compact ? 2 : 3}>
          <Grid size={{ xs: 12, md: 7 }}>
            {product.hero_image_url && (
              <Box sx={{ mb: 2 }}>
                <HeroImage url={product.hero_image_url} alt={headline} compact={compact} />
              </Box>
            )}
            {embedUrl && <VideoBlock embedUrl={embedUrl} compact={compact} />}
            {highlights.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Highlights items={highlights} color={color} compact={compact} />
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <CtaButtons product={product} color={color} compact={compact} preview={preview} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            {product.contact_form_enabled && (
              <Paper elevation={compact ? 0 : 4} sx={{ p: compact ? 2 : 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Visit us at the booth</Typography>
                <LeadForm productCode={product.unique_code} preview={preview} accentColor={preview ? undefined : color} />
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function PageMediaCenter({ product, color, headline, embedUrl, preview, compact }: PageProps) {
  return (
    <Box sx={{ bgcolor: "#0f172a", color: "white", minHeight: compact ? "auto" : "100vh" }}>
      <Container maxWidth="lg" sx={{ py: compact ? 2 : 4 }}>
        <Typography variant="overline" sx={{ opacity: 0.7 }}>{product.company_name}</Typography>
        <Typography variant={compact ? "h5" : "h3"} sx={{ fontWeight: 800, mt: 1, mb: 3 }}>{headline}</Typography>
        {embedUrl ? (
          <VideoBlock embedUrl={embedUrl} compact={compact} />
        ) : product.hero_image_url ? (
          <HeroImage url={product.hero_image_url} alt={headline} compact={compact} />
        ) : null}
        {product.landing_description && (
          <Typography variant="body1" sx={{ mt: 3, opacity: 0.85, lineHeight: 1.8, maxWidth: 720 }}>
            {product.landing_description}
          </Typography>
        )}
        <Box sx={{ mt: 3 }}>
          <CtaButtons product={product} color={color} compact={compact} inverted preview={preview} />
        </Box>
      </Container>
      <Box sx={{ bgcolor: "#f8fafc", color: "text.primary" }}>
        <ContactSection product={product} preview={preview} color={color} compact={compact} title="Request more info" />
      </Box>
    </Box>
  );
}

function PageNfcCard({ product, color, headline, preview, compact }: PageProps) {
  const { t, lang } = useCardLanguage();
  const jobTitle = product.highlight_1 || "";
  const phone = product.highlight_2 || "";
  const email = product.highlight_3 || "";
  const website = product.brand_website || "";
  const meetingUrl = product.meeting_url || "";
  const pdfUrl = product.pdf_url || "";
  const photoUrl = product.hero_image_url || "";
  const linkedinRaw = product.linkedin_url || "";
  const linkedinUrl = linkedinRaw ? normalizeLinkedInUrl(linkedinRaw) : "";
  const whatsappNumber = product.whatsapp || "";
  const contactVcardUrl =
    product.unique_code && product.unique_code !== "PREVIEW"
      ? getContactVcardUrl(product.unique_code)
      : undefined;

  const actions = [
    whatsappNumber && {
      label: t("whatsapp"),
      href: whatsappHref(whatsappNumber, cardWhatsAppGreeting(lang, headline)),
      icon: ChatOutlinedIcon,
      primary: true,
    },
    phone && {
      label: t("call"),
      href: `tel:${phone.replace(/\s/g, "")}`,
      icon: PhoneOutlinedIcon,
      primary: true,
    },
    meetingUrl && {
      label: t("schedule"),
      href: meetingUrl,
      icon: CalendarMonthOutlinedIcon,
      primary: true,
      trackMeeting: true,
    },
    email && { label: t("email"), href: `mailto:${email}`, icon: EmailOutlinedIcon, primary: false },
    linkedinUrl && { label: t("linkedin"), href: linkedinUrl, icon: WorkOutlineOutlinedIcon, primary: false },
    website && {
      label: t("website"),
      href: website.startsWith("http") ? website : `https://${website}`,
      icon: LanguageOutlinedIcon,
      primary: false,
    },
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: typeof PhoneOutlinedIcon;
    primary: boolean;
    trackMeeting?: boolean;
  }[];

  const primaryActions = actions.filter((a) => a.primary);
  const secondaryActions = actions.filter((a) => !a.primary);
  const canSaveContact = Boolean(headline && (phone || email));
  const showContactForm = product.contact_form_enabled;

  const isEmbedded = compact || preview;

  return (
    <Box
      sx={{
        minHeight: isEmbedded ? "auto" : "100vh",
        bgcolor: "#f8fafc",
        display: "flex",
        alignItems: isEmbedded ? "flex-start" : "center",
        justifyContent: isEmbedded ? "flex-start" : "center",
        py: isEmbedded ? 0 : 4,
        px: isEmbedded ? 0 : 2,
      }}
    >
      <Paper
        elevation={isEmbedded ? 0 : 4}
        sx={{
          width: "100%",
          maxWidth: isEmbedded ? "100%" : 420,
          borderRadius: isEmbedded ? 0 : 3,
          overflow: "hidden",
          border: isEmbedded ? "none" : "none",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${color} 0%, #1e293b 100%)`,
            color: "white",
            px: 3,
            pt: 3,
            pb: photoUrl ? 7 : 5,
            textAlign: "center",
            position: "relative",
          }}
        >
          {product.logo_url && (
            <Box
              sx={{
                position: "absolute",
                top: compact ? 10 : 14,
                left: compact ? 10 : 14,
                zIndex: 1,
                bgcolor: "rgba(255,255,255,0.95)",
                borderRadius: 1.5,
                px: 1,
                py: 0.75,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.logo_url}
                alt=""
                style={{ maxHeight: compact ? 28 : 40, maxWidth: compact ? 72 : 96, display: "block" }}
              />
            </Box>
          )}
          {photoUrl && (
            <Box
              sx={{
                width: compact ? 120 : 152,
                height: compact ? 120 : 152,
                borderRadius: "50%",
                mx: "auto",
                mb: 2,
                mt: compact ? 0.5 : 1,
                overflow: "hidden",
                border: "4px solid rgba(255,255,255,0.85)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          )}
          <Typography
            variant={compact ? "h6" : "h4"}
            sx={{ fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center" }}
          >
            {headline}
          </Typography>
          {jobTitle && (
            <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.92, textAlign: "center" }}>
              {jobTitle}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.75, textAlign: "center" }}>
            {product.company_name}
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 3, mt: -2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              textAlign: "center",
            }}
          >
            {!preview && <CardLanguageToggle compact={compact} />}
            {product.landing_description && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 2.5 }}>
                {product.landing_description}
              </Typography>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {primaryActions.map(({ label, href, icon: Icon, trackMeeting }) => (
                <Button
                  key={label}
                  variant="contained"
                  fullWidth
                  component={preview ? "button" : "a"}
                  href={preview ? undefined : href}
                  target={preview || label === t("call") ? undefined : "_blank"}
                  rel={preview ? undefined : "noopener"}
                  onClick={
                    preview || !trackMeeting
                      ? undefined
                      : (e: MouseEvent) => {
                          e.preventDefault();
                          openTrackedMeetingLink(product.unique_code, href, product.event_tag);
                        }
                  }
                  startIcon={<Icon />}
                  sx={{
                    justifyContent: "center",
                    py: 1.25,
                    bgcolor: color,
                    "&:hover": { bgcolor: color, filter: "brightness(0.92)" },
                  }}
                >
                  {label}
                </Button>
              ))}

              {canSaveContact && (
                <Button
                  variant="contained"
                  fullWidth
                  component={preview || !contactVcardUrl ? "button" : "a"}
                  href={preview || !contactVcardUrl ? undefined : contactVcardUrl}
                  disabled={preview || !contactVcardUrl}
                  startIcon={<ContactPageOutlinedIcon />}
                  sx={{
                    justifyContent: "center",
                    py: 1.25,
                    bgcolor: color,
                    "&:hover": { bgcolor: color, filter: "brightness(0.92)" },
                  }}
                >
                  {t("saveContact")}
                </Button>
              )}

              {secondaryActions.map(({ label, href, icon: Icon }) => (
                <Button
                  key={label}
                  variant="outlined"
                  fullWidth
                  component={preview ? "button" : "a"}
                  href={preview ? undefined : href}
                  target={preview || label === t("email") ? undefined : "_blank"}
                  rel={preview ? undefined : "noopener"}
                  startIcon={<Icon />}
                  sx={{
                    justifyContent: "center",
                    py: 1.25,
                    borderColor: "divider",
                    color: "text.primary",
                    "&:hover": { borderColor: color, bgcolor: `${color}08` },
                  }}
                >
                  {label}
                </Button>
              ))}

              {pdfUrl && (
                <Button
                  variant="outlined"
                  fullWidth
                  component={preview ? "button" : "a"}
                  href={preview ? undefined : pdfUrl}
                  target={preview ? undefined : "_blank"}
                  rel={preview ? undefined : "noopener"}
                  sx={{ justifyContent: "center", py: 1.25, borderColor: "divider" }}
                >
                  {t("downloadProfile")}
                </Button>
              )}
            </Box>

            {showContactForm && (
              <NfcCardContactForm
                productCode={product.unique_code}
                preview={preview}
                accentColor={preview ? undefined : color}
                eventTag={product.event_tag}
              />
            )}

            {primaryActions.length === 0 && secondaryActions.length === 0 && !pdfUrl && !canSaveContact && !showContactForm && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                {t("emptyCard")}
              </Typography>
            )}
          </Paper>
        </Box>
      </Paper>
    </Box>
  );
}

function PageBrandStory({ product, color, headline, highlights, preview, compact }: PageProps) {
  return (
    <Box>
      <Box
        sx={{
          minHeight: compact ? 200 : 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          background: product.hero_image_url
            ? `linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.75)), url(${product.hero_image_url}) center/cover`
            : `linear-gradient(135deg, ${color} 0%, #1e293b 100%)`,
          color: "white",
          px: 2,
        }}
      >
        <Container maxWidth="md">
          {product.logo_url && (
            <Box sx={{ mb: 2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.logo_url} alt="" style={{ maxHeight: compact ? 40 : 72 }} />
            </Box>
          )}
          <Typography variant={compact ? "h5" : "h2"} sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            {headline}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.85 }}>{product.campaign_name}</Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: compact ? 2 : 5 }}>
        {product.landing_description && (
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: compact ? "0.875rem" : "1.125rem", lineHeight: 1.9, mb: 4, textAlign: "center" }}>
            {product.landing_description}
          </Typography>
        )}
        {highlights.length > 0 && <Highlights items={highlights} color={color} compact={compact} />}
      </Container>

      <ContactSection product={product} preview={preview} color={color} compact={compact} />
    </Box>
  );
}

function BlockCtaButtons({
  pdfUrl,
  meetingUrl,
  color,
  compact,
  align = "center",
  code,
  eventTag,
  preview,
}: {
  pdfUrl?: string;
  meetingUrl?: string;
  color: string;
  compact?: boolean;
  align?: "left" | "center";
  code?: string;
  eventTag?: string | null;
  preview?: boolean;
}) {
  if (!pdfUrl && !meetingUrl) return null;
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        justifyContent: align === "center" ? "center" : "flex-start",
      }}
    >
      {pdfUrl && (
        <Button
          variant="outlined"
          size={compact ? "small" : "medium"}
          href={pdfUrl}
          target="_blank"
          rel="noopener"
          sx={{ borderColor: color, color }}
        >
          Download brochure
        </Button>
      )}
      {meetingUrl && (
        <Button
          variant="contained"
          size={compact ? "small" : "medium"}
          component={preview ? "button" : "a"}
          href={preview ? undefined : meetingUrl}
          target={preview ? undefined : "_blank"}
          rel={preview ? undefined : "noopener"}
          onClick={
            preview
              ? undefined
              : (e: MouseEvent) => {
                  e.preventDefault();
                  openTrackedMeetingLink(code ?? "", meetingUrl, eventTag);
                }
          }
          sx={{ bgcolor: color, color: "white", "&:hover": { bgcolor: color, filter: "brightness(0.92)" } }}
        >
          Book a demo
        </Button>
      )}
    </Box>
  );
}

function SpacerBlock({ size, compact }: { size?: "sm" | "md" | "lg"; compact?: boolean }) {
  const heights = compact
    ? { sm: 12, md: 24, lg: 36 }
    : { sm: 24, md: 48, lg: 72 };
  return <Box sx={{ height: heights[size ?? "md"] }} />;
}

function CustomBlock({
  block,
  product,
  color,
  preview,
  compact,
}: {
  block: LandingBlock;
  product: LandingPreviewData;
  color: string;
  preview: boolean;
  compact?: boolean;
}) {
  switch (block.type) {
    case "hero":
      return (
        <Box
          sx={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 50%, #0f172a 100%)`,
            color: "white",
            py: compact ? 3 : { xs: 5, sm: 8 },
            px: compact ? 2 : 0,
          }}
        >
          <Container maxWidth="lg">
            {block.logo_url && (
              <Box sx={{ mb: 2 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.logo_url} alt="" style={{ maxHeight: compact ? 36 : 56, filter: "brightness(0) invert(1)" }} />
              </Box>
            )}
            {block.show_campaign !== false && (
              <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 2 }}>
                {product.campaign_name}
              </Typography>
            )}
            {block.headline && (
              <Typography
                variant={compact ? "h5" : "h2"}
                sx={{ fontWeight: 800, mt: 1, mb: 2, maxWidth: 720, letterSpacing: "-0.03em" }}
              >
                {block.headline}
              </Typography>
            )}
            {block.description && (
              <Typography
                variant={compact ? "body2" : "h6"}
                sx={{ opacity: 0.9, maxWidth: 600, fontWeight: 400, lineHeight: 1.6 }}
              >
                {block.description}
              </Typography>
            )}
          </Container>
        </Box>
      );
    case "text":
      return (
        <Container maxWidth="md" sx={{ py: compact ? 2 : 4 }}>
          <Box sx={{ textAlign: block.align === "center" ? "center" : "left" }}>
            {block.headline && (
              <Typography variant={compact ? "h6" : "h4"} sx={{ fontWeight: 700, mb: 1.5 }}>
                {block.headline}
              </Typography>
            )}
            {block.body && (
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {block.body}
              </Typography>
            )}
          </Box>
        </Container>
      );
    case "highlights": {
      const items = (block.items ?? []).filter(Boolean);
      if (items.length === 0) return null;
      return (
        <Container maxWidth="lg" sx={{ py: compact ? 2 : 4 }}>
          <Highlights items={items} color={color} compact={compact} />
        </Container>
      );
    }
    case "image":
      if (!block.image_url) return null;
      return (
        <Container maxWidth="lg" sx={{ py: compact ? 1 : 3 }}>
          <HeroImage url={block.image_url} alt={block.alt || block.headline || product.product_type} compact={compact} />
          {block.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
              {block.description}
            </Typography>
          )}
        </Container>
      );
    case "video": {
      const embedUrl = block.video_url ? youtubeEmbedUrl(block.video_url) : null;
      if (!embedUrl) return null;
      return (
        <Container maxWidth="lg" sx={{ py: compact ? 1 : 3 }}>
          <VideoBlock embedUrl={embedUrl} compact={compact} />
        </Container>
      );
    }
    case "cta_buttons":
      return (
        <Container maxWidth="lg" sx={{ py: compact ? 2 : 3 }}>
          <BlockCtaButtons
            pdfUrl={block.pdf_url}
            meetingUrl={block.meeting_url}
            color={color}
            compact={compact}
            align={block.align}
            code={product.unique_code}
            eventTag={product.event_tag}
            preview={preview}
          />
        </Container>
      );
    case "contact_form":
      return (
        <ContactSection
          product={product}
          preview={preview}
          color={color}
          compact={compact}
          title={block.title || "Let's connect"}
          enabled
        />
      );
    case "spacer":
      return <SpacerBlock size={block.size} compact={compact} />;
    default:
      return null;
  }
}

function PageCustom({
  product,
  color,
  preview,
  compact,
}: {
  product: LandingPreviewData;
  color: string;
  preview: boolean;
  compact?: boolean;
}) {
  const blocks = product.landing_blocks ?? [];
  if (blocks.length === 0) {
    return (
      <Box sx={{ py: compact ? 4 : 8, textAlign: "center" }}>
        <Typography color="text.secondary">Add sections in the page builder to preview your custom layout.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {blocks.map((block) => (
        <CustomBlock key={block.id} block={block} product={product} color={color} preview={preview} compact={compact} />
      ))}
    </Box>
  );
}

type PageProps = {
  product: LandingPreviewData;
  color: string;
  headline: string;
  highlights: string[];
  embedUrl: string | null;
  preview: boolean;
  compact?: boolean;
};

export default function LandingPageRenderer({
  product,
  preview = false,
  compact = false,
}: {
  product: LandingPreviewData;
  preview?: boolean;
  compact?: boolean;
}) {
  const color = product.primary_color || "#4f46e5";
  const template = normalizeTemplate(product.landing_template || "showcase");
  const headline = product.landing_headline || product.product_type;
  const embedUrl = product.video_url ? youtubeEmbedUrl(product.video_url) : null;
  const highlights = [product.highlight_1, product.highlight_2, product.highlight_3].filter(
    (h): h is string => Boolean(h)
  );

  const props: PageProps = { product, color, headline, highlights, embedUrl, preview, compact };

  const page =
    template === "custom" ? (
      <PageCustom product={product} color={color} preview={preview} compact={compact} />
    ) : template === "nfc_card" ? (
      <PageNfcCard {...props} />
    ) : template === "split" ? (
      <PageSplit {...props} />
    ) : template === "trade_show" ? (
      <PageTradeShow {...props} />
    ) : template === "media_center" ? (
      <PageMediaCenter {...props} />
    ) : template === "brand_story" ? (
      <PageBrandStory {...props} />
    ) : (
      <PageShowcase {...props} />
    );

  return (
    <Box>
      {page}
      {!compact && template !== "nfc_card" && (
        <Box sx={{ py: 3, textAlign: "center", bgcolor: "#f8fafc", borderTop: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary">
            Powered by {APP_NAME}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
