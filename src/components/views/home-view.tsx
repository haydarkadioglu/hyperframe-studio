"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Cpu,
  AudioLines,
  Eye,
  Captions,
  Globe2,
  Palette,
  Layers,
  ArrowRight,
  PlayCircle,
  FolderOpen,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { MODES, MODE_MAP, STYLE_MAP } from "@/lib/providers";
import {
  listProjects,
  timeAgo,
  formatDuration,
  type ApiError,
} from "@/lib/api-client";
import type { VideoProject, VideoMode } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const FEATURES: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  color: string;
}[] = [
  {
    icon: Layers,
    title: "Hyperframes Animasyon",
    desc: "Sahne sahne, sinematik geçişlerle akan animasyonlu oynatıcı.",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: Cpu,
    title: "Çoklu LLM",
    desc: "Z.ai GLM, OpenAI GPT, Claude, Gemini — istediğin senaryo motorunu seç.",
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: AudioLines,
    title: "Çoklu TTS",
    desc: "Z.ai, ElevenLabs, OpenAI — gerçekçi çoklu dil seslendirme.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Eye,
    title: "Ürün Fotoğrafı Analizi (VLM)",
    desc: "Görseli yükle, VLM ürünü tanımlasın, tanıtım videosu oluşsun.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Captions,
    title: "YouTube Altyazı (SRT/VTT)",
    desc: "Sahnelere göre zamanlanmış altyazı dosyası indirmesi tek tıkla.",
    color: "from-rose-500 to-red-500",
  },
  {
    icon: Globe2,
    title: "12 Dil Desteği",
    desc: "Türkçe, İngilizce, Çince, Arapça, Hintçe ve 7 dil daha.",
    color: "from-sky-500 to-cyan-500",
  },
  {
    icon: Palette,
    title: "İçerik Duyarlı Tonlama",
    desc: "8 farklı ton: profesyonel, enerjik, sakin, dramatik, samimi, ilham verici, haber, belgesel.",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: ImageIcon,
    title: "Sahne Animasyon Stilleri",
    desc: "Modern, sinematik, eğlenceli, minimal, kurumsal, canlı, zarif, cesur.",
    color: "from-teal-500 to-emerald-500",
  },
];

export function HomeView() {
  const go = useApp((s) => s.go);
  const setWizard = useApp((s) => s.setWizard);

  const [recent, setRecent] = React.useState<VideoProject[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    listProjects()
      .then((p) => {
        if (alive) setRecent(p.slice(0, 6));
      })
      .catch((e: ApiError) => {
        toast.error("Projeler yüklenemedi", { description: e.message });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const pickMode = (mode: VideoMode) => {
    setWizard({ mode, step: 0 });
    go("create");
  };

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-transparent p-8 sm:p-12 md:p-16"
      >
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 size-72 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl">
          <Badge
            variant="outline"
            className="mb-5 bg-background/50 backdrop-blur border-fuchsia-500/40 text-fuchsia-300"
          >
            <Sparkles className="size-3" />
            AI Video Creator
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            <span className="brand-gradient-text">AI ile saniyeler</span>
            <br />
            içinde video üret
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Hyperframes animasyonları, LLM senaryo, TTS seslendirme, çoklu dil ve
            provider desteği ile tek tıkla profesyonel video üretin. Ürün
            fotoğraflarınızı VLM ile analiz ettirin, YouTube uyumlu SRT/VTT
            altyazıları otomatik alın.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => {
                setWizard({ step: 0 });
                go("create");
              }}
              className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30 hover:opacity-90 border-0 min-h-[44px]"
            >
              <Wand2 className="size-4" />
              Hemen Başla
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => go("templates")}
              className="min-h-[44px]"
            >
              <Layers className="size-4" />
              Şablonlara Göz At
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Modes */}
      <section>
        <SectionHeader
          eyebrow="Mod seçin"
          title="Nasıl başlayacaksın?"
          desc="Dört farklı başlangıç yolu: konu yaz, ürün yükle, senaryo ver veya YouTube için üret."
        />
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {MODES.map((mode) => {
            return (
              <motion.button
                key={mode.id}
                variants={item}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => pickMode(mode.id)}
                className="group text-left"
              >
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-xl hover:shadow-fuchsia-500/10 hover:border-fuchsia-500/40">
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${mode.gradient}`}
                  />
                  <CardHeader>
                    <div
                      className={`grid size-12 place-items-center rounded-xl bg-gradient-to-br ${mode.gradient} text-2xl shadow-md`}
                    >
                      {mode.emoji}
                    </div>
                    <CardTitle className="mt-3">{mode.label}</CardTitle>
                    <CardDescription className="mt-1">
                      {mode.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-fuchsia-500 group-hover:gap-2 transition-all">
                      Başla <ArrowRight className="size-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* Features */}
      <section>
        <SectionHeader
          eyebrow="Öne çıkan özellikler"
          title="Tek stüdyo, tüm araçlar"
          desc="Senaryo, seslendirme, görsel üretimi, altyazı ve animasyon — hepsi tek yerde."
        />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={item} whileHover={{ y: -4 }}>
                <Card className="h-full hover:border-fuchsia-500/40 transition-colors">
                  <CardHeader>
                    <div
                      className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-base mt-3">{f.title}</CardTitle>
                    <CardDescription className="mt-1 text-xs leading-relaxed">
                      {f.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Recent projects */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <SectionHeader
            eyebrow="Son projeler"
            title="Yakın zamanda oluşturdukların"
            desc=""
            compact
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => go("projects")}
            className="text-fuchsia-500 hover:text-fuchsia-400"
          >
            Tümünü gör
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center flex flex-col items-center gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <FolderOpen className="size-5" />
              </div>
              <div>
                <p className="font-medium">Henüz proje yok</p>
                <p className="text-sm text-muted-foreground">
                  İlk videonu üretmek için hemen başla.
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recent.map((p) => {
              const modeInfo = MODE_MAP[p.mode];
              return (
                <motion.button
                  key={p.id}
                  whileHover={{ y: -3 }}
                  onClick={() => go("detail", p.id)}
                  className="text-left group"
                >
                  <div className="relative overflow-hidden rounded-xl border border-border aspect-video bg-muted">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={p.title}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`size-full grid place-items-center bg-gradient-to-br ${
                          (p.style && STYLE_MAP[p.style]?.gradient) ||
                          "from-violet-500 to-fuchsia-500"
                        }`}
                      >
                        <span className="text-3xl">{modeInfo?.emoji ?? "🎬"}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="size-9 text-white drop-shadow" />
                    </div>
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="flex items-center justify-between gap-1">
                        <StatusDot status={p.status} />
                        <span className="rounded bg-black/60 px-1 text-[10px] text-white tabular-nums">
                          {formatDuration(p.durationSec)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1.5">
                    <p className="text-xs font-medium truncate">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {timeAgo(p.createdAt)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
  compact,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "max-w-2xl"}>
      <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500 font-semibold">
        {eyebrow}
      </p>
      <h2 className={`mt-2 font-bold tracking-tight ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`}>
        {title}
      </h2>
      {desc && <p className="mt-2 text-sm text-muted-foreground">{desc}</p>}
    </div>
  );
}

function StatusDot({ status }: { status: VideoProject["status"] }) {
  const map: Record<VideoProject["status"], string> = {
    draft: "bg-zinc-400",
    generating: "bg-amber-400 animate-pulse",
    ready: "bg-emerald-400",
    error: "bg-rose-500",
  };
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`size-1.5 rounded-full ${map[status]}`} />
    </span>
  );
}
