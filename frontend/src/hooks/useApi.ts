"use client";

import { useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

export function useApi() {
  const { firebaseUser } = useAuth();

  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = firebaseUser ? await firebaseUser.getIdToken() : undefined;
      return apiFetch<T>(path, { ...options, token });
    },
    [firebaseUser]
  );

  return { request };
}
