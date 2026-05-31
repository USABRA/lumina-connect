"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { useAuth } from "@/contexts/AuthContext";

export default function FirebaseSetupAlert() {
  const { firebaseReady } = useAuth();

  if (firebaseReady) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="warning">
        Firebase is not configured. Copy <code>frontend/.env.example</code> to{" "}
        <code>.env.local</code> and add your Firebase web app credentials.
      </Alert>
    </Box>
  );
}
