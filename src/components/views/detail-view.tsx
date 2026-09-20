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
  { id: "title", label: "Başlık" },
  { id: "text", label: "Metin" },
  { id: "image", label: "Görsel" },
  { id: "quote", label: "Alıntı" },
  { id: "stats", label: "İstatistik" },
  { id: "cta", label: "Çağrı (CTA)" },
];

const SCENE_ANIMATIONS: { id: SceneAnimation; label: string }[] = [
  { id: "fade", label: "Fade" },
  { id: "slide-up", label: "Yukarı kay" },
  { id: "slide-left", label: "Sola kay" },
  { id: "zoom", label: "Zoom" },
  { id: "bounce", label: "Zıpla" },
  { id: "flip", label: "Çevir" },
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

  const handleDuplicate = async () => {
    if (!project) return;
    setDuplicating(true);
    try {
      const copy = await duplicateProject(project.id);
      toast.success("Proje kopyalandı", {
        description: "Yeni taslak oluşturuldu.",
      });
      if (copy.scenes && copy.scenes.length > 0) {
        go("detail", copy.id);
      } else {
        go("projects");
      }
    } catch (e: any) {
      toast.error("Kopyalama hatası", { description: e?.message });
    } finally {
      setDuplicating(false);
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
              {editMode ? "Düzenlemeyi Bitir" : "Sahne Düzenle"}
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
            Kopyala
          </Button>
          <Button
            size="sm"
            onClick={() => setShareOpen(true)}
            className="min-h-[40px] btn-gradient shine-on-hover shadow-lg shadow-fuchsia-500/30 relative overflow-hidden"
          >
            <Share2 className="size-4" />
            Paylaş
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
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

      <ShareDialog project={project} open={shareOpen} onOpenChange={setShareOpen} />
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
    <Badge variant="outline" className={cn("border", map[status], status === "generating" && "pulse-glow")}>
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

function ReadyView({ project, onShare }: { project: VideoProject; onShare: () => void }) {
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
        {/* Player stage with rotating gradient ring + orb depth */}
        <div className="relative">
          {/* Decorative orb behind player */}
          <div className="orb orb-md bg-violet-500/30 -top-10 -left-10 -z-10" />
          <div className="orb orb-sm bg-fuchsia-500/25 -bottom-12 right-4 -z-10" />
          {/* Gradient ring that subtly rotates on hover */}
          <div className="group relative rounded-2xl p-[1.5px] bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-pink-500/40 overflow-hidden transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(217,70,239,0.5)]">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-pink-500/30 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden">
              <ScenePlayer project={project} />
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadSrt} className="min-h-[40px] card-hover-lift">
            <FileText className="size-4" />
            SRT İndir
          </Button>
          <Button variant="outline" size="sm" onClick={downloadVtt} className="min-h-[40px] card-hover-lift">
            <Captions className="size-4" />
            VTT İndir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAudio}
            disabled={!project.audioUrl}
            className="min-h-[40px] card-hover-lift"
          >
            <Download className="size-4" />
            Sesi İndir
          </Button>
          <Button
            size="sm"
            onClick={onShare}
            className="min-h-[40px] btn-gradient shine-on-hover shadow-md shadow-fuchsia-500/30 relative overflow-hidden ml-auto"
          >
            <Share2 className="size-4" />
            Paylaş
          </Button>
        </div>
      </div>

      {/* Right panel: scenes list + meta */}
      <div className="space-y-4">
        <Card className="glass overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 animated-gradient-x" />
          <CardHeader>
            <CardTitle className="text-base">Detaylar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Meta icon={Clapperboard} label="Mod" value={modeInfo?.label} />
            <Meta icon={Globe} label="Dil" value={`${langInfo?.flag} ${langInfo?.nativeName}`} />
            <Meta icon={AudioLines} label="Ton" value={`${toneInfo?.emoji} ${toneInfo?.label}`} />
            <Meta icon={Palette} label="Stil" value={styleInfo?.label} />
            <Meta icon={Clock} label="Süre" value={formatDuration(project.durationSec)} />
            <Meta icon={Layers} label="Sahne sayısı" value={String(project.sceneCount)} />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Sahneler</CardTitle>
            <CardDescription>
              Tıklayarak o sahneye git
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
                        ? "border-fuchsia-500 ring-2 ring-fuchsia-500/40 scale-[1.04] shadow-lg shadow-fuchsia-500/20"
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
      text: "Yeni sahne metni",
      narration: "Yeni sahne seslendirmesi.",
      subtitle: "Yeni sahne",
      durationMs: 4000,
      animation: "fade",
      accentColor: "#d946ef",
    };
    setLocalScenes((prev) => [...prev, newScene]);
    toast.success("Yeni sahne eklendi");
  };

  const handleDeleteScene = (idx: number) => {
    setLocalScenes((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, index: i }))
    );
    setPendingDeleteIdx(null);
    toast.success("Sahne silindi");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProject(project.id, {
        scenes: localScenes,
      });
      toast.success("Sahnelar kaydedildi ve altyazılar güncellendi", {
        description: `${localScenes.length} sahne sunucuya gönderildi.`,
      });
      onSaved(updated);
    } catch (e: any) {
      toast.error("Kaydetme hatası", { description: e?.message });
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
                Sahne Düzenleyici
              </CardTitle>
              <CardDescription>
                Değişiklikler canlı önizlemede görünür. Kaydedince altyazılar otomatik yeniden oluşturulur.
              </CardDescription>
            </div>
            {dirty && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                Kaydedilmemiş değişiklik
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
        Sahne Ekle
      </Button>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-30">
        <Card className="glass-strong border-fuchsia-500/30 shadow-xl shadow-fuchsia-500/10 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 animated-gradient-x" />
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{localScenes.length}</span> sahne ·
              {dirty ? " kaydedilmedi" : " kaydedildi"}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={saving}
                className="min-h-[40px]"
              >
                <X className="size-4" />
                İptal
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
                {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
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
            <AlertDialogTitle>Sahneyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                {pendingDeleteIdx !== null ? `${pendingDeleteIdx + 1}. sahne` : "Sahne"}
              </span>{" "}
              silinecek. Kalan sahneler otomatik yeniden numaralandırılır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingDeleteIdx !== null) handleDeleteScene(pendingDeleteIdx);
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Trash2 className="size-4" />
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm cancel with unsaved */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydedilmemiş değişiklikler var</AlertDialogTitle>
            <AlertDialogDescription>
              Çıkarsan tüm düzenlemeler kaybolur. Devam edilsin mi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setConfirmCancel(false);
                onCancel();
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Yine de çık
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
  const [regenerating, setRegenerating] = React.useState(false);

  const handleRegenImage = async () => {
    if (!scene.imagePrompt?.trim()) {
      toast.error("Önce bir görsel promptu girin");
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
      toast.success("Görsel yeniden üretildi");
    } catch (e: any) {
      toast.error("Görsel üretilemedi", { description: e?.message });
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
                  {scene.title || scene.subtitle || `Sahne ${idx + 1}`}
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
              aria-label="Sahneyi sil"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pl-5">
          {/* Live thumbnail + selects */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Label className="text-xs text-muted-foreground">Önizleme</Label>
              <div className="mt-1.5 rounded-lg overflow-hidden border border-border">
                <SceneThumbnail scene={scene} style={style} aspect={aspect} />
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tür</Label>
                <Select
                  value={scene.type}
                  onValueChange={(v) => onChange({ type: v as SceneType })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENE_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Animasyon</Label>
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
            <Label className="text-xs">Başlık (opsiyonel)</Label>
            <Input
              value={scene.title || ""}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Sahne başlığı"
            />
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <Label className="text-xs">Ekranda görünen metin</Label>
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
              Seslendirme metni (TTS)
            </Label>
            <Textarea
              value={scene.narration}
              onChange={(e) => onChange({ narration: e.target.value })}
              className="min-h-[60px]"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <Label className="text-xs">Altyazı satırı</Label>
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
              Görsel promptu (İngilizce)
            </Label>
            <div className="flex gap-2">
              <Input
                value={scene.imagePrompt || ""}
                onChange={(e) => onChange({ imagePrompt: e.target.value })}
                placeholder="Örn: cinematic shot of a futuristic city at sunset"
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
                {regenerating ? "Üretiliyor..." : "Yeniden Üret"}
              </Button>
            </div>
            {scene.imageUrl && (
              <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Görsel mevcut
              </p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Süre</Label>
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
            <Label className="text-xs">Vurgu rengi</Label>
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
                  aria-label={`Renk ${c}`}
                />
              ))}
              <label className="relative size-7 rounded-full overflow-hidden cursor-pointer ring-1 ring-border">
                <input
                  type="color"
                  value={scene.accentColor || "#d946ef"}
                  onChange={(e) => onChange({ accentColor: e.target.value })}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  aria-label="Özel renk"
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
