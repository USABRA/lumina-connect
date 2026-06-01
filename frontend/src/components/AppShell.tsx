"use client";

import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import NfcIcon from "@mui/icons-material/Nfc";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME, APP_TAGLINE, DEFAULT_BRAND_COLOR, hexToRgba } from "@/lib/branding";
import { isAdmin, isPlatformAdmin } from "@/lib/permissions";

const drawerWidth = 260;

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon, adminOnly: false },
  { label: "Business cards", href: "/products", icon: NfcIcon, adminOnly: false },
  { label: "Team organization", href: "/team", icon: AccountTreeOutlinedIcon, adminOnly: true },
  { label: "Team members", href: "/team/members", icon: PeopleOutlinedIcon, adminOnly: true },
  { label: "Leads", href: "/leads", icon: PeopleOutlinedIcon, adminOnly: false },
  { label: "Meetings", href: "/meetings", icon: CalendarMonthOutlinedIcon, adminOnly: false },
  { label: "Analytics", href: "/analytics", icon: InsightsIcon, adminOnly: false },
  { label: "Enterprise", href: "/enterprise", icon: BusinessCenterOutlinedIcon, adminOnly: true },
  { label: "Brand kit", href: "/settings", icon: PaletteOutlinedIcon, adminOnly: true },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Business cards",
  "/team": "Team organization",
  "/team/members": "Team members",
  "/leads": "Leads",
  "/meetings": "Meetings",
  "/analytics": "Analytics",
  "/enterprise": "Enterprise",
  "/settings": "Brand kit",
  "/account": "Account",
};

const drawerPaperSx = {
  width: drawerWidth,
  maxWidth: "100vw",
  boxSizing: "border-box" as const,
  borderRight: "1px solid",
  borderColor: "divider",
  bgcolor: "#0f172a",
  color: "#f8fafc",
  overflowX: "hidden",
};

const sidebarBrandLogoSx = {
  display: "block",
  maxWidth: "100%",
  width: "auto",
  height: "auto",
  maxHeight: 48,
  objectFit: "contain" as const,
  flexShrink: 1,
  minWidth: 0,
};

const sidebarBrandBlockSx = {
  minWidth: 0,
  width: "100%",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  textAlign: "center" as const,
};

const sidebarBrandTitleSx = {
  fontWeight: 800,
  lineHeight: 1.2,
  color: "white",
  textAlign: "center" as const,
  width: "100%",
  wordBreak: "break-word" as const,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 2,
};

const sidebarBrandSubtitleSx = {
  color: "#94a3b8",
  textAlign: "center" as const,
  width: "100%",
  wordBreak: "break-word" as const,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 2,
  mt: 0.25,
};

type DrawerNavProps = {
  pathname: string;
  showPlatformNav: boolean;
  visibleNavItems: typeof navItems;
  navSelectedBg: string;
  navSelectedHoverBg: string;
  accountSelectedBg: string;
  brandLogoUrl: string | null;
  brandColor: string;
  sidebarTitle: string;
  sidebarSubtitle: string;
  profile: ReturnType<typeof useAuth>["profile"];
  onNavigate?: () => void;
};

