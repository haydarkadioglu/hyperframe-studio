"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLocale } from "@/lib/use-locale";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

export function Topbar() {
  const setMobileNavOpen = useApp((s) => s.setMobileNavOpen);
  const go = useApp((s) => s.go);
  const { t } = useLocale();

  return (
    <header className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-xl px-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("nav.menu")}
        className="size-10 rounded-xl"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <button
        onClick={() => go("home")}
        className="flex items-center gap-2.5"
        aria-label={t("nav.home")}
      >
        <div className="size-8 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 grid place-items-center shadow-md shadow-fuchsia-500/30">
          <span className="font-bold text-white text-xs">HF</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">
          {t("app.name")}
        </span>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher compact />
        <ThemeToggle />
      </div>
    </header>
  );
}
