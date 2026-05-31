"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function ContentCard({
  title,
  action,
  children,
  noPadding,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      {title && (
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {action}
        </Box>
      )}
      <Box sx={noPadding ? undefined : { p: title ? 0 : 0 }}>{children}</Box>
    </Paper>
  );
}
