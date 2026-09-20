"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Clapperboard,
  FolderOpen,
  LayoutTemplate,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useApp, type ViewName } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  id: ViewName;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Ana Sayfa", icon: LayoutDashboard },
  { id: "create", label: "Video Oluştur", icon: Clapperboard },
  { id: "projects", label: "Projelerim", icon: FolderOpen },
  { id: "templates", label: "Şablonlar", icon: LayoutTemplate },
  { id: "settings", label: "Ayarlar", icon: Settings },
];

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative size-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30 grid place-items-center overflow-hidden">
        <div className="absolute inset-0 animated-gradient bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 opacity-90" />
        <span className="relative font-bold text-white text-sm tracking-tight">
          HF
        </span>
      </div>
      {!compact && (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">
            Hyperframe
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Studio
          </span>
        </div>
      )}
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const view = useApp((s) => s.view);
  const go = useApp((s) => s.go);
  const setWizard = useApp((s) => s.setWizard);

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = view === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === "create") {
                // pre-set defaults only when not coming from create; preserve prior wizard if already there
                if (view !== "create") {
                  setWizard({ step: 0 });
                }
              }
              go(item.id);
              onNavigate?.();
            }}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
              "min-h-[44px] w-full text-left",
              active
                ? "bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-transparent text-foreground font-medium ring-1 ring-fuchsia-500/20"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "grid size-8 place-items-center rounded-lg transition-colors",
                active
                  ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/30"
                  : "bg-muted text-muted-foreground group-hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
            </span>
            <span>{item.label}</span>
            {active && (
              <span className="ml-auto size-1.5 rounded-full bg-fuchsia-500" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function NewVideoButton({ onClick }: { onClick?: () => void }) {
  const go = useApp((s) => s.go);
  const setWizard = useApp((s) => s.setWizard);
  return (
    <Button
      onClick={() => {
        setWizard({ step: 0 });
        go("create");
        onClick?.();
      }}
      className="w-full min-h-[44px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:opacity-90 text-white shadow-lg shadow-fuchsia-500/30 border-0"
    >
      <Sparkles className="size-4" />
      Yeni Video
    </Button>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-1 py-2">
        <BrandLogo />
      </div>
      <NewVideoButton onClick={onNavigate} />
      <div className="flex-1 overflow-y-auto scrollbar-thin -mx-1 px-1">
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Hyperframe Studio</span>{" "}
          · z-ai-web-dev-sdk ile çalışır. LLM, TTS, VLM ve görsel üretimi yerleşik
          olarak desteklenir.
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  // Desktop fixed sidebar
  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 md:left-0 border-r border-border bg-sidebar/60 backdrop-blur-xl z-30">
      <SidebarInner />
    </aside>
  );
}

export function MobileNav() {
  const open = useApp((s) => s.mobileNavOpen);
  const setOpen = useApp((s) => s.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="w-72 max-w-[85vw] p-0 bg-sidebar/95 backdrop-blur-xl"
      >
        <SheetTitle className="sr-only">Menü</SheetTitle>
        <div className="flex items-center justify-between p-4 pb-2">
          <BrandLogo />
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SidebarInner onNavigate={() => setOpen(false)} />
        </div>
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
