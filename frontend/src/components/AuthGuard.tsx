"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading, firebaseReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && firebaseReady && !firebaseUser) {
      router.replace("/login");
    }
  }, [loading, firebaseReady, firebaseUser, router]);

  if (!firebaseReady) {
    return (
      <Box>
        <Alert
          severity="info"
          sx={{
            borderRadius: 0,
            borderBottom: "1px solid",
            borderColor: "divider",
            justifyContent: "center",
          }}
        >
          Dev mode — running locally without Firebase login. Your cards and brand kit still work.
        </Alert>
        {children}
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return <>{children}</>;
}
