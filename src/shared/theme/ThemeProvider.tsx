"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export const THEME_IDS = ["ink", "terra", "frost", "noir", "citrus"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

const THEME_META: Record<ThemeId, { label: string; description: string }> = {
  ink: { label: "Ink", description: "Dark industrial with teal accents" },
  terra: { label: "Terra", description: "Warm earth tones, organic shapes" },
  frost: { label: "Frost", description: "Cool precision, arctic clarity" },
  noir: { label: "Noir", description: "Dark luxe with rose highlights" },
  citrus: { label: "Citrus", description: "Bold energy, emerald contrast" },
};

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  meta: typeof THEME_META;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "ink",
  setTheme: () => {},
  meta: THEME_META,
});

const STORAGE_KEY = "mp-theme";

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return "ink";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEME_IDS.includes(stored as ThemeId)) return stored as ThemeId;
  return "ink";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.setAttribute("data-theme", id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, meta: THEME_META }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
