"use client";

import { create } from "zustand";
import type { VideoProject, VideoMode, Tone, VideoStyle, AspectRatio } from "@/lib/types";

export type ViewName =
  | "home"
  | "create"
  | "projects"
  | "detail"
  | "settings"
  | "templates";

interface AppState {
  // navigation
  view: ViewName;
  detailId: string | null;
  go: (view: ViewName, detailId?: string | null) => void;

  // create wizard state (persisted across wizard steps)
  wizard: WizardState;
  setWizard: (patch: Partial<WizardState>) => void;
  resetWizard: () => void;

  // sidebar (mobile)
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;

  // projects cache (simple)
  projects: VideoProject[];
  setProjects: (p: VideoProject[]) => void;
}

export interface WizardState {
  mode: VideoMode;
  topic: string;
  title: string;
  language: string;
  llmProvider: string;
  ttsProvider: string;
  voice: string;
  tone: Tone;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  targetScenes: number;
  productImages: string[]; // data urls
  customScript: string;
  step: number; // 0..3
}

const initialWizard: WizardState = {
  mode: "topic",
  topic: "",
  title: "",
  language: "tr",
  llmProvider: "zai",
  ttsProvider: "zai",
  voice: "tongtong",
  tone: "professional",
  style: "modern",
  aspectRatio: "16:9",
  targetScenes: 5,
  productImages: [],
  customScript: "",
  step: 0,
};

export const useApp = create<AppState>((set) => ({
  view: "home",
  detailId: null,
  go: (view, detailId = null) =>
    set({ view, detailId, mobileNavOpen: false }),
  wizard: initialWizard,
  setWizard: (patch) => set((s) => ({ wizard: { ...s.wizard, ...patch } })),
  resetWizard: () => set({ wizard: initialWizard }),
  mobileNavOpen: false,
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  projects: [],
  setProjects: (p) => set({ projects: p }),
}));
