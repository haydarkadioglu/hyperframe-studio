"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Trash2,
  Loader2,
  Sparkles,
  Eye,
  Clapperboard,
  Info,
  Upload,
  FileText,
  Globe,
  AudioLines,
  Palette,
  RectangleHorizontal,
  Cpu,
  Mic,
  Receipt,
} from "lucide-react";
import { useApp } from "@/lib/store";
import {
  MODES,
  MODE_MAP,
  LANGUAGES,
  TONES,
  STYLES,
  LLM_PROVIDERS,
  TTS_PROVIDERS,
  getVoicesForProvider,
  recommendVoice,
} from "@/lib/providers";
import type {
  VideoMode,
  Tone,
  VideoStyle,
  AspectRatio,
  AnalyzeProductResponse,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createProject,
  renderProject,
  analyzeProduct,
  uploadImage,
  fileToDataUrl,
} from "@/lib/api-client";

const STEPS = ["Mod", "İçerik", "Yapılandırma", "Özet & Üret"];

const ASPECTS: { id: AspectRatio; label: string; hint: string }[] = [
  { id: "16:9", label: "16:9", hint: "Yatay (YouTube)" },
  { id: "9:16", label: "9:16", hint: "Dikey (Shorts/Reels)" },
  { id: "1:1", label: "1:1", hint: "Kare (Instagram)" },
  { id: "4:5", label: "4:5", hint: "Dikey poster" },
];

