"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import MarketingPage from "@/components/marketing/MarketingPage";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  return <MarketingPage />;
}
