"use client";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/** Returns true when dialogs should use fullScreen (phone / small tablet). */
export function useFullScreenDialog(breakpoint: "sm" | "md" = "sm") {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down(breakpoint));
}
