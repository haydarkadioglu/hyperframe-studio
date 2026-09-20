"use client";

import * as React from "react";
import { Check, Globe } from "lucide-react";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, locales, t } = useLocale();
  const current = locales.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={cn(
            "gap-1.5 text-muted-foreground hover:text-foreground",
            compact && "size-9 rounded-full"
          )}
          aria-label={t("nav.language")}
          title={t("nav.language")}
        >
          <Globe className="size-4" />
          {!compact && (
            <span className="flex items-center gap-1.5">
              <span className="text-base leading-none">{current?.flag}</span>
              <span className="hidden sm:inline">{current?.nativeName}</span>
            </span>
          )}
          {compact && <span className="text-base leading-none">{current?.flag}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>{t("nav.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => {
              setLocale(l.code);
              toast.success(l.nativeName);
            }}
            className={cn(
              "flex items-center justify-between gap-2 cursor-pointer",
              l.code === locale && "bg-accent"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{l.flag}</span>
              <span>{l.nativeName}</span>
            </span>
            {l.code === locale && <Check className="size-4 text-fuchsia-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
