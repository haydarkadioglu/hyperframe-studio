"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Captions,
  CaptionsOff,
  Maximize2,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Gauge,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { VideoProject } from "@/lib/types";
import { STYLE_MAP, LANGUAGE_MAP } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { SceneRenderer } from "./scene-renderer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ScenePlayerProps {
  project: VideoProject;
  className?: string;
}

const ASPECT_TO_CLASS: Record<string, string> = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
};

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const ScenePlayer: React.FC<ScenePlayerProps> = ({ project, className }) => {
  const scenes = project.scenes ?? [];
  const totalMs = scenes.reduce((a, s) => a + (s.durationMs || 0), 0) || project.durationSec * 1000;

  const [currentSceneIndex, setCurrentSceneIndex] = React.useState(0);
  const [elapsedInScene, setElapsedInScene] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [showSubtitles, setShowSubtitles] = React.useState(true);
  const [ready, setReady] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [loop, setLoop] = React.useState(false);

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const lastTickRef = React.useRef<number | null>(null);

  const currentScene = scenes[currentSceneIndex];

  // Compute global elapsed across scenes
  const sceneStartsMs = React.useMemo(() => {
    const starts: number[] = [];
    let acc = 0;
    for (const s of scenes) {
      starts.push(acc);
      acc += s.durationMs || 0;
    }
    return starts;
  }, [scenes]);

  const totalElapsedMs =
    (sceneStartsMs[currentSceneIndex] ?? 0) + elapsedInScene;

  // Animation loop for scene timing
  React.useEffect(() => {
    if (!isPlaying || !currentScene) {
      lastTickRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = (t: number) => {
      if (lastTickRef.current == null) lastTickRef.current = t;
      const dt = (t - lastTickRef.current) * playbackRate;
      lastTickRef.current = t;
      setElapsedInScene((prev) => {
        const next = prev + dt;
        const dur = currentScene.durationMs || 1000;
        if (next >= dur) {
          // advance scene
          const nextIndex = currentSceneIndex + 1;
          if (nextIndex >= scenes.length) {
            if (loop) {
              setCurrentSceneIndex(0);
              return 0;
            }
            setIsPlaying(false);
            return dur;
          }
          setCurrentSceneIndex(nextIndex);
          return 0;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, [isPlaying, currentScene, currentSceneIndex, scenes.length, playbackRate, loop]);

  // Audio sync
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && ready) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, ready]);

  // Audio playback rate sync
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // Audio ended → loop or stop
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (loop) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        setCurrentSceneIndex(0);
        setElapsedInScene(0);
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [loop]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
    audio.volume = volume;
  }, [isMuted, volume]);

  // Reset to start when switching projects
  React.useEffect(() => {
    setCurrentSceneIndex(0);
    setElapsedInScene(0);
    setIsPlaying(false);
    setReady(false);
  }, [project.id]);

  const handleTogglePlay = () => {
    if (!isPlaying && currentSceneIndex >= scenes.length - 1 && elapsedInScene >= (currentScene?.durationMs ?? 0)) {
      // restart
      setCurrentSceneIndex(0);
      setElapsedInScene(0);
    }
    setIsPlaying((p) => !p);
  };

  const handleSeek = (newTotalMs: number) => {
    let remaining = Math.max(0, Math.min(newTotalMs, totalMs));
    let idx = 0;
    for (let i = 0; i < scenes.length; i++) {
      const dur = scenes[i].durationMs || 0;
      if (remaining <= dur) {
        idx = i;
        break;
      }
      remaining -= dur;
      idx = i;
    }
    setCurrentSceneIndex(idx);
    setElapsedInScene(remaining);
    if (audioRef.current) {
      audioRef.current.currentTime = (sceneStartsMs[idx] + remaining) / 1000;
    }
  };

  const seekByDelta = (deltaMs: number) => {
    handleSeek(totalElapsedMs + deltaMs);
  };

  const handleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (!isFullscreen) {
        await el.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Keyboard shortcuts (only active when player is in view / focused)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas/contenteditable
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || target.tagName === "SELECT")) {
        return;
      }
      // Only handle when the stage is in viewport
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          handleTogglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekByDelta(-3000);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekByDelta(3000);
          break;
        case "j":
          e.preventDefault();
          seekByDelta(-10000);
          break;
        case "l":
          e.preventDefault();
          seekByDelta(10000);
          break;
        case "m":
          e.preventDefault();
          setIsMuted((m) => !m);
          break;
        case "f":
          e.preventDefault();
          handleFullscreen();
          break;
        case "c":
          e.preventDefault();
          setShowSubtitles((s) => !s);
          break;
        case "r":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setLoop((l) => !l);
          }
          break;
        case ",":
          e.preventDefault();
          setPlaybackRate((p) => Math.max(0.5, +(p - 0.25).toFixed(2)));
          break;
        case ".":
          e.preventDefault();
          setPlaybackRate((p) => Math.min(2, +(p + 0.25).toFixed(2)));
          break;
        case "Home":
          e.preventDefault();
          handleSeek(0);
          break;
        case "End":
          e.preventDefault();
          handleSeek(totalMs);
          break;
        default:
          // number keys 0-9 → seek to N/10 of total
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            handleSeek((Number(e.key) / 10) * totalMs);
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalMs, playbackRate, loop]);

  if (!scenes.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        Bu projede sahne bulunmuyor.
      </div>
    );
  }

  const styleInfo = STYLE_MAP[project.style] ?? STYLE_MAP.modern;
  const langInfo = LANGUAGE_MAP[project.language];

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={stageRef}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/40 bg-black",
          ASPECT_TO_CLASS[project.aspectRatio] ?? "aspect-video"
        )}
      >
        <SceneRenderer
          scene={currentScene}
          style={project.style}
          isActive={isPlaying}
        />

        {/* Subtitle overlay */}
        {showSubtitles && currentScene?.subtitle && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScene.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="max-w-[85%] rounded-lg bg-black/75 px-4 py-2 text-center text-sm sm:text-base text-white backdrop-blur-sm shadow-lg"
              >
                {currentScene.subtitle}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Center play button when paused */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleTogglePlay}
              className="absolute inset-0 grid place-items-center"
              aria-label="Oynat"
            >
              <div className="size-20 rounded-full bg-white/10 backdrop-blur-md border border-white/30 grid place-items-center shadow-2xl hover:scale-105 transition-transform">
                <Play className="size-8 text-white fill-white translate-x-0.5" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Top gradient + meta */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Scene index pill (top-left) */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
            Sahne {currentSceneIndex + 1} / {scenes.length}
          </span>
          {langInfo && (
            <span className="rounded-full bg-black/60 backdrop-blur-sm px-2 py-1 text-xs text-white flex items-center gap-1">
              <span>{langInfo.flag}</span>
              <span className="hidden sm:inline">{langInfo.nativeName}</span>
            </span>
          )}
          {loop && (
            <span className="rounded-full bg-fuchsia-500/30 backdrop-blur-sm px-2 py-1 text-xs text-fuchsia-200 flex items-center gap-1 border border-fuchsia-500/40">
              <Repeat1 className="size-3" /> Döngü
            </span>
          )}
          {playbackRate !== 1 && (
            <span className="rounded-full bg-violet-500/30 backdrop-blur-sm px-2 py-1 text-xs text-violet-200 border border-violet-500/40">
              {playbackRate}x
            </span>
          )}
        </div>

        {/* Keyboard shortcuts hint (top-right, fades after a few seconds) */}
        <KeyboardHint />

        {/* Controls bar */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-3 pt-8">
          {/* Scrubber */}
          <div className="group relative mb-2 h-2 w-full cursor-pointer">
            <input
              type="range"
              min={0}
              max={totalMs || 1}
              value={totalElapsedMs}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              aria-label="Konum"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 my-auto h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 transition-[width]"
                style={{ width: `${(totalElapsedMs / (totalMs || 1)) * 100}%` }}
              />
            </div>
            <div
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-white shadow-md transition-opacity opacity-0 group-hover:opacity-100"
              style={{
                left: `calc(${(totalElapsedMs / (totalMs || 1)) * 100}% - 7px)`,
              }}
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-white">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full text-white hover:bg-white/15 hover:text-white"
              onClick={() => seekByDelta(-3000)}
              aria-label="3 saniye geri"
            >
              <SkipBack className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full text-white bg-white/10 hover:bg-white/20 hover:text-white"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? "Duraklat" : "Oynat"}
            >
              {isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5 fill-white" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full text-white hover:bg-white/15 hover:text-white"
              onClick={() => seekByDelta(3000)}
              aria-label="3 saniye ileri"
            >
              <SkipForward className="size-4" />
            </Button>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-2 group/vol">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-white hover:bg-white/15 hover:text-white"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  setIsMuted(v === 0);
                }}
                className="w-0 group-hover/vol:w-20 transition-all duration-300 accent-fuchsia-500"
                aria-label="Ses seviyesi"
              />
            </div>

            <div className="ml-1 text-xs sm:text-sm tabular-nums text-white/90">
              {formatTime(totalElapsedMs)}{" "}
              <span className="text-white/50">/ {formatTime(totalMs)}</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              {/* Playback speed */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 rounded-full px-2.5 text-xs font-medium text-white hover:bg-white/15 hover:text-white gap-1",
                      playbackRate !== 1 && "bg-white/20"
                    )}
                    aria-label="Oynatma hızı"
                    title="Oynatma hızı"
                  >
                    <Gauge className="size-4" />
                    {playbackRate !== 1 ? `${playbackRate}x` : "Hız"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-28">
                  <DropdownMenuLabel>Oynatma Hızı</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SPEEDS.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => setPlaybackRate(s)}
                      className={cn(
                        "flex items-center justify-between gap-2 cursor-pointer",
                        s === playbackRate && "bg-accent"
                      )}
                    >
                      <span>{s === 1 ? "Normal (1x)" : `${s}x`}</span>
                      {s === playbackRate && <span className="text-fuchsia-500">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Loop toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-9 rounded-full text-white hover:bg-white/15 hover:text-white",
                  loop && "bg-white/20 text-fuchsia-300"
                )}
                onClick={() => setLoop((l) => !l)}
                aria-label={loop ? "Tekrarı kapat" : "Tekrarı aç"}
                title="Tekrar (R)"
              >
                {loop ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-9 rounded-full text-white hover:bg-white/15 hover:text-white",
                  showSubtitles ? "bg-white/15" : ""
                )}
                onClick={() => setShowSubtitles((s) => !s)}
                aria-label="Altyazılar"
                title="Altyazılar (C)"
              >
                {showSubtitles ? (
                  <Captions className="size-4" />
                ) : (
                  <CaptionsOff className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-white hover:bg-white/15 hover:text-white"
                onClick={handleFullscreen}
                aria-label="Tam ekran"
                title="Tam ekran (F)"
              >
                <Maximize2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Audio */}
        {project.audioUrl && (
          <audio
            ref={audioRef}
            src={project.audioUrl}
            onCanPlay={() => setReady(true)}
            onEnded={() => setIsPlaying(false)}
            preload="auto"
            crossOrigin="anonymous"
          />
        )}

        {/* No audio note */}
        {!project.audioUrl && (
          <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur-sm">
            Görsel önizleme · seslendirme yok
          </div>
        )}
      </div>

      {/* Scene strip */}
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {scenes.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentSceneIndex(i);
              setElapsedInScene(0);
              if (audioRef.current) {
                audioRef.current.currentTime = (sceneStartsMs[i] ?? 0) / 1000;
              }
            }}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-md border transition-all",
              i === currentSceneIndex
                ? "border-fuchsia-500 ring-2 ring-fuchsia-500/40"
                : "border-border hover:border-muted-foreground"
            )}
            style={{ width: 96, height: 54 }}
            aria-label={`${i + 1}. sahneye git`}
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br",
                styleInfo.gradient
              )}
            />
            <div className="absolute inset-0 grid place-items-center text-white text-xs font-semibold">
              {i + 1}
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[9px] text-white text-left truncate">
              {s.type}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Keyboard shortcuts hint that fades in/out on the player
function KeyboardHint() {
  const [visible, setVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (dismissed) return;
    const t1 = setTimeout(() => setVisible(true), 800);
    const t2 = setTimeout(() => setVisible(false), 6500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [dismissed]);

  if (dismissed) return null;

  const shortcuts: [string, string][] = [
    ["Space", "Oynat / Duraklat"],
    ["← / →", "3 sn geri / ileri"],
    ["J / L", "10 sn geri / ileri"],
    ["M", "Sesi kapat"],
    ["F", "Tam ekran"],
    ["C", "Altyazı"],
    ["R", "Tekrar"],
    [", / .", "Hız ↓ / ↑"],
    ["0-9", "%10'a atla"],
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, x: 8 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="absolute top-3 right-3 max-w-[240px] rounded-xl bg-black/80 backdrop-blur-md border border-white/15 p-3 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
              Klavye Kısayolları
            </span>
            <button
              onClick={() => setDismissed(true)}
              className="text-white/60 hover:text-white text-xs"
              aria-label="Kapat"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {shortcuts.map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <kbd className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-mono text-white border border-white/10">
                  {key}
                </kbd>
                <span className="text-[10px] text-white/70 truncate">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
