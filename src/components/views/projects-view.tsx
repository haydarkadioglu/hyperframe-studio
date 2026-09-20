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
  Search,
  Copy,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  Share2,
  Clapperboard,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { MODE_MAP, STYLE_MAP, LANGUAGE_MAP } from "@/lib/providers";
import type { VideoProject, ProjectStatus } from "@/lib/types";
import {
  listProjects,
  deleteProject,
  duplicateProject,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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

type FilterKey = "all" | "ready" | "generating" | "draft";
type SortKey = "newest" | "oldest" | "duration" | "title";
type ViewMode = "grid" | "list";

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
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [duplicatingId, setDuplicatingId] = React.useState<string | null>(null);
  const [shareProject, setShareProject] = React.useState<VideoProject | null>(null);

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

  const filtered = React.useMemo(() => {
    let arr = projects.filter((p) => {
      if (filter === "all") return true;
      if (filter === "generating") return p.status === "generating";
      return p.status === filter;
    });
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.topic.toLowerCase().includes(q)
      );
    }
    arr = [...arr].sort((a, b) => {
      if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sort === "oldest") return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sort === "duration") return b.durationSec - a.durationSec;
      if (sort === "title") return a.title.localeCompare(b.title, "tr");
      return 0;
    });
    return arr;
  }, [projects, filter, search, sort]);

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

  const handleDuplicate = async (project: VideoProject) => {
    setDuplicatingId(project.id);
    try {
      const copy = await duplicateProject(project.id);
      toast.success("Proje kopyalandı", {
        description: "Yeni taslak oluşturuldu.",
      });
      // Refresh list
      const fresh = await listProjects();
      setProjects(fresh);
      if (copy.scenes && copy.scenes.length > 0) {
        go("detail", copy.id);
      }
    } catch (e: any) {
      toast.error("Kopyalama hatası", { description: e?.message });
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden">
        {/* Decorative orb behind heading */}
        <div className="orb orb-sm bg-fuchsia-500/30 -top-8 right-4 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500 font-semibold">
              Kütüphanen
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-balance">
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
            className="btn-gradient shine-on-hover shadow-lg shadow-fuchsia-500/30 min-h-[44px] relative overflow-hidden"
          >
            <Wand2 className="size-4" />
            Yeni Video
          </Button>
        </div>
      </header>

      {/* Search + sort + view toggle */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Başlık veya konu ara..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En yeni</SelectItem>
                <SelectItem value="oldest">En eski</SelectItem>
                <SelectItem value="duration">Süreye göre</SelectItem>
                <SelectItem value="title">Başlığa göre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "grid place-items-center size-9 transition-colors",
                viewMode === "grid"
                  ? "bg-fuchsia-500/15 text-fuchsia-500"
                  : "text-muted-foreground hover:bg-accent"
              )}
              aria-label="Izgara görünüm"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "grid place-items-center size-9 transition-colors",
                viewMode === "list"
                  ? "bg-fuchsia-500/15 text-fuchsia-500"
                  : "text-muted-foreground hover:bg-accent"
              )}
              aria-label="Liste görünüm"
            >
              <ListIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

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
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <Card className="border-dashed relative overflow-hidden">
              <CardContent className="relative py-14 flex flex-col items-center text-center gap-4">
                {/* Floating orbs */}
                <div className="orb orb-sm bg-violet-500/30 -top-6 -left-6" />
                <div className="orb orb-sm bg-fuchsia-500/25 -bottom-8 -right-6" />
                <div className="orb orb-sm bg-pink-500/20 top-1/3 left-1/2" />
                <div className="relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-2xl shadow-fuchsia-500/30 pulse-glow">
                  <Clapperboard className="size-10" />
                </div>
                <div className="relative">
                  <p className="font-semibold text-lg">
                    {search ? "Sonuç bulunamadı" : "Burada henüz proje yok"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {search
                      ? "Aramanı değiştir ya da yeni bir video üret."
                      : "Filtreyi değiştir ya da yeni bir video üret."}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setWizard({ step: 0 });
                    go("create");
                  }}
                  className="relative btn-gradient shine-on-hover border-0 min-h-[44px]"
                >
                  <Wand2 className="size-4" />
                  Yeni Video
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  onOpen={() => go("detail", p.id)}
                  onDelete={() => setPendingDelete(p)}
                  onDuplicate={() => handleDuplicate(p)}
                  onShare={() => setShareProject(p)}
                  duplicating={duplicatingId === p.id}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p, i) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  index={i}
                  onOpen={() => go("detail", p.id)}
                  onDelete={() => setPendingDelete(p)}
                  onDuplicate={() => handleDuplicate(p)}
                  onShare={() => setShareProject(p)}
                  duplicating={duplicatingId === p.id}
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

      {/* Share dialog (controlled) */}
      {shareProject && (
        <ShareDialog
          project={shareProject}
          open={Boolean(shareProject)}
          onOpenChange={(o) => !o && setShareProject(null)}
        />
      )}
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

