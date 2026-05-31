"use client";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Box from "@mui/material/Box";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  CARD_LANG_OPTIONS,
  CARD_LANG_STORAGE_KEY,
  cardT,
  parseCardLang,
  type CardLang,
  type CardMessageKey,
} from "@/lib/cardI18n";

type CardLanguageContextValue = {
  lang: CardLang;
  setLang: (lang: CardLang) => void;
  t: (key: CardMessageKey) => string;
};

const CardLanguageContext = createContext<CardLanguageContextValue | null>(null);

export function useCardLanguage(): CardLanguageContextValue {
  const ctx = useContext(CardLanguageContext);
  if (!ctx) {
    throw new Error("useCardLanguage must be used within CardLanguageProvider");
  }
  return ctx;
}

export function CardLanguageToggle({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useCardLanguage();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mb: compact ? 1 : 1.5,
      }}
    >
      <ToggleButtonGroup
        size="small"
        exclusive
        value={lang}
        onChange={(_, value: CardLang | null) => {
          if (value) setLang(value);
        }}
        aria-label={cardT(lang, "language")}
      >
        {CARD_LANG_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value} sx={{ px: 1.5, py: 0.25, minWidth: 40 }}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

export default function CardLanguageProvider({
  children,
  initialLang,
  syncUrl = true,
}: {
  children: React.ReactNode;
  initialLang?: string | null;
  syncUrl?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlLang = searchParams.get("lang");

  const [lang, setLangState] = useState<CardLang>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(CARD_LANG_STORAGE_KEY);
      if (stored) return parseCardLang(stored);
    }
    return parseCardLang(urlLang ?? initialLang);
  });

  const setLang = useCallback(
    (next: CardLang) => {
      setLangState(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CARD_LANG_STORAGE_KEY, next);
      }
      if (!syncUrl) return;
      const params = new URLSearchParams(searchParams.toString());
      if (next === "pt") params.delete("lang");
      else params.set("lang", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, syncUrl]
  );

  useEffect(() => {
    if (urlLang) {
      setLangState(parseCardLang(urlLang));
    }
  }, [urlLang]);

  const t = useCallback((key: CardMessageKey) => cardT(lang, key), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <CardLanguageContext.Provider value={value}>{children}</CardLanguageContext.Provider>;
}
