"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Share2,
  Link2,
  Mail,
  MessageCircle,
  Send,
  Copy,
  Download,
  FileText,
  AudioLines,
  Image as ImageIcon,
  QrCode,
  Sparkles,
} from "lucide-react";
import type { VideoProject } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  downloadTextFile,
  downloadRemoteFile,
} from "@/lib/api-client";

interface ShareDialogProps {
  project: VideoProject;
  open: boolean;
  onOpenChange: (v: boolean) => void;
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

// Build a share URL pointing back into the single-route app.
// `?p=PROJECT_ID` is a soft route hint — the app reads it client-side if present.
function buildShareUrl(projectId: string): string {
  if (typeof window === "undefined") {
    return `https://localhost:3000/?p=${encodeURIComponent(projectId)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?p=${encodeURIComponent(projectId)}`;
}

function buildEmbedCode(projectId: string): string {
  const url = buildShareUrl(projectId);
  return `<iframe src="${url}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
}

interface SocialButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string; // emoji/letter badge fallback when no lucide icon
  url: (text: string, shareUrl: string) => string;
  accent: string;
}

const SOCIALS: SocialButton[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    accent: "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
    url: (text) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    id: "twitter",
    label: "X / Twitter",
    badge: "𝕏",
    accent: "bg-zinc-500/15 text-zinc-200 hover:bg-zinc-500/25",
    url: (text, shareUrl) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    badge: "f",
    accent: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25",
    url: (text, shareUrl) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: Send,
    accent: "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25",
    url: (text, shareUrl) =>
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    badge: "in",
    accent: "bg-violet-500/15 text-violet-300 hover:bg-violet-500/25",
    url: (_text, shareUrl) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  },
  {
    id: "reddit",
    label: "Reddit",
    badge: "R",
    accent: "bg-orange-500/15 text-orange-300 hover:bg-orange-500/25",
    url: (text, shareUrl) =>
      `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: "email",
    label: "E-posta",
    icon: Mail,
    accent: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25",
    url: (text, shareUrl) =>
      `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(shareUrl)}`,
  },
  {
    id: "copy",
    label: "Linki Kopyala",
    icon: Link2,
    accent: "bg-fuchsia-500/15 text-fuchsia-300 hover:bg-fuchsia-500/25",
    url: () => "",
  },
];

export function ShareDialog({ project, open, onOpenChange }: ShareDialogProps) {
  const shareUrl = React.useMemo(() => buildShareUrl(project.id), [project.id]);
  const shareText = React.useMemo(
    () => `${project.title} — Hyperframe Studio ile üretildi`,
    [project.title]
  );
  const embedCode = React.useMemo(
    () => buildEmbedCode(project.id),
    [project.id]
  );
  const qrSrc = React.useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`,
    [shareUrl]
  );

  const copy = async (text: string, msg = "Kopyalandı") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error("Kopyalama başarısız oldu");
    }
  };

  const openSocial = (s: SocialButton) => {
    if (s.id === "copy") {
      void copy(shareUrl, "Paylaşım linki kopyalandı");
      return;
    }
    const url = s.url(shareText, shareUrl);
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");
    }
  };

  const downloadQr = async () => {
    try {
      const res = await fetch(qrSrc);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug(project.title)}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("QR kodu indirildi");
    } catch {
      // Fallback: open in new tab
      window.open(qrSrc, "_blank", "noopener,noreferrer");
    }
  };

  const downloadThumbnail = () => {
    if (!project.thumbnailUrl) {
      toast.error("Önizleme görseli bulunamadı");
      return;
    }
    downloadRemoteFile(project.thumbnailUrl, `${slug(project.title)}-kapak.png`);
    toast.success("Önizleme görseli indirildi");
  };

  const downloadSrt = () => {
    if (!project.subtitles) {
      toast.error("Altyazı bulunamadı");
      return;
    }
    downloadTextFile(`${slug(project.title)}.srt`, project.subtitles, "text/plain");
    toast.success("SRT indirildi");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {/* Gradient header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative p-5 pb-4 border-b border-border/60 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/15 to-pink-500/15 overflow-hidden"
        >
          <div className="orb orb-sm bg-violet-500/40 -top-8 -right-8" />
          <div className="orb orb-sm bg-fuchsia-500/30 -bottom-12 -left-12" />
          <DialogHeader className="relative space-y-1">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="grid size-7 place-items-center rounded-lg btn-gradient shadow-md shadow-fuchsia-500/30">
                <Share2 className="size-4" />
              </span>
              Videoyu Paylaş
            </DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-medium text-foreground">{project.title}</span>{" "}
              için paylaşım linki, gömme kodu, QR ve sosyal medya kısayolları.
            </DialogDescription>
          </DialogHeader>
        </motion.div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Shareable link */}
          <section className="space-y-2">
            <Label>Paylaşım Linki</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="font-mono text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(shareUrl, "Paylaşım linki kopyalandı")}
                className="shrink-0 border-fuchsia-500/40 text-fuchsia-500 hover:bg-fuchsia-500/10 min-h-[40px]"
              >
                <Copy className="size-3.5" />
                Kopyala
              </Button>
            </div>
          </section>

          {/* Embed code */}
          <section className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CodeIcon className="size-3.5 text-muted-foreground" />
              Gömme Kodu (Embed)
            </Label>
            <Textarea
              readOnly
              value={embedCode}
              onFocus={(e) => e.currentTarget.select()}
              className="font-mono text-xs min-h-24 resize-none bg-muted/40"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(embedCode, "Gömme kodu kopyalandı")}
              className="w-full border-violet-500/40 text-violet-500 hover:bg-violet-500/10 min-h-[40px]"
            >
              <Copy className="size-3.5" />
              Kodu Kopyala
            </Button>
          </section>

          {/* QR code */}
          <section className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <QrCode className="size-3.5 text-muted-foreground" />
              QR Kodu
            </Label>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="relative size-[200px] rounded-xl bg-white p-2 shadow-md grid place-items-center">
                <img
                  src={qrSrc}
                  alt={`${project.title} için QR kodu`}
                  className="size-full object-contain"
                  width={200}
                  height={200}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadQr}
                className="border-fuchsia-500/40 text-fuchsia-500 hover:bg-fuchsia-500/10 min-h-[36px]"
              >
                <Download className="size-3.5" />
                QR İndir
              </Button>
            </div>
          </section>

          {/* Social share grid */}
          <section className="space-y-2">
            <Label>Sosyal Medyada Paylaş</Label>
            <div className="grid grid-cols-4 gap-2">
              {SOCIALS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => openSocial(s)}
                    className={cn(
                      "group flex flex-col items-center gap-1.5 rounded-xl border border-border p-2.5 transition-colors",
                      s.accent
                    )}
                    aria-label={s.label}
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-background/60 backdrop-blur-sm">
                      {Icon ? (
                        <Icon className="size-4" />
                      ) : (
                        <span className="text-sm font-bold">{s.badge}</span>
                      )}
                    </span>
                    <span className="text-[10px] font-medium leading-tight text-center">
                      {s.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Direct download shortcuts */}
          <section className="space-y-2">
            <Label>Hızlı İndirme</Label>
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
              {/* Thumbnail row */}
              <div className="flex items-center gap-3">
                <div className="relative size-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full grid place-items-center bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      <ImageIcon className="size-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">Kapak görseli</p>
                  <p className="text-[10px] text-muted-foreground">
                    {project.thumbnailUrl ? "PNG · doğrudan indirme" : "Mevcut değil"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={downloadThumbnail}
                  disabled={!project.thumbnailUrl}
                  className="shrink-0 text-fuchsia-500 hover:bg-fuchsia-500/10 h-8 px-2"
                >
                  <Download className="size-3.5" />
                  İndir
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadSrt}
                  disabled={!project.subtitles}
                  className="h-9 border-border text-muted-foreground hover:text-foreground"
                >
                  <FileText className="size-3.5" />
                  SRT İndir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadAudio}
                  disabled={!project.audioUrl}
                  className="h-9 border-border text-muted-foreground hover:text-foreground"
                >
                  <AudioLines className="size-3.5" />
                  Sesi İndir
                </Button>
              </div>
            </div>
          </section>

          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3 text-fuchsia-500" />
            Linki paylaşan kişi, videoyu animasyonlu oynatıcıda izleyebilir.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-semibold text-muted-foreground flex items-center gap-1.5",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width="14"
      height="14"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
