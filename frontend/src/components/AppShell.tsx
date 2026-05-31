"use client";

import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import NfcIcon from "@mui/icons-material/Nfc";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { isAdmin } from "@/lib/permissions";

const drawerWidth = 260;

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon, adminOnly: false },
  { label: "Business cards", href: "/products", icon: NfcIcon, adminOnly: false },
  { label: "Team organization", href: "/team", icon: AccountTreeOutlinedIcon, adminOnly: true },
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
  "/leads": "Leads",
  "/meetings": "Meetings",
  "/analytics": "Analytics",
  "/enterprise": "Enterprise",
  "/settings": "Brand kit",
  "/account": "Account",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const pageTitle = pageTitles[pathname] ?? APP_NAME;
  const userIsAdmin = isAdmin(profile?.user.role);
  const visibleNavItems = navItems.filter((item) => userIsAdmin || !item.adminOnly);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "#0f172a",
            color: "#f8fafc",
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <NfcIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, color: "white" }}>
              {APP_NAME}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              {APP_TAGLINE}
            </Typography>
          </Box>
        </Box>

        <List component="nav" sx={{ px: 0, flex: 1 }}>
          {visibleNavItems.map(({ label, href, icon: Icon }) => {
            const selected = pathname === href;
            return (
              <ListItemButton
                key={href}
                component={Link}
                href={href}
                selected={selected}
                sx={{
                  color: selected ? "white" : "#cbd5e1",
                  "&.Mui-selected": {
                    bgcolor: "rgba(99, 102, 241, 0.25)",
                    "&:hover": { bgcolor: "rgba(99, 102, 241, 0.32)" },
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
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
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.1)",
                bgcolor: "rgba(255,255,255,0.04)",
                py: 1.5,
                color: "#e2e8f0",
                "&.Mui-selected": { bgcolor: "rgba(99, 102, 241, 0.2)" },
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
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box
          component="header"
          sx={{
            height: 64,
            px: { xs: 2, md: 4 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {pageTitle}
          </Typography>
          {profile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={userIsAdmin ? "Admin" : "Member"}
                size="small"
                color={userIsAdmin ? "primary" : "default"}
                variant="outlined"
                sx={{ display: { xs: "none", sm: "flex" } }}
              />
              <Tooltip title="Account menu">
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small" aria-label="Account menu">
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

        <Box sx={{ flex: 1, px: { xs: 2, md: 4 }, py: 4, maxWidth: 1280, width: "100%" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
