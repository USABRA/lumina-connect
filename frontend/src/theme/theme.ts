"use client";

import { createTheme, alpha } from "@mui/material/styles";

const primary = "#0f172a";
const accent = "#6366f1";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: accent,
      light: "#818cf8",
      dark: primary,
    },
    secondary: {
      main: "#0ea5e9",
    },
    success: { main: "#10b981" },
    warning: { main: "#f59e0b" },
    background: {
      default: "#f1f5f9",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    divider: "#e2e8f0",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${alpha("#64748b", 0.4)} transparent`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "8px 16px",
        },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: "1px solid",
          borderColor: "#e2e8f0",
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: "#e2e8f0",
          borderRadius: 16,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#f8fafc",
          "& .MuiTableCell-head": {
            fontWeight: 600,
            color: "#64748b",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: "2px 12px",
          padding: "10px 12px",
          "&.Mui-selected": {
            backgroundColor: alpha(accent, 0.1),
            "&:hover": { backgroundColor: alpha(accent, 0.14) },
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          minWidth: 480,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "@media (pointer: coarse)": {
            minWidth: 44,
            minHeight: 44,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          margin: 16,
          width: "calc(100% - 32px)",
        },
      },
    },
  },
});
