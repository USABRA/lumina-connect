"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isAdminOnlyPath } from "@/lib/permissions";

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const blocked =
    !loading &&
    profile &&
    isAdminOnlyPath(pathname) &&
    !isAdmin(profile.user.role);

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
        <Alert severity="warning">This area is only available to company admins.</Alert>
      </Box>
    );
  }

  return <>{children}</>;
}
