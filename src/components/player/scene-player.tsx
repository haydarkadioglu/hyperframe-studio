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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { VideoProject } from "@/lib/types";
import { STYLE_MAP, LANGUAGE_MAP } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { SceneRenderer } from "./scene-renderer";
import { Button } from "@/components/ui/button";

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
      const dt = t - lastTickRef.current;
      lastTickRef.current = t;
      setElapsedInScene((prev) => {
        const next = prev + dt;
        const dur = currentScene.durationMs || 1000;
        if (next >= dur) {
          // advance scene
          const nextIndex = currentSceneIndex + 1;
          if (nextIndex >= scenes.length) {
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
  }, [isPlaying, currentScene, currentSceneIndex, scenes.length]);

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
        </div>

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
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-9 rounded-full text-white hover:bg-white/15 hover:text-white",
                  showSubtitles ? "bg-white/15" : ""
                )}
                onClick={() => setShowSubtitles((s) => !s)}
                aria-label="Altyazılar"
                title="Altyazılar"
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
