"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { useAuth } from "@/contexts/AuthContext";

export default function FirebaseSetupAlert() {
  const { firebaseReady } = useAuth();

  if (firebaseReady) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="info">
        Running in local auth mode. Sign in with email and password — no Firebase setup required.
      </Alert>
    </Box>
  );
}
