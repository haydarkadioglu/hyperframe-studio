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
  Languages,
  Palette,
  Clock,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store";
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
  type ApiError,
} from "@/lib/api-client";
import type { VideoProject } from "@/lib/types";
import { ScenePlayer } from "@/components/player/scene-player";
import { SceneThumbnail } from "@/components/player/scene-thumbnail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DetailView() {
  const detailId = useApp((s) => s.detailId);
  const go = useApp((s) => s.go);
  const [project, setProject] = React.useState<VideoProject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const [rerendering, setRerendering] = React.useState(false);

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
        setError(e?.message || "Proje yüklenemedi");
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
  }, [detailId]);

  const handleRerender = async () => {
    if (!project) return;
    setRerendering(true);
    try {
      await renderProject(project.id, {
        targetScenes: project.sceneCount || 5,
      });
      toast.success("Yeniden üretim başladı");
      setProject({ ...project, status: "generating" });
      // polling will resume via effect re-run on project change
    } catch (e: any) {
      toast.error("Yeniden üretim başlatılamadı", { description: e?.message });
    } finally {
      setRerendering(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      toast.success("Proje silindi");
      go("projects");
    } catch (e: any) {
      toast.error("Silme hatası", { description: e?.message });
    }
  };

  if (!detailId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          Geçersiz proje.
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
          <p className="font-medium">Proje yüklenemedi</p>
          <p className="text-sm text-muted-foreground">{error ?? "Bilinmeyen hata"}</p>
          <Button variant="outline" onClick={() => go("projects")}>
            <ArrowLeft className="size-4" />
            Projelere dön
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
          Projelere dön
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRerender}
            disabled={rerendering || project.status === "generating"}
            className="min-h-[40px]"
          >
            {rerendering ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Yeniden Oluştur
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPendingDelete(true)}
            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 min-h-[40px]"
          >
            <Trash2 className="size-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Title + meta */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30">
            {MODE_MAP[project.mode]?.emoji} {MODE_MAP[project.mode]?.label}
          </Badge>
          <StatusBadge status={project.status} />
          <span className="text-xs text-muted-foreground">
            {timeAgo(project.createdAt)}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {project.title}
        </h1>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.topic}
        </p>
      </div>

      {/* Body */}
      {project.status === "generating" ? (
        <GeneratingView project={project} />
      ) : project.status === "error" ? (
        <ErrorView
          message={project.errorMessage || "Bilinmeyen bir hata oluştu"}
          onRetry={handleRerender}
        />
      ) : (
        <ReadyView project={project} />
      )}

      <AlertDialog open={pendingDelete} onOpenChange={setPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projeyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">“{project.title}”</span>{" "}
              kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: VideoProject["status"] }) {
  const map: Record<VideoProject["status"], string> = {
    draft: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    generating: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    error: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };
  const label: Record<VideoProject["status"], string> = {
    draft: "Taslak",
    generating: "Üretiliyor",
    ready: "Hazır",
    error: "Hata",
  };
  return (
    <Badge variant="outline" className={cn("border", map[status])}>
      {status === "generating" && (
        <Loader2 className="size-3 animate-spin" />
      )}
      {label[status]}
    </Badge>
  );
}

