"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Accent theme presets — apply a data-accent attribute on <html> so CSS can recolor gradients.
export type AccentTheme = "violet" | "emerald" | "amber" | "rose" | "cyan" | "fuchsia";

export const ACCENT_THEMES: { id: AccentTheme; label: string; colors: string; swatch: string }[] = [
  { id: "violet", label: "Violet", colors: "#7c3aed #d946ef #ec4899", swatch: "from-violet-500 via-fuchsia-500 to-pink-500" },
  { id: "emerald", label: "Emerald", colors: "#059669 #10b981 #14b8a6", swatch: "from-emerald-500 via-teal-500 to-cyan-500" },
  { id: "amber", label: "Amber", colors: "#f59e0b #f97316 #ef4444", swatch: "from-amber-500 via-orange-500 to-red-500" },
  { id: "rose", label: "Rose", colors: "#f43f5e #ec4899 #d946ef", swatch: "from-rose-500 via-pink-500 to-fuchsia-500" },
  { id: "cyan", label: "Cyan", colors: "#06b6d4 #0ea5e9 #3b82f6", swatch: "from-cyan-500 via-sky-500 to-blue-500" },
  { id: "fuchsia", label: "Fuchsia", colors: "#c026d3 #a21caf #86198f", swatch: "from-fuchsia-500 via-purple-500 to-violet-500" },
];

const STORAGE_KEY = "hf:accent";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    // Load saved accent
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AccentTheme | null;
      if (saved) document.documentElement.setAttribute("data-accent", saved);
    } catch {}
  }, []);
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function useAccentTheme() {
  const [accent, setAccentState] = React.useState<AccentTheme>("violet");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AccentTheme | null;
      if (saved) setAccentState(saved);
    } catch {}
  }, []);

  const setAccent = React.useCallback((next: AccentTheme) => {
    setAccentState(next);
    document.documentElement.setAttribute("data-accent", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return { accent, setAccent };
}
