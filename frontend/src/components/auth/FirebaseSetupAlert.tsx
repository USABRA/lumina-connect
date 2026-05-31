"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { useAuth } from "@/contexts/AuthContext";

export default function FirebaseSetupAlert() {
  const { firebaseReady } = useAuth();

  if (firebaseReady) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity={process.env.NODE_ENV === "production" ? "warning" : "info"}>
        {process.env.NODE_ENV === "production"
          ? "Firebase não está configurado neste deploy. Defina as 4 variáveis NEXT_PUBLIC_FIREBASE_* na Vercel e faça um novo deploy."
          : "Running in local auth mode. Sign in with email and password — no Firebase setup required."}
      </Alert>
    </Box>
  );
}
