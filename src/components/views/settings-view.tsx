"use client";

import * as React from "react";
import {
  Save,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  CheckCircle2,
  Cpu,
  AudioLines,
} from "lucide-react";
import {
  LLM_PROVIDERS,
  TTS_PROVIDERS,
  LANGUAGES,
  TONES,
  STYLES,
} from "@/lib/providers";
import type { ProviderSettings, Tone, VideoStyle } from "@/lib/types";
import {
  getSettings,
  saveSettings,
  type ApiError,
} from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LOCAL_KEY = "hf:defaults";

interface LocalDefaults {
  language: string;
  tone: Tone;
  style: VideoStyle;
}

const DEFAULT_LOCAL: LocalDefaults = {
  language: "tr",
  tone: "professional",
  style: "modern",
};

export function SettingsView() {
  const [settings, setSettings] = React.useState<ProviderSettings>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [local, setLocal] = React.useState<LocalDefaults>(DEFAULT_LOCAL);

  React.useEffect(() => {
    getSettings()
      .then((s) => setSettings(s))
      .catch((e: ApiError) => toast.error("Ayarlar yüklenemedi", { description: e.message }))
      .finally(() => setLoading(false));

    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (stored) setLocal({ ...DEFAULT_LOCAL, ...JSON.parse(stored) });
    } catch {
      // ignore
    }
  }, []);

  const updateProvider = (
    id: string,
    patch: Partial<ProviderSettings[string]>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // persist local defaults
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
      } catch {
        // ignore
      }
      const saved = await saveSettings(settings);
      setSettings(saved);
      toast.success("Ayarlar kaydedildi");
    } catch (e: any) {
      toast.error("Kayıt hatası", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500 font-semibold">
            Yapılandırma
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            Ayarlar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI sağlayıcılarını ve varsayılan tercihleri yönetin.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="btn-gradient shine-on-hover border-0 min-h-[44px] relative overflow-hidden"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Kaydet
        </Button>
      </header>

      {/* Local defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Genel</CardTitle>
          <CardDescription>
            Yeni videolar için varsayılan tercihler (tarayıcında saklanır).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Varsayılan dil</Label>
            <Select
              value={local.language}
              onValueChange={(v) => setLocal((l) => ({ ...l, language: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.flag} {l.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Varsayılan ton</Label>
            <Select
              value={local.tone}
              onValueChange={(v) => setLocal((l) => ({ ...l, tone: v as Tone }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.emoji} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Varsayılan stil</Label>
            <Select
              value={local.style}
              onValueChange={(v) => setLocal((l) => ({ ...l, style: v as VideoStyle }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="size-5 text-violet-500" />
          <h2 className="text-lg font-semibold tracking-tight">LLM Sağlayıcıları</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {LLM_PROVIDERS.map((p) => (
            <ProviderCard
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description}
              requiresKey={p.requiresKey}
              website={p.website}
              models={p.models}
              settings={settings[p.id]}
              onChange={(patch) => updateProvider(p.id, patch)}
            />
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AudioLines className="size-5 text-fuchsia-500" />
          <h2 className="text-lg font-semibold tracking-tight">TTS Sağlayıcıları</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {TTS_PROVIDERS.map((p) => (
            <ProviderCard
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description}
              requiresKey={p.requiresKey}
              website={p.website}
              voices={p.voices.map((v) => `${v.name} — ${v.description}`)}
              settings={settings[p.id]}
              onChange={(patch) => updateProvider(p.id, patch)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

interface ProviderCardProps {
  id: string;
  name: string;
  description: string;
  requiresKey: boolean;
  website?: string;
  models?: string[];
  voices?: string[];
  settings?: ProviderSettings[string];
  onChange: (patch: Partial<ProviderSettings[string]>) => void;
}

// Provider emoji/logo tile lookup
function providerEmoji(id: string, name: string): string {
  const map: Record<string, string> = {
    zai: "🤖",
    openai: "🧠",
    anthropic: "📚",
    gemini: "💎",
    elevenlabs: "🔊",
    "openai-tts": "🗣️",
  };
  return map[id] ?? "⚡";
}

function ProviderCard({
  id,
  name,
  description,
  requiresKey,
  website,
  models,
  voices,
  settings,
  onChange,
}: ProviderCardProps) {
  const [showKey, setShowKey] = React.useState(false);
  const enabled = settings?.enabled ?? !requiresKey;
  const apiKey = settings?.apiKey ?? "";
  const isBuiltIn = !requiresKey;
  const emoji = providerEmoji(id, name);

  return (
    <Card
      className={cn(
        "glass card-glow shine-on-hover card-hover-lift overflow-hidden relative",
        enabled ? "border-fuchsia-500/30" : "",
        isBuiltIn && "pulse-glow"
      )}
    >
      {/* Left vertical animated gradient border for enabled providers */}
      {enabled && (
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500 animated-gradient-x bg-[length:100%_200%]"
        />
      )}
      <div
        className={cn(
          "h-1 w-full",
          isBuiltIn
            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
            : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
        )}
      />
      <CardHeader className="pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className={cn(
                "relative grid size-12 place-items-center rounded-xl text-2xl shadow-md shrink-0",
                isBuiltIn
                  ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
                  : enabled
                  ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20"
                  : "bg-muted"
              )}
            >
              {emoji}
              {/* gradient ring on enabled */}
              {enabled && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute -inset-0.5 rounded-xl ring-1 pointer-events-none",
                    isBuiltIn
                      ? "ring-emerald-500/40"
                      : "ring-fuchsia-500/40"
                  )}
                />
              )}
            </span>
            <div className="min-w-0">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                {name}
                {isBuiltIn && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="size-3" />
                    Yerleşik
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={(v) => onChange({ enabled: v })} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pl-6">
        {isBuiltIn ? (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Yerleşik — anahtar gerekmez, hemen çalışır.
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`key-${id}`} className="flex items-center gap-2">
              <KeyRound className="size-3.5" />
              API Anahtarı
            </Label>
            <div className="relative">
              <Input
                id={`key-${id}`}
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => onChange({ apiKey: e.target.value })}
                placeholder={requiresKey ? "Anahtarınızı girin" : "Opsiyonel"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showKey ? "Gizle" : "Göster"}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-fuchsia-500 hover:underline"
              >
                Anahtar al <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}

        {models && models.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Modeller
            </p>
            <div className="flex flex-wrap gap-1">
              {models.map((m) => (
                <Badge key={m} variant="secondary">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {voices && voices.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Sesler ({voices.length})
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
              {voices.map((v) => (
                <li key={v} className="truncate">
                  · {v}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
