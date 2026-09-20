"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FolderOpen,
  Play,
  Trash2,
  Wand2,
  Filter,
  Loader2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { MODE_MAP, STYLE_MAP, LANGUAGE_MAP } from "@/lib/providers";
import type { VideoProject, ProjectStatus } from "@/lib/types";
import {
  listProjects,
  deleteProject,
  formatDuration,
  timeAgo,
  type ApiError,
} from "@/lib/api-client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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

type FilterKey = "all" | "ready" | "generating" | "draft";

const STATUS_META: Record<
  ProjectStatus,
  { label: string; cls: string; dot: string }
> = {
  draft: { label: "Taslak", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", dot: "bg-zinc-400" },
  generating: { label: "Üretiliyor", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400 animate-pulse" },
  ready: { label: "Hazır", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  error: { label: "Hata", cls: "bg-rose-500/15 text-rose-400 border-rose-500/30", dot: "bg-rose-500" },
};

export function ProjectsView() {
  const go = useApp((s) => s.go);
  const setWizard = useApp((s) => s.setWizard);
  const [projects, setProjects] = React.useState<VideoProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [pendingDelete, setPendingDelete] = React.useState<VideoProject | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    listProjects()
      .then((p) => setProjects(p))
      .catch((e: ApiError) => toast.error("Projeler yüklenemedi", { description: e.message }))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = projects.filter((p) => {
    if (filter === "all") return true;
    if (filter === "generating") return p.status === "generating";
    return p.status === filter;
  });

  const counts = {
    all: projects.length,
    ready: projects.filter((p) => p.status === "ready").length,
    generating: projects.filter((p) => p.status === "generating").length,
    draft: projects.filter((p) => p.status === "draft").length,
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProject(pendingDelete.id);
      toast.success("Proje silindi");
      setProjects((prev) => prev.filter((p) => p.id !== pendingDelete.id));
    } catch (e: any) {
      toast.error("Silme hatası", { description: e?.message });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500 font-semibold">
            Kütüphanen
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            Projelerim
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Oluşturduğun tüm videolar burada.
          </p>
        </div>
        <Button
          onClick={() => {
            setWizard({ step: 0 });
            go("create");
          }}
          className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white border-0 min-h-[44px]"
        >
          <Wand2 className="size-4" />
          Yeni Video
        </Button>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="min-h-[36px]">
              Tümü <CountBadge n={counts.all} />
            </TabsTrigger>
            <TabsTrigger value="ready" className="min-h-[36px]">
              Hazır <CountBadge n={counts.ready} />
            </TabsTrigger>
            <TabsTrigger value="generating" className="min-h-[36px]">
              Üretiliyor <CountBadge n={counts.generating} />
            </TabsTrigger>
            <TabsTrigger value="draft" className="min-h-[36px]">
              Taslak <CountBadge n={counts.draft} />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center text-center gap-3">
                <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                  <FolderOpen className="size-6" />
                </div>
                <div>
                  <p className="font-medium">Burada henüz proje yok</p>
                  <p className="text-sm text-muted-foreground">
                    Filtreyi değiştir ya da yeni bir video üret.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setWizard({ step: 0 });
                    go("create");
                  }}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0"
                >
                  <Wand2 className="size-4" />
                  Yeni Video
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  onOpen={() => go("detail", p.id)}
                  onDelete={() => setPendingDelete(p)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projeyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                “{pendingDelete?.title}”
              </span>{" "}
              kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-1.5 inline-grid place-items-center rounded-full bg-background px-1.5 text-[10px] font-semibold tabular-nums">
      {n}
    </span>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
  onDelete,
}: {
  project: VideoProject;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const modeInfo = MODE_MAP[project.mode];
  const styleInfo = STYLE_MAP[project.style];
  const langInfo = LANGUAGE_MAP[project.language];
  const status = STATUS_META[project.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className="overflow-hidden h-full group hover:shadow-xl hover:shadow-fuchsia-500/10 hover:border-fuchsia-500/40 transition-all">
        <button onClick={onOpen} className="block w-full text-left">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {project.thumbnailUrl ? (
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className={cn(
                  "size-full grid place-items-center bg-gradient-to-br",
                  styleInfo?.gradient || "from-violet-500 to-fuchsia-500"
                )}
              >
                <span className="text-5xl drop-shadow-md">
                  {modeInfo?.emoji ?? "🎬"}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />

            {/* Play overlay */}
            <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="size-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 grid place-items-center shadow-2xl">
                <Play className="size-6 text-white fill-white translate-x-0.5" />
              </div>
            </div>

            {/* Status badge */}
            <div className="absolute top-2 left-2">
              <Badge
                variant="outline"
                className={cn(
                  "backdrop-blur-md bg-black/40 border-0 text-white",
                  status.cls
                )}
              >
                <span className={cn("size-1.5 rounded-full", status.dot)} />
                {status.label}
              </Badge>
            </div>

            {/* Duration */}
            <div className="absolute top-2 right-2 rounded bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums">
              {formatDuration(project.durationSec)}
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 inset-x-0 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                  {modeInfo?.emoji} {modeInfo?.label}
                </Badge>
                {langInfo && (
                  <span className="text-xs" title={langInfo.nativeName}>
                    {langInfo.flag}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white line-clamp-1">
                {project.title}
              </p>
            </div>
          </div>
        </button>

        <CardContent className="flex items-center justify-between py-3 gap-2">
          <div className="text-xs text-muted-foreground">
            {timeAgo(project.createdAt)} · {project.sceneCount} sahne
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpen}
              className="h-8 px-2 text-fuchsia-500 hover:text-fuchsia-400 hover:bg-fuchsia-500/10"
            >
              Aç
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              className="size-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
              aria-label="Sil"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
