"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  AudioLines,
  Play,
  Clapperboard,
  Globe,
  Palette,
  Clock,
  Layers,
  Captions,
  Copy,
  PencilLine,
  Plus,
  X,
  Save,
  Image as ImageIcon,
  Share2,
  ScanSearch,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useLocale } from "@/lib/use-locale";
import {
  MODE_MAP,
  STYLE_MAP,
  LANGUAGE_MAP,
  TONE_MAP,
} from "@/lib/providers";
import {
  getProject,
  deleteProject,
  renderProject,
  downloadTextFile,
  downloadRemoteFile,
  formatDuration,
  timeAgo,
  duplicateProject,
  updateProject,
  generateImage,
  type ApiError,
} from "@/lib/api-client";
import type { VideoProject, Scene, SceneType, SceneAnimation } from "@/lib/types";
import { ScenePlayer } from "@/components/player/scene-player";
import { SceneThumbnail } from "@/components/player/scene-thumbnail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShareDialog } from "@/components/app/share-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SCENE_TYPES: { id: SceneType; label: string }[] = [
  { id: "title", label: "Title" },
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "quote", label: "Quote" },
  { id: "stats", label: "Stats" },
  { id: "cta", label: "CTA" },
];

const SCENE_ANIMATIONS: { id: SceneAnimation; label: string }[] = [
  { id: "fade", label: "Fade" },
  { id: "slide-up", label: "Slide up" },
  { id: "slide-left", label: "Slide left" },
  { id: "zoom", label: "Zoom" },
  { id: "bounce", label: "Bounce" },
  { id: "flip", label: "Flip" },
  { id: "ken-burns", label: "Ken Burns" },
];

const ACCENT_PRESETS = [
  "#7c3aed",
  "#d946ef",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#f43f5e",
  "#64748b",
];

