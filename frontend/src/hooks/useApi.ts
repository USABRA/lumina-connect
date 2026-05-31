"use client";

import { useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, uploadImage as uploadImageApi } from "@/lib/api";

export function useApi() {
  const { getAccessToken } = useAuth();

  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = await getAccessToken();
      return apiFetch<T>(path, { ...options, token });
    },
    [getAccessToken]
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const token = await getAccessToken();
      return uploadImageApi(file, token);
    },
    [getAccessToken]
  );

  return { request, uploadImage };
}
