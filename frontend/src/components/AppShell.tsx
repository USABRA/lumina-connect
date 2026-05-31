"use client";

import CampaignIcon from "@mui/icons-material/Campaign";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
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

const drawerWidth = 260;

const navItems = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Campaigns", href: "/campaigns", icon: CampaignIcon },
  { label: "Products & QR", href: "/products", icon: QrCode2Icon },
  { label: "Leads", href: "/leads", icon: PeopleOutlinedIcon },
  { label: "Analytics", href: "/analytics", icon: InsightsIcon },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/campaigns": "Campaigns",
  "/products": "Products & QR",
  "/leads": "Leads",
  "/analytics": "Analytics",
  "/account": "Account",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const pageTitle = pageTitles[pathname] ?? "Lumina Connect";

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
            bgcolor: "background.paper",
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: "linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "1rem",
            }}
          >
            L
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Lumina
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Connect
            </Typography>
          </Box>
        </Box>

        <List component="nav" sx={{ px: 0, flex: 1 }}>
          {navItems.map(({ label, href, icon: Icon }) => {
            const selected = pathname === href;
            return (
              <ListItemButton
                key={href}
                component={Link}
                href={href}
                selected={selected}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon
                    sx={{
                      fontSize: 22,
                      color: selected ? "primary.main" : "text.secondary",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: selected ? 600 : 500,
                        fontSize: "0.9rem",
                        color: selected ? "primary.main" : "text.primary",
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
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
                py: 1.5,
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  borderColor: "primary.main",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <UserAvatar
                  name={profile.user.name}
                  avatarUrl={profile.user.avatar_url}
                  size={36}
                />
              </ListItemIcon>
              <ListItemText
                primary={profile.user.name}
                secondary={profile.company?.company_name ?? profile.user.email}
                slotProps={{
                  primary: {
                    noWrap: true,
                    sx: { fontWeight: 600, fontSize: "0.875rem" },
                  },
                  secondary: {
                    noWrap: true,
                    sx: { fontSize: "0.75rem" },
                  },
                }}
              />
              <SettingsOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
            </ListItemButton>
          </Box>
        )}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {pageTitle}
          </Typography>
          {profile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={profile.user.role === "admin" ? "Admin" : "Member"}
                size="small"
                variant="outlined"
                sx={{ display: { xs: "none", sm: "flex" } }}
              />
              <Tooltip title="Account menu">
                <IconButton
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  size="small"
                  aria-label="Account menu"
                >
                  <UserAvatar
                    name={profile.user.name}
                    avatarUrl={profile.user.avatar_url}
                    size={32}
                  />
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
                <MenuItem
                  component={Link}
                  href="/account"
                  onClick={() => setMenuAnchor(null)}
                >
                  <ListItemIcon>
                    <PersonOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  Account settings
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
