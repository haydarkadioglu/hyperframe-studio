"use client";

import * as React from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ACCENT_THEMES,
  useAccentTheme,
  type AccentTheme,
} from "@/components/app/theme-provider";

/**
 * <AccentPicker/> — floating theme picker.
 *
 * Renders a button showing the current accent as a small gradient swatch
 * plus the theme label. Popover shows a 3x2 grid of 6 accent swatches.
 * Selecting one updates <html data-accent> + localStorage and toasts.
 */
export function AccentPicker() {
  const { accent, setAccent } = useAccentTheme();
  const [open, setOpen] = React.useState(false);
  const current = ACCENT_THEMES.find((t) => t.id === accent) ?? ACCENT_THEMES[0];

  const handleSelect = (id: AccentTheme, label: string) => {
    setAccent(id);
    toast.success(`${label} teması uygulandı`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Tema rengi seç"
          className="gap-2 h-9 px-2 rounded-full"
        >
          <span
            aria-hidden
            className={cn(
              "size-5 rounded-full bg-gradient-to-br ring-1 ring-border shadow-inner",
              current.swatch
            )}
          />
          <span className="hidden sm:inline text-xs font-medium">
            {current.label}
          </span>
          <Palette className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[260px] p-3 glass-strong rounded-2xl border-border/60"
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Tema Rengi</p>
          <Palette className="size-3.5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ACCENT_THEMES.map((t) => {
            const active = t.id === accent;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id, t.label)}
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all hover-scale-105",
                  active
                    ? "bg-muted/60 ring-1 ring-foreground/20"
                    : "hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "relative grid size-10 place-items-center rounded-xl bg-gradient-to-br shadow-md ring-1 ring-border/40",
                    t.swatch
                  )}
                >
                  {active && (
                    <Check className="size-4 text-white drop-shadow" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground text-center">
          Tema rengi tüm vurgulara uygulanır.
        </p>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Inline (non-popover) variant for the Settings page appearance section.
 * Shows all 6 swatches in a row.
 */
export function AccentPickerInline() {
  const { accent, setAccent } = useAccentTheme();
  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_THEMES.map((t) => {
        const active = t.id === accent;
        return (
          <button
            key={t.id}
            onClick={() => {
              setAccent(t.id);
              toast.success(`${t.label} teması uygulandı`);
            }}
            aria-label={t.label}
            title={t.label}
            className={cn(
              "group relative grid size-10 place-items-center rounded-xl bg-gradient-to-br shadow-md ring-1 ring-border/40 transition-all hover-scale-105",
              t.swatch,
              active && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
            )}
          >
            {active && <Check className="size-4 text-white drop-shadow" />}
          </button>
        );
      })}
    </div>
  );
}
