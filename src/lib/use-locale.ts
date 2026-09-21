"use client";

import * as React from "react";
import {
  dictionaries,
  interpolate,
  UI_LOCALES,
  RTL_LOCALES,
  type UILocale,
} from "./i18n";

const STORAGE_KEY = "hf:ui-locale";
const DEFAULT_LOCALE: UILocale = "en";

// Read saved locale from localStorage (client-only).
function readSavedLocale(): UILocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as UILocale | null;
    if (saved && UI_LOCALES.some((l) => l.code === saved)) return saved;
  } catch {}
  return DEFAULT_LOCALE;
}

// Apply <html lang> + <html dir> based on locale.
function applyDocumentAttrs(locale: UILocale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

// Global subscriber pattern so the hook re-renders all consumers on locale change
// without requiring a context provider wrapper.
let currentLocale: UILocale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

function notifyAll() {
  for (const fn of listeners) fn();
}

// Initialize from localStorage on the client (once).
if (typeof window !== "undefined") {
  currentLocale = readSavedLocale();
  applyDocumentAttrs(currentLocale);
}

export function setLocale(next: UILocale) {
  if (next === currentLocale) return;
  currentLocale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  applyDocumentAttrs(next);
  notifyAll();
}

export function getLocale(): UILocale {
  return currentLocale;
}

export function useLocale(): {
  locale: UILocale;
  setLocale: (l: UILocale) => void;
  isRTL: boolean;
  locales: typeof UI_LOCALES;
  t: (key: string, params?: Record<string, string | number>) => string;
} {
  // subscribe to global locale changes
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);

  const locale = currentLocale;
  const isRTL = RTL_LOCALES.includes(locale);

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
      const val = (dict as Record<string, string>)[key];
      if (val === undefined) {
        // fallback to English
        const enVal = (dictionaries[DEFAULT_LOCALE] as Record<string, string>)[key];
        return enVal !== undefined ? interpolate(enVal, params) : String(key);
      }
      return interpolate(val, params);
    },
    [locale]
  );

  return {
    locale,
    setLocale,
    isRTL,
    locales: UI_LOCALES,
    t,
  };
}
