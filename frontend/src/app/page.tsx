"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import MarketingPage from "@/components/marketing/MarketingPage";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { firebaseUser, loading, firebaseReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (firebaseReady && !loading && firebaseUser) {
      router.replace("/dashboard");
    }
  }, [firebaseReady, loading, firebaseUser, router]);

  return <MarketingPage />;
}