export function CreateView() {
  const wizard = useApp((s) => s.wizard);
  const setWizard = useApp((s) => s.setWizard);
  const resetWizard = useApp((s) => s.resetWizard);
  const go = useApp((s) => s.go);

  const step = wizard.step;

  const setStep = (next: number) => setWizard({ step: next });

  const canNext = React.useMemo(() => {
    if (step === 0) return Boolean(wizard.mode);
    if (step === 1) {
      if (wizard.mode === "topic") return wizard.topic.trim().length >= 3;
      if (wizard.mode === "youtube") return wizard.topic.trim().length >= 3;
      if (wizard.mode === "product") return wizard.productImages.length > 0;
      if (wizard.mode === "script") return wizard.customScript.trim().length >= 30;
    }
    return true;
  }, [step, wizard]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500 font-semibold">
            Yeni Video
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            Video Oluştur
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            4 adımda videonuzu üretin.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetWizard();
            go("home");
          }}
        >
          Sıfırla
        </Button>
      </header>

      {/* Step indicator - connected progress bar */}
      <div className="relative">
        <ol className="flex items-center gap-2">
          {STEPS.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <li key={label} className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all min-h-[36px] shrink-0",
                    active
                      ? "border-fuchsia-500 bg-fuchsia-500/10 text-foreground"
                      : done
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15"
                      : "border-border text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "relative grid size-5 place-items-center rounded-full text-[10px]",
                      active
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                        : done
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute inset-0 rounded-full bg-fuchsia-500/40 animate-ping" />
                    )}
                    <span className="relative">
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <span
                    className={cn(
                      "h-px flex-1 transition-colors",
                      done ? "bg-gradient-to-r from-emerald-500/60 to-fuchsia-500/40" : "bg-border"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {step === 0 && <StepMode />}
          {step === 1 && <StepContent />}
          {step === 2 && <StepConfig />}
          {step === 3 && <StepSummary />}
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => {
            if (step === 0) go("home");
            else setStep(step - 1);
          }}
          className="min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          {step === 0 ? "İptal" : "Geri"}
        </Button>
        {step < 3 && (
          <Button
            onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white border-0 min-h-[44px]"
          >
            İleri
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------- Step 0: Mode ----------
function StepMode() {
  const wizard = useApp((s) => s.wizard);
  const setWizard = useApp((s) => s.setWizard);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Videonuzun tipini seçin. Bu, hangi içeriği girmeniz gerektiğini
        belirler.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODES.map((m) => {
          const active = wizard.mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setWizard({ mode: m.id as VideoMode })}
              className={cn(
                "group text-left",
                active ? "ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-background rounded-2xl" : ""
              )}
            >
              <Card
                className={cn(
                  "h-full overflow-hidden transition-all hover:shadow-lg",
                  active
                    ? "border-fuchsia-500/50"
                    : "hover:border-fuchsia-500/30"
                )}
              >
                <div className={cn("h-1.5 w-full bg-gradient-to-r", m.gradient)} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "grid size-12 place-items-center rounded-xl bg-gradient-to-br text-2xl shadow-md",
                        m.gradient
                      )}
                    >
                      {m.emoji}
                    </div>
                    {active && (
                      <Badge className="bg-fuchsia-500 border-0 text-white">
                        <Check className="size-3" />
                        Seçili
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-3">{m.label}</CardTitle>
                  <CardDescription>{m.description}</CardDescription>
                </CardHeader>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Step 1: Content ----------
function StepContent() {
  const wizard = useApp((s) => s.wizard);
  const setWizard = useApp((s) => s.setWizard);

  if (wizard.mode === "product") return <ProductMode />;
  if (wizard.mode === "script") return <ScriptMode />;
  if (wizard.mode === "youtube") return <YoutubeMode />;
  // default: topic
  return <TopicMode />;
}

function TopicMode() {
  const wizard = useApp((s) => s.wizard);
  const setWizard = useApp((s) => s.setWizard);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-violet-500/20 text-violet-500">
            <Sparkles className="size-4" />
          </span>
          Konu / Başlık
        </CardTitle>
        <CardDescription>
          Videonuz ne hakkında olsun? Bir cümle, anahtar kelimeler veya uzun bir
          açıklama yazabilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Konu</Label>
          <Textarea
            id="topic"
            value={wizard.topic}
            onChange={(e) => setWizard({ topic: e.target.value })}
            placeholder="Örn: Yapay zekânın eğitim üzerindeki etkileri"
            className="min-h-24"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sahne sayısı</Label>
            <Badge variant="secondary">{wizard.targetScenes} sahne</Badge>
          </div>
          <Slider
            min={3}
            max={8}
            step={1}
            value={[wizard.targetScenes]}
            onValueChange={(v) => setWizard({ targetScenes: v[0] })}
          />
          <p className="text-xs text-muted-foreground">
            3-8 sahne arası önerilir. Her sahne ~4-8 saniye sürer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function YoutubeMode() {
  const wizard = useApp((s) => s.wizard);
  const setWizard = useApp((s) => s.setWizard);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-rose-500/20 text-rose-500">
            <Clapperboard className="size-4" />
          </span>
          YouTube İçeriği
        </CardTitle>
        <CardDescription>
          Konuyu girin, AI videoyu YouTube için optimize etsin. SRT/VTT
          altyazıları üretim sonrası indirebilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="yt-topic">Video konusu</Label>
          <Textarea
            id="yt-topic"
            value={wizard.topic}
            onChange={(e) => setWizard({ topic: e.target.value })}
            placeholder="Örn: 5 verimlilik ipucu (Shorts için ideal)"
            className="min-h-24"
          />
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 flex gap-3">
          <Info className="size-5 text-rose-500 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-foreground">YouTube Altyazı Notu</p>
            <p className="text-muted-foreground">
              Üretim tamamlandığında, <strong>SRT</strong> ve <strong>VTT</strong>{" "}
              dosyalarını video detay sayfasından indirebilirsiniz. Sahne
              sürelerine göre zamanlanmıştır.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sahne sayısı</Label>
            <Badge variant="secondary">{wizard.targetScenes} sahne</Badge>
          </div>
          <Slider
            min={3}
            max={8}
            step={1}
            value={[wizard.targetScenes]}
            onValueChange={(v) => setWizard({ targetScenes: v[0] })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ScriptMode() {
  const wizard = useApp((s) => s.wizard);
  const setWizard = useApp((s) => s.setWizard);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-500">
            <FileText className="size-4" />
          </span>
          Senaryonuz
        </CardTitle>
        <CardDescription>
          Hazır metninizi girin. AI bunu sahnelere bölecek, her sahneye görsel
          ve seslendirmeyi üretecektir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customScript">Senaryo metni</Label>
          <Textarea
            id="customScript"
            value={wizard.customScript}
            onChange={(e) => setWizard({ customScript: e.target.value })}
            placeholder="Buraya senaryonuzu yapıştırın... Paragraflar sahne olarak değerlendirilir."
            className="min-h-48 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {wizard.customScript.trim().split(/\s+/).filter(Boolean).length}{" "}
            kelime ·{" "}
            {wizard.customScript.trim().split(/\n+/).filter(Boolean).length}{" "}
            paragraf
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sahne sayısı (önerilen)</Label>
            <Badge variant="secondary">{wizard.targetScenes} sahne</Badge>
          </div>
          <Slider
            min={3}
            max={8}
            step={1}
            value={[wizard.targetScenes]}
            onValueChange={(v) => setWizard({ targetScenes: v[0] })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ProductMode() {
  const wizard = useApp((s) => s.wizard);
  const setWizard = useApp((s) => s.setWizard);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<AnalyzeProductResponse | null>(null);

  const onPick = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const collected: string[] = [];
      for (const file of Array.from(files).slice(0, 8)) {
        const dataUrl = await fileToDataUrl(file);
        const { url } = await uploadImage(dataUrl, file.name);
        // For product analysis + render, we need both the persisted URL (for display)
        // and the data URL (for VLM). We persist to /assets/ via upload and keep dataUrl
        // for sending to render. Store BOTH: the dataUrl so it can be sent to render API.
        // The display layer uses the persisted url OR the dataUrl (both work in <img>).
        collected.push(dataUrl);
      }
      setWizard({ productImages: [...wizard.productImages, ...collected] });
      toast.success(`${collected.length} görsel yüklendi`);
    } catch (e: any) {
      toast.error("Yükleme hatası", { description: e?.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setWizard({
      productImages: wizard.productImages.filter((_, i) => i !== idx),
    });
  };

  const runAnalysis = async () => {
    const first = wizard.productImages[0];
    if (!first) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await analyzeProduct({
        image: first,
        language: wizard.language,
      });
      setAnalysis(res);
      toast.success("Ürün analizi tamamlandı");
    } catch (e: any) {
      toast.error("Analiz hatası", { description: e?.message });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-amber-500/20 text-amber-500">
              <ImagePlus className="size-4" />
            </span>
            Ürün Görselleri
          </CardTitle>
          <CardDescription>
            Ürün fotoğraflarınızı yükleyin. AI (VLM) ile analiz edilecek ve
            tanıtım videosu oluşturulacak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(e) => {
              e.preventDefault();
              onPick(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-colors p-8 text-center"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onPick(e.target.files)}
            />
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground mb-3">
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-fuchsia-500" />
              ) : (
                <Upload className="size-5" />
              )}
            </div>
            <p className="text-sm font-medium">
              {uploading
                ? "Yükleniyor..."
                : "Sürükleyip bırakın veya tıklayın"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP · en fazla 8 görsel
            </p>
          </div>

          {wizard.productImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {wizard.productImages.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border group"
                >
                  <img
                    src={img}
                    alt={`Ürün ${i + 1}`}
                    className="size-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Kaldır"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex gap-3">
            <Eye className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Ürün fotoğrafları AI ile analiz edilecek. "Analiz et" butonuyla
              örneği görün.
            </p>
          </div>

          <Button
            onClick={runAnalysis}
            disabled={!wizard.productImages.length || analyzing}
            variant="outline"
            className="border-amber-500/40 hover:bg-amber-500/10"
          >
            {analyzing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Eye className="size-4" />
            )}
            {analyzing ? "Analiz ediliyor..." : "Analiz et"}
          </Button>

          {analysis && (
            <Card className="bg-muted/40 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge className="bg-amber-500 border-0 text-white">VLM</Badge>
                  {analysis.name}
                  <span className="text-muted-foreground text-xs font-normal">
                    {analysis.category}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{analysis.description}</p>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    Öne çıkan özellikler
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.features.map((f, i) => (
                      <Badge key={i} variant="secondary">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    Satış noktaları
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                    {analysis.sellingPoints.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Step 2: Configuration ----------
function StepConfig() {
  const wizard = useApp((s) => s.wizard);
  const setWizard = useApp((s) => s.setWizard);

  const voices = getVoicesForProvider(wizard.ttsProvider);

  return (
    <div className="space-y-4">
      <ConfigSection
        title="Dil ve Stil"
        desc="Videonuzun dilini, tonunu ve görsel stilini seçin."
        icon={Palette}
        accent="from-violet-500 to-fuchsia-500"
      >
        {/* Language */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Globe className="size-3.5 text-muted-foreground" />
            Dil
          </Label>
          <Select
            value={wizard.language}
            onValueChange={(v) => setWizard({ language: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Dil seçin" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span className="mr-2">{l.flag}</span>
                  {l.nativeName} ({l.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <AudioLines className="size-3.5 text-muted-foreground" />
            Ton
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONES.map((t) => {
              const active = wizard.tone === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setWizard({ tone: t.id as Tone })}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    active
                      ? "border-fuchsia-500 bg-fuchsia-500/10"
                      : "hover:border-muted-foreground"
                  )}
                >
                  <div className="text-xl mb-1">{t.emoji}</div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {t.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style */}
        <div className="space-y-2">
          <Label>Video stili</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STYLES.map((s) => {
              const active = wizard.style === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setWizard({ style: s.id as VideoStyle })}
                  className={cn(
                    "overflow-hidden rounded-xl border transition-all text-left",
                    active
                      ? "border-fuchsia-500 ring-2 ring-fuchsia-500/30"
                      : "hover:border-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-full bg-gradient-to-r",
                      s.gradient
                    )}
                  />
                  <div className="p-2">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {s.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Aspect ratio */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <RectangleHorizontal className="size-3.5 text-muted-foreground" />
            En-boy oranı
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ASPECTS.map((a) => {
              const active = wizard.aspectRatio === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setWizard({ aspectRatio: a.id })}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    active
                      ? "border-fuchsia-500 bg-fuchsia-500/10"
                      : "hover:border-muted-foreground"
                  )}
                >
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground">{a.hint}</p>
                </button>
              );
            })}
          </div>
        </div>
      </ConfigSection>

      <ConfigSection
        title="Sağlayıcılar"
        desc="Hangi LLM ile senaryo, hangi TTS ile seslendirme yapılacağını seçin."
        icon={Cpu}
        accent="from-fuchsia-500 to-pink-500"
      >
        {/* LLM */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Cpu className="size-3.5 text-muted-foreground" />
            LLM Sağlayıcısı
          </Label>
          <Select
            value={wizard.llmProvider}
            onValueChange={(v) => setWizard({ llmProvider: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LLM_PROVIDERS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex flex-col">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {p.models.join(", ")}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ProviderBadges requiresKey={LLM_PROVIDERS.find((p) => p.id === wizard.llmProvider)?.requiresKey} />
        </div>

        {/* TTS */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Mic className="size-3.5 text-muted-foreground" />
            TTS Sağlayıcısı
          </Label>
          <Select
            value={wizard.ttsProvider}
            onValueChange={(v) => {
              const voices = getVoicesForProvider(v);
              const rec = recommendVoice(v, wizard.tone, wizard.language);
              setWizard({
                ttsProvider: v,
                voice: voices.find((vv) => vv.id === rec)?.id ?? voices[0]?.id ?? "",
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TTS_PROVIDERS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex flex-col">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {p.voices.length} ses
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ProviderBadges requiresKey={TTS_PROVIDERS.find((p) => p.id === wizard.ttsProvider)?.requiresKey} />
        </div>

        {/* Voice */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5">
              <Mic className="size-3.5 text-muted-foreground" />
              Ses
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setWizard({
                  voice: recommendVoice(
                    wizard.ttsProvider,
                    wizard.tone,
                    wizard.language
                  ),
                })
              }
            >
              <Sparkles className="size-3.5" />
              Otomatik öner
            </Button>
          </div>
          <Select
            value={wizard.voice}
            onValueChange={(v) => setWizard({ voice: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {voices.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="flex flex-col">
                    <span>
                      {v.name}{" "}
                      <span className="text-[10px] text-muted-foreground">
                        ({v.gender})
                      </span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {v.description}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ConfigSection>
    </div>
  );
}

function ConfigSection({
  title,
  desc,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass card-glow overflow-hidden">
      <div className={cn("h-1 w-full bg-gradient-to-r", accent)} />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={cn("grid size-7 place-items-center rounded-lg bg-gradient-to-br text-white shadow-md", accent)}>
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}

function ProviderBadges({ requiresKey }: { requiresKey?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {requiresKey ? (
        <Badge variant="outline" className="text-amber-500 border-amber-500/40">
          API anahtarı gerekir (Ayarlar'dan)
        </Badge>
      ) : (
        <Badge variant="outline" className="text-emerald-500 border-emerald-500/40">
          Yerleşik — anahtar gerekmez
        </Badge>
      )}
    </div>
  );
}

// ---------- Step 3: Summary & Generate ----------
function StepSummary() {
  const wizard = useApp((s) => s.wizard);
  const resetWizard = useApp((s) => s.resetWizard);
  const go = useApp((s) => s.go);
  const [submitting, setSubmitting] = React.useState(false);

  const generate = async () => {
    setSubmitting(true);
    try {
      const project = await createProject({
        title:
          wizard.title ||
          (wizard.mode === "script"
            ? wizard.customScript.slice(0, 60)
            : wizard.topic.slice(0, 60)) ||
          "Yeni Video",
        topic:
          wizard.mode === "script" ? wizard.customScript.slice(0, 200) : wizard.topic,
        mode: wizard.mode,
        language: wizard.language,
        llmProvider: wizard.llmProvider,
        ttsProvider: wizard.ttsProvider,
        voice: wizard.voice,
        tone: wizard.tone,
        style: wizard.style,
        aspectRatio: wizard.aspectRatio,
        productImages: wizard.mode === "product" ? wizard.productImages : undefined,
        customScript: wizard.mode === "script" ? wizard.customScript : undefined,
        targetScenes: wizard.targetScenes,
      });

      await renderProject(project.id, {
        productImages:
          wizard.mode === "product" ? wizard.productImages : undefined,
        customScript: wizard.mode === "script" ? wizard.customScript : undefined,
        targetScenes: wizard.targetScenes,
      });

      toast.success("Üretim başladı", {
        description: "Senaryo, görseller, seslendirme ve altyazılar hazırlanıyor.",
      });

      resetWizard();
      go("detail", project.id);
    } catch (e: any) {
      toast.error("Üretim başlatılamadı", { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  const mode = MODE_MAP[wizard.mode];

  const summary: { label: string; value: string }[] = [
    { label: "Mod", value: `${mode?.emoji} ${mode?.label}` },
    {
      label: "Konu",
      value:
        wizard.mode === "script"
          ? `${wizard.customScript.slice(0, 80)}...`
          : wizard.topic || "—",
    },
    {
      label: "Sahne sayısı",
      value: String(wizard.targetScenes),
    },
    {
      label: "Dil",
      value: LANGUAGES.find((l) => l.code === wizard.language)?.nativeName || wizard.language,
    },
    {
      label: "Ton",
      value: `${TONES.find((t) => t.id === wizard.tone)?.emoji} ${
        TONES.find((t) => t.id === wizard.tone)?.label
      }`,
    },
    {
      label: "Stil",
      value: STYLES.find((s) => s.id === wizard.style)?.label || wizard.style,
    },
    {
      label: "En-boy",
      value: wizard.aspectRatio,
    },
    {
      label: "LLM",
      value:
        LLM_PROVIDERS.find((p) => p.id === wizard.llmProvider)?.name ||
        wizard.llmProvider,
    },
    {
      label: "TTS",
      value:
        TTS_PROVIDERS.find((p) => p.id === wizard.ttsProvider)?.name ||
        wizard.ttsProvider,
    },
    {
      label: "Ses",
      value:
        getVoicesForProvider(wizard.ttsProvider).find((v) => v.id === wizard.voice)
          ?.name || wizard.voice,
    },
  ];

  if (wizard.mode === "product") {
    summary.splice(2, 0, {
      label: "Ürün görselleri",
      value: `${wizard.productImages.length} görsel`,
    });
  }

  return (
    <div className="space-y-4">
      {/* Receipt-styled summary card */}
      <Card className="glass overflow-hidden relative">
        {/* gradient header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-md">
              <Receipt className="size-4" />
            </span>
            Özet
          </CardTitle>
          <CardDescription>
            Tüm seçimleri kontrol edin ve üretimi başlatın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* receipt body with perforated edges */}
          <div className="relative rounded-xl bg-muted/30 border border-dashed border-border p-1">
            <dl className="divide-y divide-border">
              {summary.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-4 py-2.5 px-3"
                >
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="text-sm font-medium text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border-fuchsia-500/30 glass-strong">
        <CardContent className="py-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="text-center sm:text-left">
            <p className="text-base font-semibold">Videoyu üretmeye hazır mısın?</p>
            <p className="text-xs text-muted-foreground">
              Üretim arka planda çalışır — senaryo, görseller, seslendirme ve
              altyazılar otomatik oluşturulur.
            </p>
          </div>
          <Button
            onClick={generate}
            disabled={submitting}
            className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white border-0 shadow-lg shadow-fuchsia-500/30 min-h-[44px] min-w-[160px]"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Başlatılıyor...
              </>
            ) : (
              <>
                <Wand2 className="size-4" />
                Videoyu Üret
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