function ProjectThumbnail({
  project,
  className,
}: {
  project: VideoProject;
  className?: string;
}) {
  const modeInfo = MODE_MAP[project.mode];
  const styleInfo = STYLE_MAP[project.style];
  if (project.thumbnailUrl) {
    return (
      <img
        src={project.thumbnailUrl}
        alt={project.title}
        className={cn("size-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "size-full grid place-items-center bg-gradient-to-br",
        styleInfo?.gradient || "from-violet-500 to-fuchsia-500",
        className
      )}
    >
      <span className="text-5xl drop-shadow-md">{modeInfo?.emoji ?? "🎬"}</span>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
  onDelete,
  onDuplicate,
  onShare,
  duplicating,
}: {
  project: VideoProject;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  duplicating: boolean;
}) {
  const modeInfo = MODE_MAP[project.mode];
  const langInfo = LANGUAGE_MAP[project.language];
  const status = STATUS_META[project.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className="glass card-glow shine-on-hover card-hover-lift overflow-hidden h-full group relative hover:border-fuchsia-500/50 hover:ring-1 hover:ring-fuchsia-500/30">
        <button onClick={onOpen} className="block w-full text-left relative">
          <div className="relative aspect-video overflow-hidden bg-muted">
            <ProjectThumbnail
              project={project}
              className="transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 opacity-80 group-hover:opacity-100 transition-opacity" />
            {/* gradient overlay on hover (intensifies) */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tr from-fuchsia-500/20 via-transparent to-violet-500/20" />

            {/* Play overlay (scales in) */}
            <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.div
                initial={{ scale: 0.4 }}
                whileHover={{ scale: 1.1 }}
                className="size-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 grid place-items-center shadow-2xl group-hover:animate-pulse"
              >
                <Play className="size-6 text-white fill-white translate-x-0.5" />
              </motion.div>
            </div>

            {/* Status badge — generating pulses */}
            <div className="absolute top-2 left-2">
              <Badge
                variant="outline"
                className={cn(
                  "backdrop-blur-md bg-black/40 border-0 text-white",
                  status.cls,
                  project.status === "generating" && "pulse-glow"
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
              onClick={onShare}
              className="size-8 text-muted-foreground hover:text-fuchsia-500 hover:bg-fuchsia-500/10"
              aria-label="Paylaş"
              title="Paylaş"
            >
              <Share2 className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDuplicate}
              disabled={duplicating}
              className="size-8 text-muted-foreground hover:text-fuchsia-500 hover:bg-fuchsia-500/10"
              aria-label="Kopyala"
              title="Kopyala"
            >
              {duplicating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Copy className="size-4" />
              )}
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

function ProjectRow({
  project,
  index,
  onOpen,
  onDelete,
  onDuplicate,
  onShare,
  duplicating,
}: {
  project: VideoProject;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  duplicating: boolean;
}) {
  const modeInfo = MODE_MAP[project.mode];
  const langInfo = LANGUAGE_MAP[project.language];
  const status = STATUS_META[project.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.25) }}
    >
      <Card className="glass card-glow group hover:border-fuchsia-500/40 relative overflow-hidden">
        {/* Left gradient accent bar that appears on hover */}
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <CardContent className="py-3 flex items-center gap-4 pl-5">
          <button
            onClick={onOpen}
            className="relative shrink-0 size-20 rounded-lg overflow-hidden bg-muted group/thumb"
            aria-label="Aç"
          >
            <ProjectThumbnail
              project={project}
              className="transition-transform duration-500 group-hover/thumb:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors grid place-items-center">
              <Play className="size-5 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity fill-white translate-x-0.5" />
            </div>
          </button>
          <button onClick={onOpen} className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] border",
                  status.cls,
                  project.status === "generating" && "pulse-glow"
                )}
              >
                <span className={cn("size-1.5 rounded-full", status.dot)} />
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {modeInfo?.emoji} {modeInfo?.label}
              </Badge>
              {langInfo && (
                <span className="text-xs" title={langInfo.nativeName}>
                  {langInfo.flag}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold line-clamp-1 group-hover:text-fuchsia-500 transition-colors">
              {project.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {timeAgo(project.createdAt)} · {project.sceneCount} sahne · {formatDuration(project.durationSec)}
            </p>
          </button>
          <div className="flex items-center gap-1 shrink-0">
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
              onClick={onShare}
              className="size-8 text-muted-foreground hover:text-fuchsia-500 hover:bg-fuchsia-500/10"
              aria-label="Paylaş"
              title="Paylaş"
            >
              <Share2 className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDuplicate}
              disabled={duplicating}
              className="size-8 text-muted-foreground hover:text-fuchsia-500 hover:bg-fuchsia-500/10"
              aria-label="Kopyala"
              title="Kopyala"
            >
              {duplicating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Copy className="size-4" />
              )}
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
