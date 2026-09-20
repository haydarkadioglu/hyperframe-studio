"use client";

import * as React from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  Sparkles,
  Wand2,
  Video,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Cpu,
  AudioLines,
  PlayCircle,
} from "lucide-react";
import { useApp } from "@/lib/store";
import {
  getStats,
  listProjects,
  timeAgo,
  formatDuration,
  type StatsData,
  type ApiError,
} from "@/lib/api-client";
import {
  getLLMProvider,
  getTTSProvider,
  MODE_MAP,
  STYLE_MAP,
} from "@/lib/providers";
import type { VideoProject } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "var(--accent-1)", // violet (theme-aware)
  "var(--accent-2)", // fuchsia (theme-aware)
  "var(--accent-3)", // pink (theme-aware)
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#f43f5e", // rose
];

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

export function DashboardView() {
  const go = useApp((s) => s.go);
  const setWizard = useApp((s) => s.setWizard);
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [recent, setRecent] = React.useState<VideoProject[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      getStats().catch((e: ApiError) => {
        toast.error("İstatistikler yüklenemedi", { description: e.message });
        return null;
      }),
      listProjects().catch((e: ApiError) => {
        toast.error("Projeler yüklenemedi", { description: e.message });
        return [] as VideoProject[];
      }),
    ]).then(([s, p]) => {
      if (!alive) return;
      setStats(s);
      setRecent(p.slice(0, 5));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const total = stats?.totals.total ?? 0;

  if (total === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <Card className="border-dashed overflow-hidden">
          <CardContent className="relative py-20 flex flex-col items-center text-center gap-4">
            <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />
            <div className="relative grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-xl shadow-fuchsia-500/30">
              <Video className="size-9" />
            </div>
            <div className="relative">
              <p className="text-lg font-bold">Henüz video yok</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                İlk videonu üretmek için bir mod seç, AI senaryo, görsel ve
                seslendirmeyi senin için hazırlasın.
              </p>
            </div>
            <Button
              onClick={() => {
                setWizard({ step: 0 });
                go("create");
              }}
              className="relative bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white border-0 shadow-lg shadow-fuchsia-500/30 min-h-[44px]"
            >
              <Wand2 className="size-4" />
              İlk videonu oluştur
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 accent-mesh rounded-2xl">
      <Header />

      {/* KPI cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KpiCard
          icon={Video}
          gradient="from-violet-500 to-fuchsia-500"
          value={stats?.totals.total ?? 0}
          label="Toplam Video"
          subtitle="Şu ana kadar üretilen"
        />
        <KpiCard
          icon={CheckCircle2}
          gradient="from-emerald-500 to-teal-500"
          value={stats?.totals.ready ?? 0}
          label="Hazır"
          subtitle="Oynatmaya hazır"
        />
        <KpiCard
          icon={Clock}
          gradient="from-amber-500 to-orange-500"
          value={stats?.totals.totalDurationSec ?? 0}
          label="Toplam Süre"
          subtitle="Tüm videolar boyunca"
          formatDurationValue
        />
        <KpiCard
          icon={Layers}
          gradient="from-cyan-500 to-blue-500"
          value={stats?.totals.totalScenes ?? 0}
          label="Toplam Sahne"
          subtitle="Tüm videolarda"
        />
      </motion.div>

      {/* Accent-aware divider between KPIs and charts */}
      <div className="divider-gradient" aria-hidden />

      {/* Activity chart */}
      <Card className="glass relative overflow-hidden">
        <div className="orb orb-sm bg-violet-500/15 -top-10 -right-10" />
        <CardHeader>
          <div className="flex items-center justify-between relative">
            <div>
              <CardTitle className="text-base">Son 14 Gün Aktivite</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Günlük oluşturulan video sayısı
              </p>
            </div>
            <Badge className="bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30">
              <Sparkles className="size-3" />
              Son 14 gün
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats?.dailyActivity ?? []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.55} />
                    <stop offset="50%" stopColor="var(--accent-1)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--accent-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="activityStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--accent-1)" />
                    <stop offset="50%" stopColor="var(--accent-2)" />
                    <stop offset="100%" stopColor="var(--accent-3)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-border/40"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20,20,22,0.92)",
                    border: "1px solid rgba(217,70,239,0.3)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#e879f9", fontWeight: 600 }}
                  formatter={(v: number) => [`${v} video`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Video"
                  stroke="url(#activityStroke)"
                  strokeWidth={2.5}
                  fill="url(#activityFill)"
                  dot={false}
                  activeDot={{ r: 5, fill: "var(--accent-2)", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass relative overflow-hidden">
          <div className="orb orb-sm bg-fuchsia-500/15 -bottom-12 -left-10" />
          <CardHeader className="relative">
            <CardTitle className="text-base">Mod Dağılımı</CardTitle>
            <p className="text-xs text-muted-foreground">
              Hangi üretim modunu ne kadar kullandın
            </p>
          </CardHeader>
          <CardContent className="relative">
            <DistributionPie data={stats?.distributions.byMode ?? []} />
          </CardContent>
        </Card>

        <Card className="glass relative overflow-hidden">
          <div className="orb orb-sm bg-pink-500/15 -top-10 -left-10" />
          <CardHeader className="relative">
            <CardTitle className="text-base">Dil Dağılımı</CardTitle>
            <p className="text-xs text-muted-foreground">
              Videoların dil kırılımı
            </p>
          </CardHeader>
          <CardContent className="relative">
            <LanguageBar data={stats?.distributions.byLanguage ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Provider usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProviderUsageCard
          title="LLM Sağlayıcı Kullanımı"
          icon={Cpu}
          accent="violet"
          data={stats?.distributions.byLlmProvider ?? []}
          resolver={(id) => getLLMProvider(id)?.name ?? id}
        />
        <ProviderUsageCard
          title="TTS Sağlayıcı Kullanımı"
          icon={AudioLines}
          accent="fuchsia"
          data={stats?.distributions.byTtsProvider ?? []}
          resolver={(id) => getTTSProvider(id)?.name ?? id}
        />
      </div>

      {/* Recent projects */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Son Projeler</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                En son oluşturduğun 5 video
              </p>
            </div>
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
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Henüz proje yok.
            </p>
          ) : (
            <ul className="space-y-1">
              {recent.map((p, i) => {
                const modeInfo = MODE_MAP[p.mode];
                const styleInfo = STYLE_MAP[p.style];
                return (
                  <motion.li
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => go("detail", p.id)}
                      className="group w-full flex items-center gap-3 rounded-xl p-2 hover:bg-accent/60 transition-colors text-left"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {p.thumbnailUrl ? (
                          <img
                            src={p.thumbnailUrl}
                            alt={p.title}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div
                            className={cn(
                              "size-full grid place-items-center bg-gradient-to-br",
                              styleInfo?.gradient || "from-violet-500 to-fuchsia-500"
                            )}
                          >
                            <span className="text-lg">{modeInfo?.emoji ?? "🎬"}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="size-5 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate group-hover:text-fuchsia-500 transition-colors">
                          {p.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {modeInfo?.emoji} {modeInfo?.label} · {p.sceneCount} sahne · {formatDuration(p.durationSec)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusPill status={p.status} />
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(p.createdAt)}
                        </span>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <header className="relative overflow-hidden">
      <div className="orb orb-md bg-violet-500/20 -top-20 -right-12" />
      <div className="orb orb-sm bg-fuchsia-500/15 -bottom-16 -left-10" />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500 font-semibold">
          Genel bakış
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-balance">
          Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Üretim istatistiklerin ve genel bakış
        </p>
      </div>
    </header>
  );
}

// ---------- KPI Card with count-up ----------
function KpiCard({
  icon: Icon,
  gradient,
  value,
  label,
  subtitle,
  formatDurationValue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  value: number;
  label: string;
  subtitle: string;
  formatDurationValue?: boolean;
}) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = React.useState("0");
  const displayRef = React.useRef<(s: string) => void>((s) => setDisplay(s));

  React.useEffect(() => {
    const target = value;
    if (formatDurationValue) {
      // animate the second count
      const controls = animate(mv, target, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate: (v) => {
          const m = Math.floor(v / 60);
          const s = Math.floor(v % 60);
          displayRef.current(`${m}d ${s}s`);
        },
      });
      return () => controls.stop();
    }
    const controls = animate(mv, target, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => {
        displayRef.current(String(Math.round(v)));
      },
    });
    return () => controls.stop();
  }, [value, formatDurationValue, mv]);

  return (
    <motion.div variants={item}>
      <Card className="glass card-glow shine-on-hover card-hover-lift h-full overflow-hidden group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "relative grid size-11 place-items-center rounded-xl accent-gradient text-white shadow-md"
              )}
            >
              <Icon className="size-5" />
              {/* Rotating gradient ring on hover */}
              <span className="absolute -inset-1 rounded-xl ring-1 ring-fuchsia-500/30 opacity-0 group-hover:opacity-100 group-hover:rotate-45 transition-all duration-500 pointer-events-none" />
            </div>
            <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-fuchsia-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              {display}
            </p>
            <p className="text-sm font-medium mt-0.5">{label}</p>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------- Donut pie chart ----------
function DistributionPie({
  data,
}: {
  data: { id: string; label: string; emoji: string; count: number }[];
}) {
  const total = data.reduce((a, b) => a + b.count, 0);
  if (total === 0) {
    return <EmptyChart label="Henüz veri yok" />;
  }
  const chartData = data.map((d) => ({
    name: `${d.emoji} ${d.label}`,
    value: d.count,
  }));
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="h-[200px] w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={1}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(20,20,22,0.92)",
                border: "1px solid rgba(217,70,239,0.3)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 12,
              }}
              formatter={(v: number, n: string) => [`${v} video`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 w-full sm:w-1/2 space-y-1.5">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 text-sm py-1"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="truncate">
                  {d.emoji} {d.label}
                </span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">
                  %{pct}
                </span>
                <span className="font-semibold tabular-nums">{d.count}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------- Language horizontal bar ----------
function LanguageBar({
  data,
}: {
  data: { code: string; name: string; flag: string; count: number }[];
}) {
  const total = data.reduce((a, b) => a + b.count, 0);
  if (total === 0) {
    return <EmptyChart label="Henüz veri yok" />;
  }
  const chartData = data.map((d) => ({
    name: `${d.flag} ${d.code.toUpperCase()}`,
    fullName: d.name,
    value: d.count,
  }));
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="langBar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-border/40"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "currentColor" }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            cursor={{ fill: "rgba(217,70,239,0.08)" }}
            contentStyle={{
              backgroundColor: "rgba(20,20,22,0.92)",
              border: "1px solid rgba(217,70,239,0.3)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 12,
            }}
            formatter={(v: number, _n: string, item: any) => [
              `${v} video`,
              item?.payload?.fullName ?? "",
            ]}
          />
          <Bar
            dataKey="value"
            fill="url(#langBar)"
            radius={[0, 8, 8, 0]}
            minPointSize={4}
          >
            <LabelList
              dataKey="value"
              position="right"
              style={{ fill: "currentColor", fontSize: 11, fontWeight: 600 }}
              className="text-foreground"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Provider usage card ----------
function ProviderUsageCard({
  title,
  icon: Icon,
  accent,
  data,
  resolver,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "violet" | "fuchsia";
  data: { id: string; count: number }[];
  resolver: (id: string) => string;
}) {
  const total = data.reduce((a, b) => a + b.count, 0);
  const accentClass =
    accent === "violet"
      ? "from-violet-500 to-fuchsia-500 text-violet-300"
      : "from-fuchsia-500 to-pink-500 text-fuchsia-300";
  return (
    <Card className="glass card-glow h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg bg-gradient-to-br text-white shadow-md",
              accentClass
            )}
          >
            <Icon className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Toplam {total} kullanım
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Henüz veri yok
          </p>
        ) : (
          data.map((d, i) => {
            const name = resolver(d.id);
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
            return (
              <motion.div
                key={d.id + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {d.count} · %{pct}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        accentClass
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn("shrink-0", accentClass)}
                >
                  {d.count}
                </Badge>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Status pill ----------
function StatusPill({ status }: { status: VideoProject["status"] }) {
  const map: Record<VideoProject["status"], { label: string; cls: string }> = {
    draft: {
      label: "Taslak",
      cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    },
    generating: {
      label: "Üretiliyor",
      cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    ready: {
      label: "Hazır",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    error: {
      label: "Hata",
      cls: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    },
  };
  const m = map[status];
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", m.cls)}>
      {m.label}
    </Badge>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[200px] grid place-items-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

// ---------- Skeleton ----------
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[280px] rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[280px] rounded-2xl" />
        <Skeleton className="h-[280px] rounded-2xl" />
      </div>
      <Skeleton className="h-[280px] rounded-2xl" />
    </div>
  );
}
