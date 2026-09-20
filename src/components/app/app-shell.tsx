"use client";

import * as React from "react";
import { useApp } from "@/lib/store";
import { Sidebar, MobileNav } from "./sidebar";
import { Topbar } from "./topbar";
import { Footer } from "./footer";
import { ThemeToggle } from "./theme-toggle";
import { AccentPicker } from "./accent-picker";
import { LanguageSwitcher } from "./language-switcher";
import { HomeView } from "@/components/views/home-view";
import { CreateView } from "@/components/views/create-view";
import { ProjectsView } from "@/components/views/projects-view";
import { DetailView } from "@/components/views/detail-view";
import { SettingsView } from "@/components/views/settings-view";
import { TemplatesView } from "@/components/views/templates-view";
import { DashboardView } from "@/components/views/dashboard-view";

function DesktopThemeToggle() {
  return (
    <div className="hidden md:flex fixed bottom-4 right-4 z-40">
      <div className="rounded-full border border-border/60 bg-background/80 backdrop-blur-md shadow-lg p-1 flex items-center gap-0.5">
        <AccentPicker />
        <div className="w-px h-6 bg-border/60 mx-0.5" aria-hidden />
        <ThemeToggle />
        <LanguageSwitcher compact />
      </div>
    </div>
  );
}

export function AppShell() {
  const view = useApp((s) => s.view);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Sidebar />
      <MobileNav />
      <Topbar />
      <main className="flex-1 md:pl-72 w-full">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {view === "home" && <HomeView />}
          {view === "create" && <CreateView />}
          {view === "projects" && <ProjectsView />}
          {view === "detail" && <DetailView />}
          {view === "settings" && <SettingsView />}
          {view === "templates" && <TemplatesView />}
          {view === "dashboard" && <DashboardView />}
        </div>
      </main>
      <Footer />
      <DesktopThemeToggle />
    </div>
  );
}