export function DetailView() {
  const detailId = useApp((s) => s.detailId);
  const go = useApp((s) => s.go);
  const { t } = useLocale();
  const [project, setProject] = React.useState<VideoProject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const [rerendering, setRerendering] = React.useState(false);
  const [duplicating, setDuplicating] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);

  // Poll when generating
  React.useEffect(() => {
    if (!detailId) {
      setLoading(false);
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchOnce = async () => {
      try {
        const p = await getProject(detailId);
        if (!alive) return;
        setProject(p);
        setError(null);
        if (p.status === "generating") {
          timer = setTimeout(fetchOnce, 2500);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || t("common.error"));
      } finally {
        if (alive) setLoading(false);
      }
    };

    setLoading(true);
    fetchOnce();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [detailId, t]);

  const handleRerender = async () => {
    if (!project) return;
    setRerendering(true);
    try {
      await renderProject(project.id, {
        targetScenes: project.sceneCount || 5,
      });
      toast.success(t("create.started"));
      setProject({ ...project, status: "generating" });
    } catch (e: any) {
      toast.error(t("common.error"), { description: e?.message });
    } finally {
      setRerendering(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      toast.success(t("projects.deleted"));
      go("projects");
    } catch (e: any) {
      toast.error(t("common.error"), { description: e?.message });
    }
  };

  const handleDuplicate = async () => {
    if (!project) return;
    setDuplicating(true);
    try {
      const copy = await duplicateProject(project.id);
      toast.success(t("projects.duplicated"));
      if (copy.scenes && copy.scenes.length > 0) {
        go("detail", copy.id);
      } else {
        go("projects");
      }
    } catch (e: any) {
      toast.error(t("common.error"), { description: e?.message });
    } finally {
      setDuplicating(false);
    }
  };

  if (!detailId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          {t("common.error")}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <Card className="border-dashed border-rose-500/40">
        <CardContent className="py-12 text-center space-y-3">
          <AlertCircle className="size-8 text-rose-500 mx-auto" />
          <p className="font-medium">{t("common.error")}</p>
          <p className="text-sm text-muted-foreground">{error ?? t("detail.error.timeout")}</p>
          <Button variant="outline" onClick={() => go("projects")}>
            <ArrowLeft className="size-4" />
            {t("detail.back")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go("projects")}
          className="min-h-[40px]"
        >
          <ArrowLeft className="size-4" />
          {t("detail.back")}
        </Button>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {project.status === "ready" && (
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode((v) => !v)}
              className={cn(
                "min-h-[40px] card-hover-lift",
                editMode
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0"
                  : ""
              )}
            >
              <PencilLine className="size-4" />
              {editMode ? t("detail.finishEdit") : t("detail.editScenes")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="min-h-[40px] card-hover-lift"
          >
            {duplicating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Copy className="size-4" />
            )}
            {t("detail.duplicate")}
          </Button>
          <Button
            size="sm"
            onClick={() => setShareOpen(true)}
            className="min-h-[40px] accent-gradient text-white border-0 shine-on-hover shadow-lg shadow-fuchsia-500/30 relative overflow-hidden"
          >
            <Share2 className="size-4" />
            {t("detail.share")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRerender}
            disabled={rerendering || project.status === "generating"}
            className="min-h-[40px] card-hover-lift"
          >
            {rerendering ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("detail.regenerate")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPendingDelete(true)}
            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 min-h-[40px]"
          >
            <Trash2 className="size-4" />
            {t("common.delete")}
          </Button>
        </div>
      </div>

      {/* Title + meta */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="accent-bg-soft accent-text-soft accent-border">
            {MODE_MAP[project.mode]?.emoji} {t(`mode.${project.mode}.label`)}
          </Badge>
          <StatusBadge status={project.status} />
          <span className="text-xs text-muted-foreground">
            {timeAgo(project.createdAt)}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance accent-text glow-text">
          {project.title}
        </h1>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.topic}
        </p>
      </div>

      {/* Body */}
      <div className="divider-gradient" aria-hidden />
      {project.status === "generating" ? (
        <GeneratingView project={project} />
      ) : project.status === "error" ? (
        <ErrorView
          message={project.errorMessage || t("detail.error.timeout")}
          onRetry={handleRerender}
        />
      ) : editMode ? (
        <SceneEditor
          project={project}
          onSaved={(updated) => {
            setProject(updated);
            setEditMode(false);
          }}
          onCancel={() => setEditMode(false)}
        />
      ) : (
        <ReadyView project={project} onShare={() => setShareOpen(true)} />
      )}

      <AlertDialog open={pendingDelete} onOpenChange={setPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("projects.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">“{project.title}”</span>{" "}
              {t("projects.delete.desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareDialog project={project} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
}

function StatusBadge({ status }: { status: VideoProject["status"] }) {
  const { t } = useLocale();
  const map: Record<VideoProject["status"], string> = {
    draft: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    generating: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    error: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };
  const labelKey: Record<VideoProject["status"], string> = {
    draft: "common.draft",
    generating: "common.generating",
    ready: "common.ready",
    error: "common.error",
  };
  return (
    <Badge variant="outline" className={cn("border", map[status], status === "generating" && "pulse-glow")}>
      {status === "generating" && (
        <Loader2 className="size-3 animate-spin" />
      )}
      {t(labelKey[status])}
    </Badge>
  );
}

function GeneratingView({ project }: { project: VideoProject }) {
  const { t } = useLocale();
  const progress = project.progress;
  const stepOrder: Array<"analyzing" | "script" | "images" | "audio" | "subtitles" | "done"> = [
    "analyzing",
    "script",
    "images",
    "audio",
    "subtitles",
  ];
  const stepLabels: Record<string, { label: string; icon: typeof FileText }> = {
    analyzing: { label: t("detail.generating.analyze"), icon: ScanSearch },
    script: { label: t("detail.generating.script"), icon: FileText },
    images: { label: t("detail.generating.images"), icon: Palette },
    audio: { label: t("detail.generating.audio"), icon: AudioLines },
    subtitles: { label: t("detail.generating.subtitles"), icon: CaptionsIcon },
  };
  const steps = stepOrder.map((s) => ({ id: s, ...stepLabels[s] }));

  // Determine active step from real progress (fallback to cycling animation)
  const realActiveIdx = progress
    ? stepOrder.indexOf(progress.step as any)
    : -1;
  const [cycleActive, setCycleActive] = React.useState(0);
  React.useEffect(() => {
    if (realActiveIdx >= 0) return; // use real progress
    const id = setInterval(() => {
      setCycleActive((a) => (a + 1) % steps.length);
    }, 2200);
    return () => clearInterval(id);
  }, [realActiveIdx, steps.length]);
  const active = realActiveIdx >= 0 ? realActiveIdx : cycleActive;

  // Compute percentage from progress
  let pct = 0;
  if (progress) {
    if (progress.step === "done") pct = 100;
    else if (progress.step === "analyzing") pct = 5;
    else if (progress.step === "script") pct = 15;
    else if (progress.step === "images" && progress.total > 0) {
      // images: 20%..75% range
      pct = 20 + Math.round((progress.done / progress.total) * 55);
    } else if (progress.step === "audio") pct = 80;
    else if (progress.step === "subtitles") pct = 92;
  }

  const styleInfo = STYLE_MAP[project.style];

  return (
    <div className="space-y-6">
      <Card
        className={cn(
          "overflow-hidden border-fuchsia-500/30 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10"
        )}
      >
        <CardContent className="py-10">
          <div className="max-w-xl mx-auto text-center">
            <div className="mx-auto mb-6 relative size-24">
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-gradient-to-br opacity-30 blur-2xl",
                  styleInfo?.gradient
                )}
              />
              <div className="relative grid place-items-center size-24 rounded-full bg-background border border-fuchsia-500/30 shadow-xl">
                <Loader2 className="size-9 text-fuchsia-500 animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-bold">{t("detail.generating.title")}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {progress?.message ? (
                <span className="font-medium text-fuchsia-400">{progress.message}</span>
              ) : (
                t("detail.generating.note")
              )}
            </p>

            {/* Percentage + progress bar */}
            {progress && (
              <div className="mt-4 max-w-md mx-auto">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{t("detail.generating.progress")}</span>
                  <span className="tabular-nums font-semibold text-foreground">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full accent-gradient"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-2 text-left max-w-md mx-auto">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const done = i < active;
                const isCurrent = i === active;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                      isCurrent
                        ? "border-fuchsia-500/50 bg-fuchsia-500/5"
                        : done
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-border bg-muted/40 opacity-60"
                    )}
                  >
                    <div
                      className={cn(
                        "grid size-8 place-items-center rounded-lg shrink-0",
                        isCurrent
                          ? "bg-fuchsia-500/20 text-fuchsia-400"
                          : done
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCurrent ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : done ? (
                        <Check />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block">{s.label}</span>
                      {/* Per-scene sub-progress for image step */}
                      {isCurrent && s.id === "images" && progress && progress.total > 0 && (
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {progress.done}/{progress.total}
                          {progress.sceneIdx !== undefined && progress.sceneIdx >= 0
                            ? ` · ${t("detail.generating.scene")} ${progress.sceneIdx + 1}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Scene thumbnail strip (shows as images arrive) */}
            {project.scenes && project.scenes.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                {project.scenes.map((sc, i) => (
                  <div
                    key={sc.id}
                    className={cn(
                      "relative size-12 rounded-lg overflow-hidden border-2 transition-all",
                      sc.imageUrl
                        ? "border-emerald-500/50"
                        : progress?.step === "images" && progress.sceneIdx === i
                        ? "border-fuchsia-500/70 pulse-glow"
                        : "border-border/50 opacity-50"
                    )}
                    title={sc.text?.slice(0, 40)}
                  >
                    {sc.imageUrl ? (
                      <img src={sc.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center bg-muted">
                        {sc.imageUrl ? (
                          <Check />
                        ) : progress?.step === "images" && progress.sceneIdx === i ? (
                          <Loader2 className="size-3.5 animate-spin text-fuchsia-400" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Check() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CaptionsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M7 12h3M14 12h3M7 15h6" />
    </svg>
  );
}

function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useLocale();
  return (
    <Card className="border-rose-500/40">
      <CardContent className="py-10 text-center space-y-4">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-rose-500/10 text-rose-500">
          <AlertCircle className="size-7" />
        </div>
        <div>
          <p className="font-semibold">{t("detail.error.title")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {message}
          </p>
        </div>
        <Button onClick={onRetry} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
          <RefreshCw className="size-4" />
          {t("detail.error.retry")}
        </Button>
      </CardContent>
    </Card>
  );
}

function ReadyView({ project, onShare }: { project: VideoProject; onShare: () => void }) {
  const { t } = useLocale();
  const modeInfo = MODE_MAP[project.mode];
  const styleInfo = STYLE_MAP[project.style];
  const langInfo = LANGUAGE_MAP[project.language];
  const toneInfo = TONE_MAP[project.tone];

  const [selectedScene, setSelectedScene] = React.useState(0);

  const downloadSrt = () => {
    if (!project.subtitles) {
      toast.error(t("common.error"));
      return;
    }
    downloadTextFile(`${slug(project.title)}.srt`, project.subtitles, "text/plain");
    toast.success(t("detail.download.srt"));
  };

  const downloadVtt = () => {
    if (!project.subtitles) {
      toast.error(t("common.error"));
      return;
    }
    const vtt = "WEBVTT\n\n" + project.subtitles.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    downloadTextFile(`${slug(project.title)}.vtt`, vtt, "text/vtt");
    toast.success(t("detail.download.vtt"));
  };

  const downloadAudio = () => {
    if (!project.audioUrl) {
      toast.error(t("common.error"));
      return;
    }
    downloadRemoteFile(project.audioUrl, `${slug(project.title)}.mp3`);
    toast.success(t("detail.download.audio"));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {/* Player stage with rotating gradient ring + orb depth */}
        <div className="relative">
          {/* Decorative orb behind player */}
          <div className="orb orb-md bg-violet-500/30 -top-10 -left-10 -z-10" />
          <div className="orb orb-sm bg-fuchsia-500/25 -bottom-12 right-4 -z-10" />
          {/* Gradient ring that subtly rotates on hover — recolors with accent */}
          <div className="group relative rounded-2xl p-[1.5px] accent-gradient overflow-hidden accent-player-glow">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-pink-500/30 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden">
              <ScenePlayer project={project} />
            </div>
          </div>
        </div>

        {/* Accent-aware divider between player and action bar */}
        <div className="divider-gradient" aria-hidden />

        {/* Action bar */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadSrt} className="min-h-[40px] card-hover-lift">
            <FileText className="size-4" />
            {t("detail.download.srt")}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadVtt} className="min-h-[40px] card-hover-lift">
            <Captions className="size-4" />
            {t("detail.download.vtt")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAudio}
            disabled={!project.audioUrl}
            className="min-h-[40px] card-hover-lift"
          >
            <Download className="size-4" />
            {t("detail.download.audio")}
          </Button>
          <Button
            size="sm"
            onClick={onShare}
            className="min-h-[40px] accent-gradient text-white border-0 shine-on-hover shadow-md shadow-fuchsia-500/30 relative overflow-hidden ml-auto"
          >
            <Share2 className="size-4" />
            {t("detail.share")}
          </Button>
        </div>
      </div>

      {/* Right panel: scenes list + meta */}
      <div className="space-y-4">
        <div className="divider-gradient lg:hidden" aria-hidden />
        <Card className="glass overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 animated-gradient-x" />
          <CardHeader>
            <CardTitle className="text-base">{t("common.all")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Meta icon={Clapperboard} label={t("detail.meta.mode")} value={modeInfo ? t(`mode.${project.mode}.label`) : undefined} />
            <Meta icon={Globe} label={t("detail.meta.language")} value={`${langInfo?.flag ?? ""} ${langInfo?.nativeName ?? ""}`} />
            <Meta icon={AudioLines} label={t("detail.meta.tone")} value={`${toneInfo?.emoji ?? ""} ${t(`tone.${project.tone}.label`)}`} />
            <Meta icon={Palette} label={t("detail.meta.style")} value={styleInfo?.label} />
            <Meta icon={Clock} label={t("detail.meta.duration")} value={formatDuration(project.durationSec)} />
            <Meta icon={Layers} label={t("detail.meta.scenes")} value={String(project.sceneCount)} />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">{t("detail.scenes.title")}</CardTitle>
            <CardDescription>
              {t("detail.scenes.hint")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
              {project.scenes.map((scene, i) => {
                const isActive = selectedScene === i;
                return (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedScene(i)}
                    className={cn(
                      "text-left rounded-lg overflow-hidden border transition-all",
                      isActive
                        ? "accent-border ring-2 ring-fuchsia-500/40 scale-[1.04] shadow-lg shadow-fuchsia-500/20 accent-ring"
                        : "border-border hover:border-fuchsia-500/40 hover:-translate-y-0.5"
                    )}
                  >
                    <div className="relative">
                      <SceneThumbnail
                        scene={scene}
                        style={project.style}
                        aspect={project.aspectRatio}
                      />
                      <div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        {i + 1}
                      </div>
                      <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white tabular-nums">
                        {(scene.durationMs / 1000).toFixed(1)}s
                      </div>
                      {isActive && (
                        <div className="absolute inset-0 ring-2 ring-fuchsia-500/60 rounded-lg pointer-events-none" />
                      )}
                    </div>
                    <p className="p-2 text-[11px] text-muted-foreground line-clamp-2">
                      {scene.subtitle || scene.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-accent/60">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="grid size-6 place-items-center rounded-md bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 text-fuchsia-400 transition-transform hover:scale-110">
          <Icon className="size-3.5" />
        </span>
        {label}
      </span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60) || "video"
  );
}

// =========================================================
// SCENE EDITOR
// =========================================================
function SceneEditor({
  project,
  onSaved,
  onCancel,
}: {
  project: VideoProject;
  onSaved: (updated: VideoProject) => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [localScenes, setLocalScenes] = React.useState<Scene[]>(() =>
    project.scenes.map((s) => ({ ...s }))
  );
  const [originalScenes] = React.useState<Scene[]>(() =>
    project.scenes.map((s) => ({ ...s }))
  );
  const [saving, setSaving] = React.useState(false);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [pendingDeleteIdx, setPendingDeleteIdx] = React.useState<number | null>(null);

  const dirty = React.useMemo(
    () => JSON.stringify(localScenes) !== JSON.stringify(originalScenes),
    [localScenes, originalScenes]
  );

  // Real-time project preview: build a synthetic project so player reflects edits
  const previewProject = React.useMemo<VideoProject>(
    () => ({ ...project, scenes: localScenes }),
    [project, localScenes]
  );

  const updateScene = (idx: number, patch: Partial<Scene>) => {
    setLocalScenes((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  };

  const handleAddScene = () => {
    const newIdx = localScenes.length;
    const newScene: Scene = {
      id: `scene-${Date.now()}-${newIdx}`,
      index: newIdx,
      type: "text",
      title: "",
      text: "",
      narration: "",
      subtitle: "",
      durationMs: 4000,
      animation: "fade",
      accentColor: "#d946ef",
    };
    setLocalScenes((prev) => [...prev, newScene]);
    toast.success(t("detail.sceneEditor.add"));
  };

  const handleDeleteScene = (idx: number) => {
    setLocalScenes((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, index: i }))
    );
    setPendingDeleteIdx(null);
    toast.success(t("projects.deleted"));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProject(project.id, {
        scenes: localScenes,
      });
      toast.success(t("detail.sceneEditor.saved"));
      onSaved(updated);
    } catch (e: any) {
      toast.error(t("common.error"), { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (dirty) {
      setConfirmCancel(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <Card className="glass border-fuchsia-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <PencilLine className="size-4 text-fuchsia-500" />
                {t("detail.sceneEditor.title")}
              </CardTitle>
              <CardDescription>
                {t("detail.sceneEditor.subtitle")}
              </CardDescription>
            </div>
            {dirty && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                {t("common.error")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl p-[1.5px] bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-pink-500/40">
            <div className="rounded-2xl overflow-hidden">
              <ScenePlayer project={previewProject} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scene cards */}
      <div className="space-y-4">
        {localScenes.map((scene, idx) => (
          <SceneEditorCard
            key={scene.id}
            scene={scene}
            idx={idx}
            style={project.style}
            aspect={project.aspectRatio}
            projectId={project.id}
            onChange={(patch) => updateScene(idx, patch)}
            onDelete={() => setPendingDeleteIdx(idx)}
          />
        ))}
      </div>

      {/* Add scene */}
      <Button
        variant="outline"
        onClick={handleAddScene}
        className="w-full min-h-[44px] border-dashed border-fuchsia-500/40 text-fuchsia-500 hover:bg-fuchsia-500/5 hover:text-fuchsia-400"
      >
        <Plus className="size-4" />
        {t("detail.sceneEditor.add")}
      </Button>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-30">
        <Card className="glass-strong border-fuchsia-500/30 shadow-xl shadow-fuchsia-500/10 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 animated-gradient-x" />
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{localScenes.length}</span>{" "}
              {t("create.content.scenes.count", { count: localScenes.length })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={saving}
                className="min-h-[40px]"
              >
                <X className="size-4" />
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white border-0 shadow-lg shadow-fuchsia-500/30 min-h-[40px] min-w-[180px] shine-on-hover relative overflow-hidden"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving ? t("common.loading") : t("detail.sceneEditor.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm delete scene */}
      <AlertDialog
        open={pendingDeleteIdx !== null}
        onOpenChange={(o) => !o && setPendingDeleteIdx(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("projects.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                {pendingDeleteIdx !== null ? `${t("player.scene")} ${pendingDeleteIdx + 1}` : t("player.scene")}
              </span>{" "}
              {t("projects.delete.desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingDeleteIdx !== null) handleDeleteScene(pendingDeleteIdx);
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm cancel with unsaved */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("detail.sceneEditor.dirty")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("detail.sceneEditor.dirty")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setConfirmCancel(false);
                onCancel();
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SceneEditorCard({
  scene,
  idx,
  style,
  aspect,
  projectId,
  onChange,
  onDelete,
}: {
  scene: Scene;
  idx: number;
  style: VideoProject["style"];
  aspect: VideoProject["aspectRatio"];
  projectId: string;
  onChange: (patch: Partial<Scene>) => void;
  onDelete: () => void;
}) {
  const { t } = useLocale();
  const [regenerating, setRegenerating] = React.useState(false);

  const handleRegenImage = async () => {
    if (!scene.imagePrompt?.trim()) {
      toast.error(t("common.error"));
      return;
    }
    setRegenerating(true);
    try {
      const res = await generateImage({
        prompt: scene.imagePrompt,
        projectId,
        sceneIdx: idx,
      });
      onChange({ imageUrl: res.imageUrl });
      toast.success(t("common.ready"));
    } catch (e: any) {
      toast.error(t("common.error"), { description: e?.message });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
    >
      <Card className="glass card-glow overflow-hidden relative">
        {/* Left gradient accent bar colored by scene.accentColor */}
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{
            background: `linear-gradient(180deg, ${scene.accentColor || "#d946ef"}, color-mix(in oklch, ${scene.accentColor || "#d946ef"} 50%, transparent))`,
          }}
        />
        <CardHeader className="pb-3 pl-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-bold shadow-md shadow-fuchsia-500/30 shrink-0">
                {idx + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {scene.title || scene.subtitle || `${t("player.scene")} ${idx + 1}`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {scene.type} · {scene.animation} · {(scene.durationMs / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              className="size-8 shrink-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
              aria-label={t("common.delete")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pl-5">
          {/* Live thumbnail + selects */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Label className="text-xs text-muted-foreground">{t("detail.sceneEditor.title2")}</Label>
              <div className="mt-1.5 rounded-lg overflow-hidden border border-border">
                <SceneThumbnail scene={scene} style={style} aspect={aspect} />
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("detail.sceneEditor.type")}</Label>
                <Select
                  value={scene.type}
                  onValueChange={(v) => onChange({ type: v as SceneType })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENE_TYPES.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("detail.sceneEditor.animation")}</Label>
                <Select
                  value={scene.animation}
                  onValueChange={(v) => onChange({ animation: v as SceneAnimation })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENE_ANIMATIONS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("detail.sceneEditor.title2")} ({t("common.optional")})</Label>
            <Input
              value={scene.title || ""}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={t("detail.sceneEditor.title2")}
            />
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("detail.sceneEditor.text")}</Label>
            <Textarea
              value={scene.text}
              onChange={(e) => onChange({ text: e.target.value })}
              className="min-h-[60px]"
            />
          </div>

          {/* Narration */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <AudioLines className="size-3" />
              {t("detail.sceneEditor.narration")}
            </Label>
            <Textarea
              value={scene.narration}
              onChange={(e) => onChange({ narration: e.target.value })}
              className="min-h-[60px]"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("detail.sceneEditor.subtitle")}</Label>
            <Input
              value={scene.subtitle}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              maxLength={100}
            />
          </div>

          {/* Image prompt */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <ImageIcon className="size-3" />
              {t("detail.sceneEditor.imagePrompt")}
            </Label>
            <div className="flex gap-2">
              <Input
                value={scene.imagePrompt || ""}
                onChange={(e) => onChange({ imagePrompt: e.target.value })}
                placeholder="cinematic shot of a futuristic city at sunset"
              />
              <Button
                variant="outline"
                onClick={handleRegenImage}
                disabled={regenerating}
                className="shrink-0 border-fuchsia-500/40 text-fuchsia-500 hover:bg-fuchsia-500/10"
              >
                {regenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {regenerating ? t("common.loading") : t("detail.sceneEditor.regenerateImage")}
              </Button>
            </div>
            {scene.imageUrl && (
              <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {t("common.ready")}
              </p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t("detail.sceneEditor.duration")}</Label>
              <Badge variant="secondary" className="tabular-nums">
                {(scene.durationMs / 1000).toFixed(1)}s
              </Badge>
            </div>
            <Slider
              min={1500}
              max={15000}
              step={500}
              value={[scene.durationMs]}
              onValueChange={(v) => onChange({ durationMs: v[0] })}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1.5s</span>
              <span>15s</span>
            </div>
          </div>

          {/* Accent color */}
          <div className="space-y-2">
            <Label className="text-xs">{t("detail.sceneEditor.accent")}</Label>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ accentColor: c })}
                  className={cn(
                    "size-7 rounded-full transition-transform hover:scale-110",
                    scene.accentColor === c
                      ? "ring-2 ring-offset-2 ring-offset-background ring-fuchsia-500 scale-110"
                      : "ring-1 ring-border"
                  )}
                  style={{ background: c }}
                  aria-label={`${t("detail.sceneEditor.accent")} ${c}`}
                />
              ))}
              <label className="relative size-7 rounded-full overflow-hidden cursor-pointer ring-1 ring-border">
                <input
                  type="color"
                  value={scene.accentColor || "#d946ef"}
                  onChange={(e) => onChange({ accentColor: e.target.value })}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  aria-label={t("detail.sceneEditor.accent")}
                />
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #7c3aed, #d946ef, #ec4899, #f59e0b, #10b981, #06b6d4, #7c3aed)",
                  }}
                />
                <span className="absolute inset-0 grid place-items-center text-white text-[10px] font-bold">
                  +
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
