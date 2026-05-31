"use client";

import { useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function TrackScan({
  code,
  eventTag,
}: {
  code: string;
  eventTag?: string | null;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const params = new URLSearchParams();
    if (eventTag?.trim()) params.set("event", eventTag.trim());
    const query = params.toString();

    fetch(`${API_URL}/track/${encodeURIComponent(code)}${query ? `?${query}` : ""}`, {
      method: "POST",
    }).catch(() => {
      // Silent fail — landing page still renders
    });
  }, [code, eventTag]);

  return null;
}