function DrawerNav({
  pathname,
  showPlatformNav,
  visibleNavItems,
  navSelectedBg,
  navSelectedHoverBg,
  accountSelectedBg,
  brandLogoUrl,
  brandColor,
  sidebarTitle,
  sidebarSubtitle,
  profile,
  onNavigate,
}: DrawerNavProps) {
  return (
    <>
      <Box
        sx={{
          px: 2.5,
          py: 3,
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {brandLogoUrl ? (
          <Box sx={sidebarBrandBlockSx}>
            <Box
              component="img"
              src={brandLogoUrl}
              alt=""
              sx={{ ...sidebarBrandLogoSx, mb: 1 }}
            />
            <Typography variant="subtitle1" sx={sidebarBrandTitleSx}>
              {sidebarTitle}
            </Typography>
            <Typography variant="caption" sx={sidebarBrandSubtitleSx}>
              {sidebarSubtitle}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ ...sidebarBrandBlockSx, gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${hexToRgba(brandColor, 0.9)} 0%, ${brandColor} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                flexShrink: 0,
              }}
            >
              <NfcIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="subtitle1" sx={sidebarBrandTitleSx}>
              {sidebarTitle}
            </Typography>
            <Typography variant="caption" sx={sidebarBrandSubtitleSx}>
              {sidebarSubtitle}
            </Typography>
          </Box>
        )}
      </Box>

      <List component="nav" sx={{ px: 0, flex: 1 }}>
        {showPlatformNav && (
          <ListItemButton
            component={Link}
            href="/platform"
            selected={pathname.startsWith("/platform")}
            onClick={onNavigate}
            sx={{
              color: pathname.startsWith("/platform") ? "white" : "#cbd5e1",
              "&.Mui-selected": {
                bgcolor: navSelectedBg,
                "&:hover": { bgcolor: navSelectedHoverBg },
              },
              "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 44, color: "inherit" }}>
              <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 22 }} />
            </ListItemIcon>
            <ListItemText
              primary="Platform"
              slotProps={{
                primary: {
                  sx: {
                    fontWeight: pathname.startsWith("/platform") ? 700 : 500,
                    fontSize: "0.9rem",
                  },
                },
              }}
            />
          </ListItemButton>
        )}
        {visibleNavItems.map(({ label, href, icon: Icon }) => {
          const selected = pathname === href;
          return (
            <ListItemButton
              key={href}
              component={Link}
              href={href}
              selected={selected}
              onClick={onNavigate}
              sx={{
                color: selected ? "white" : "#cbd5e1",
                "&.Mui-selected": {
                  bgcolor: navSelectedBg,
                  "&:hover": { bgcolor: navSelectedHoverBg },
                },
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 44, color: "inherit" }}>
                <Icon sx={{ fontSize: 22 }} />
              </ListItemIcon>
              <ListItemText
                primary={label}
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: selected ? 700 : 500,
                      fontSize: "0.9rem",
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {profile && (
        <Box sx={{ m: 2 }}>
          <ListItemButton
            component={Link}
            href="/account"
            selected={pathname === "/account"}
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.1)",
              bgcolor: "rgba(255,255,255,0.04)",
              py: 1.5,
              color: "#e2e8f0",
              "&.Mui-selected": { bgcolor: accountSelectedBg },
            }}
          >
            <ListItemIcon sx={{ minWidth: 44 }}>
              <UserAvatar name={profile.user.name} avatarUrl={profile.user.avatar_url} size={36} />
            </ListItemIcon>
            <ListItemText
              primary={profile.user.name}
              secondary={profile.company?.company_name ?? profile.user.email}
              slotProps={{
                primary: { noWrap: true, sx: { fontWeight: 600, fontSize: "0.875rem", color: "white" } },
                secondary: { noWrap: true, sx: { fontSize: "0.75rem", color: "#94a3b8" } },
              }}
            />
          </ListItemButton>
        </Box>
      )}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { profile, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = pageTitles[pathname] ?? APP_NAME;
  const userIsAdmin = isAdmin(profile?.user.role);
  const userIsPlatformAdmin = isPlatformAdmin(profile?.is_platform_admin);
  const visibleNavItems = navItems.filter((item) => userIsAdmin || !item.adminOnly);
  const showPlatformNav = userIsPlatformAdmin;

  const company = profile?.company;
  const brandLogoUrl = company?.brand_logo_url?.trim() || null;
  const brandColor = company?.brand_color?.trim() || DEFAULT_BRAND_COLOR;
  const sidebarTitle = brandLogoUrl
    ? company?.brand_display_name?.trim() || company?.company_name || APP_NAME
    : APP_NAME;
  const sidebarSubtitle = brandLogoUrl
    ? company?.brand_tagline?.trim() || APP_TAGLINE
    : APP_TAGLINE;
  const navSelectedBg = hexToRgba(brandColor, 0.25);
  const navSelectedHoverBg = hexToRgba(brandColor, 0.32);
  const accountSelectedBg = hexToRgba(brandColor, 0.2);

  const drawerNavProps: DrawerNavProps = {
    pathname,
    showPlatformNav,
    visibleNavItems,
    navSelectedBg,
    navSelectedHoverBg,
    accountSelectedBg,
    brandLogoUrl,
    brandColor,
    sidebarTitle,
    sidebarSubtitle,
    profile,
    onNavigate: isMobile ? () => setMobileOpen(false) : undefined,
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default", overflowX: "hidden" }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          [`& .MuiDrawer-paper`]: drawerPaperSx,
        }}
      >
        <DrawerNav {...drawerNavProps} />
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: drawerPaperSx,
        }}
      >
        <DrawerNav {...drawerNavProps} />
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box
          component="header"
          sx={{
            height: { xs: 56, sm: 64 },
            px: { xs: 1.5, sm: 2, md: 4 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0, flex: 1 }}>
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                edge="start"
                sx={{ flexShrink: 0 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
              {pageTitle}
            </Typography>
          </Box>
          {profile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
              <Chip
                label={userIsAdmin ? "Admin" : "Member"}
                size="small"
                color={userIsAdmin ? "primary" : "default"}
                variant="outlined"
                sx={{
                  display: { xs: "none", sm: "flex" },
                  ...(userIsAdmin && company?.brand_color
                    ? {
                        borderColor: brandColor,
                        color: brandColor,
                      }
                    : {}),
                }}
              />
              <Tooltip title="Account menu">
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Account menu">
                  <UserAvatar name={profile.user.name} avatarUrl={profile.user.avatar_url} size={32} />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {profile.user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {profile.user.email}
                  </Typography>
                </Box>
                <MenuItem component={Link} href="/account" onClick={() => setMenuAnchor(null)}>
                  <ListItemIcon>
                    <PersonOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  Account
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    logout();
                  }}
                  sx={{ color: "error.main" }}
                >
                  <ListItemIcon sx={{ color: "error.main" }}>
                    <LogoutOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, md: 4 },
            maxWidth: 1280,
            width: "100%",
            minWidth: 0,
            overflowX: "hidden",
            mx: { md: "auto" },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
