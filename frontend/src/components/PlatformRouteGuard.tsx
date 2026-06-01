"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { isPlatformAdmin } from "@/lib/permissions";

export default function PlatformRouteGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const blocked = !loading && profile && !isPlatformAdmin(profile.is_platform_admin);

  useEffect(() => {
    if (blocked) {
      router.replace("/dashboard");
    }
  }, [blocked, router]);

  if (loading) {
    return null;
  }

  if (blocked) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="warning">Platform oversight is restricted to Lumina Connect platform admins.</Alert>
      </Box>
    );
  }

  return <>{children}</>;
}