function GeneratingView({ project }: { project: VideoProject }) {
  const steps = [
    { label: "Senaryo yazılıyor", icon: FileText },
    { label: "Görseller üretiliyor", icon: Palette },
    { label: "Seslendirme yapılıyor", icon: AudioLines },
    { label: "Altyazılar oluşturuluyor", icon: CaptionsIcon },
  ];

  // Cycle through "active step" for visual effect
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => (a + 1) % steps.length);
    }, 2200);
    return () => clearInterval(t);
  }, []);

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
            <h2 className="text-xl font-bold">Videonuz üretiliyor</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Bu işlem birkaç dakika sürebilir. Sayfayı açık tutabilirsiniz —
              tamamlandığında otomatik oynatıcı açılır.
            </p>

            <div className="mt-8 grid gap-2 text-left max-w-md mx-auto">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const done = i < active;
                const isCurrent = i === active;
                return (
                  <motion.div
                    key={s.label}
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
                        "grid size-8 place-items-center rounded-lg",
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
                    <span className="text-sm font-medium">{s.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Local Check icon (we want a small inline version)
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

// lucide doesn't export Subtitles/Captions alias cleanly; define a local icon
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
  return (
    <Card className="border-rose-500/40">
      <CardContent className="py-10 text-center space-y-4">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-rose-500/10 text-rose-500">
          <AlertCircle className="size-7" />
        </div>
        <div>
          <p className="font-semibold">Üretim başarısız oldu</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {message}
          </p>
        </div>
        <Button onClick={onRetry} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
          <RefreshCw className="size-4" />
          Tekrar dene
        </Button>
      </CardContent>
    </Card>
  );
}

function ReadyView({ project }: { project: VideoProject }) {
  const modeInfo = MODE_MAP[project.mode];
  const styleInfo = STYLE_MAP[project.style];
  const langInfo = LANGUAGE_MAP[project.language];
  const toneInfo = TONE_MAP[project.tone];

  const [selectedScene, setSelectedScene] = React.useState(0);

  const downloadSrt = () => {
    if (!project.subtitles) {
      toast.error("Altyazı bulunamadı");
      return;
    }
    downloadTextFile(`${slug(project.title)}.srt`, project.subtitles, "text/plain");
    toast.success("SRT indirildi");
  };

  const downloadVtt = () => {
    if (!project.subtitles) {
      toast.error("Altyazı bulunamadı");
      return;
    }
    // Convert SRT to VTT quickly: replace first line "WEBVTT" header and commas with dots
    const vtt = "WEBVTT\n\n" + project.subtitles.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    downloadTextFile(`${slug(project.title)}.vtt`, vtt, "text/vtt");
    toast.success("VTT indirildi");
  };

  const downloadAudio = () => {
    if (!project.audioUrl) {
      toast.error("Ses dosyası bulunamadı");
      return;
    }
    downloadRemoteFile(project.audioUrl, `${slug(project.title)}.mp3`);
    toast.success("Ses indirildi");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <ScenePlayer project={project} />

        {/* Action bar */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadSrt} className="min-h-[40px]">
            <FileText className="size-4" />
            SRT İndir
          </Button>
          <Button variant="outline" size="sm" onClick={downloadVtt} className="min-h-[40px]">
            <FileText className="size-4" />
            VTT İndir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAudio}
            disabled={!project.audioUrl}
            className="min-h-[40px]"
          >
            <AudioLines className="size-4" />
            Sesi İndir
          </Button>
        </div>
      </div>

      {/* Right panel: scenes list + meta */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detaylar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Meta icon={Clapperboard} label="Mod" value={modeInfo?.label} />
            <Meta icon={Languages} label="Dil" value={`${langInfo?.flag} ${langInfo?.nativeName}`} />
            <Meta icon={Sparkles} label="Ton" value={`${toneInfo?.emoji} ${toneInfo?.label}`} />
            <Meta icon={Palette} label="Stil" value={styleInfo?.label} />
            <Meta icon={Clock} label="Süre" value={formatDuration(project.durationSec)} />
            <Meta icon={Play} label="Sahne sayısı" value={String(project.sceneCount)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sahneler</CardTitle>
            <CardDescription>
              Tıklayarak o sahneye git
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
              {project.scenes.map((scene, i) => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedScene(i)}
                  className={cn(
                    "text-left rounded-lg overflow-hidden border transition-all",
                    selectedScene === i
                      ? "border-fuchsia-500 ring-2 ring-fuchsia-500/30"
                      : "border-border hover:border-muted-foreground"
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
                  </div>
                  <p className="p-2 text-[11px] text-muted-foreground line-clamp-2">
                    {scene.subtitle || scene.text}
                  </p>
                </button>
              ))}
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
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
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
