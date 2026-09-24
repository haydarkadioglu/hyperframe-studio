"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LayoutTemplate, Wand2, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLocale } from "@/lib/use-locale";
import { MODE_MAP, TONE_MAP, STYLE_MAP, LANGUAGE_MAP } from "@/lib/providers";
import type { VideoMode, Tone, VideoStyle, AspectRatio } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  desc: string;
  nameKey?: string;
  descKey?: string;
  mode: VideoMode;
  tone: Tone;
  style: VideoStyle;
  language: string;
  aspectRatio?: AspectRatio;
  emoji: string;
  gradient: string;
}

const TEMPLATES: Template[] = [
  {
    id: "product-launch",
    name: "Ürün Lansmanı",
    desc: "Yeni bir ürünü tanıtmak için enerjik ve canlı bir tanıtım videosu.",
    nameKey: "templates.launch",
    descKey: "templates.launch.desc",
    mode: "product",
    tone: "energetic",
    style: "vibrant",
    language: "tr",
    emoji: "🚀",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    id: "tech-news",
    name: "Teknoloji Haber",
    desc: "Tarafsız, net bir anchorman tonuyla teknoloji haberi formatı.",
    nameKey: "templates.techNews",
    descKey: "templates.techNews.desc",
    mode: "topic",
    tone: "news",
    style: "corporate",
    language: "tr",
    emoji: "📰",
    gradient: "from-cyan-600 via-blue-600 to-indigo-700",
  },
  {
    id: "motivation",
    name: "Motivasyon Paylaşımı",
    desc: "Sosyal medya için ilham verici, cesur bir motivasyon klibi.",
    nameKey: "templates.motivation",
    descKey: "templates.motivation.desc",
    mode: "topic",
    tone: "inspirational",
    style: "bold",
    language: "tr",
    emoji: "✨",
    gradient: "from-rose-600 via-red-600 to-orange-600",
  },
  {
    id: "edu-explain",
    name: "Eğitim Anlatımı",
    desc: "Belgesel tarzı, sade ve bilgilendirici bir konu anlatımı.",
    nameKey: "templates.education",
    descKey: "templates.education.desc",
    mode: "topic",
    tone: "documentary",
    style: "minimal",
    language: "tr",
    emoji: "🎓",
    gradient: "from-zinc-100 via-zinc-200 to-zinc-300",
  },
  {
    id: "yt-shorts",
    name: "YouTube Shorts",
    desc: "Dikey 9:16, hızlı tempolu ve enerjik YouTube Shorts formatı.",
    nameKey: "templates.shorts",
    descKey: "templates.shorts.desc",
    mode: "youtube",
    tone: "energetic",
    style: "modern",
    language: "tr",
    aspectRatio: "9:16",
    emoji: "▶️",
    gradient: "from-violet-500 via-fuchsia-500 to-pink-500",
  },
  {
    id: "corp-intro",
    name: "Kurumsal Tanıtım",
    desc: "Profesyonel ve zarif bir kurum veya marka tanıtım videosu.",
    nameKey: "templates.corporate",
    descKey: "templates.corporate.desc",
    mode: "product",
    tone: "professional",
    style: "elegant",
    language: "tr",
    emoji: "🏢",
    gradient: "from-amber-700 via-yellow-600 to-amber-400",
  },
  {
    id: "doc-trailer",
    name: "Belgesel Fragmanı",
    desc: "Dramatik ve sinematik ton, sürükleyici bir fragman havası.",
    nameKey: "templates.docTrailer",
    descKey: "templates.docTrailer.desc",
    mode: "topic",
    tone: "dramatic",
    style: "cinematic",
    language: "tr",
    emoji: "🎬",
    gradient: "from-slate-800 via-slate-900 to-black",
  },
  {
    id: "social-ad",
    name: "Sosyal Medya Reklamı",
    desc: "Kare 1:1, samimi ve eğlenceli bir sosyal medya reklam klibi.",
    nameKey: "templates.socialAd",
    descKey: "templates.socialAd.desc",
    mode: "product",
    tone: "friendly",
    style: "playful",
    language: "tr",
    aspectRatio: "1:1",
    emoji: "🛍️",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
  },
  {
    id: "english-pitch",
    name: "English Pitch",
    desc: "Professional English product pitch for international audiences.",
    mode: "product",
    tone: "professional",
    style: "modern",
    language: "en",
    emoji: "🇬🇧",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "spanish-promo",
    name: "Promo en Español",
    desc: "Energetic Spanish-language promo with vibrant visual style.",
    mode: "topic",
    tone: "energetic",
    style: "vibrant",
    language: "es",
    emoji: "🇪🇸",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
  },
  {
    id: "minimal-cta",
    name: "Minimal Çağrı",
    desc: "Beyaz, sade arka plan ile net bir çağrı (CTA) videosu.",
    mode: "topic",
    tone: "calm",
    style: "minimal",
    language: "tr",
    emoji: "🤍",
    gradient: "from-zinc-100 via-zinc-200 to-zinc-300",
  },
  {
    id: "bold-announce",
    name: "Cesur Duyuru",
    desc: "Yüksek kontrast, tipografi odaklı, dikkat çekici duyuru klibi.",
    mode: "topic",
    tone: "dramatic",
    style: "bold",
    language: "tr",
    emoji: "🔥",
    gradient: "from-rose-600 via-red-600 to-orange-600",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function TemplatesView() {
  const go = useApp((s) => s.go);
  const setWizard = useApp((s) => s.setWizard);
  const { t } = useLocale();

  const applyTemplate = (tpl: Template) => {
    setWizard({
      mode: tpl.mode,
      tone: tpl.tone,
      style: tpl.style,
      language: tpl.language,
      aspectRatio: tpl.aspectRatio ?? "16:9",
      step: 1,
    });
    go("create");
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden">
        <div className="orb orb-sm bg-fuchsia-500/30 -top-6 right-4" />
        <div className="orb orb-sm bg-violet-500/25 -bottom-8 -left-6" />
        <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500 font-semibold relative">
          {t("templates.subtitle")}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-balance relative">
          <LayoutTemplate className="size-6 text-fuchsia-500" />
          {t("templates.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl relative">
          {t("templates.subtitle")}
        </p>
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {TEMPLATES.map((tpl) => {
          const modeInfo = MODE_MAP[tpl.mode];
          const toneInfo = TONE_MAP[tpl.tone];
          const styleInfo = STYLE_MAP[tpl.style];
          const langInfo = LANGUAGE_MAP[tpl.language];
          const name = tpl.nameKey ? t(tpl.nameKey) : tpl.name;
          const desc = tpl.descKey ? t(tpl.descKey) : tpl.desc;
          return (
            <motion.button
              key={tpl.id}
              variants={item}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => applyTemplate(tpl)}
              className="text-left"
            >
              <Card className="glass card-glow shine-on-hover card-hover-lift h-full overflow-hidden group hover:border-fuchsia-500/50 accent-ring-hover relative">
                {/* Taller gradient banner with decorative pattern */}
                <div className="relative aspect-[3/1.6] overflow-hidden">
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br animated-gradient bg-[length:200%_200%]",
                      tpl.gradient
                    )}
                  />
                  {/* Decorative dots pattern */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                      backgroundSize: "12px 12px",
                    }}
                  />
                  {/* Diagonal stripes overlay (subtle) */}
                  <div
                    className="absolute inset-0 opacity-15 mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 8px)",
                    }}
                  />
                  {/* decorative shapes */}
                  <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-10 -left-6 size-28 rounded-full bg-white/5 blur-2xl" />
                  <div className="absolute top-1/4 right-1/4 size-1.5 rounded-full bg-white/40" />
                  <div className="absolute top-1/2 right-1/3 size-1 rounded-full bg-white/30" />
                  <div className="absolute bottom-1/3 right-1/2 size-1.5 rounded-full bg-white/40" />

                  <div className="absolute inset-0 grid place-items-center">
                    <span className="text-6xl drop-shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                      {tpl.emoji}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {tpl.aspectRatio && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                        {tpl.aspectRatio}
                      </Badge>
                    </div>
                  )}
                  {/* Slide-up "Use" CTA on hover */}
                  <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="rounded-lg accent-gradient px-3 py-2 text-center text-sm font-semibold text-white shadow-lg flex items-center justify-center gap-1.5">
                      {t("templates.use")}
                      <ArrowRight className="size-3.5" />
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    {name}
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-fuchsia-500 group-hover:translate-x-1 transition-all" />
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {modeInfo?.emoji} {t(`mode.${tpl.mode}.label`)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {toneInfo?.emoji} {t(`tone.${tpl.tone}.label`)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {styleInfo?.label}
                    </Badge>
                    {langInfo && (
                      <Badge variant="outline" className="text-[10px]">
                        {langInfo.flag} {langInfo.code.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </motion.div>

      <Card className="border-dashed">
        <CardContent className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-medium">{t("templates.startBlank")}</p>
          </div>
          <Button
            onClick={() => {
              setWizard({ step: 0 });
              go("create");
            }}
            className="btn-gradient shine-on-hover text-white border-0 min-h-[44px] relative overflow-hidden"
          >
            <Wand2 className="size-4" />
            {t("templates.startBlank")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
