"use client";

import { useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function TrackScan({ code }: { code: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    fetch(`${API_URL}/track/${encodeURIComponent(code)}`, {
      method: "POST",
    }).catch(() => {
      // Silent fail — landing page still renders
    });
  }, [code]);

  return null;
}
