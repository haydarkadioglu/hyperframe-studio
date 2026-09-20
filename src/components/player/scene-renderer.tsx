"use client";

import * as React from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";
import type { Scene, VideoStyle } from "@/lib/types";
import { STYLE_MAP } from "@/lib/providers";
import { cn } from "@/lib/utils";

interface SceneRendererProps {
  scene: Scene;
  style: VideoStyle;
  isActive?: boolean;
  /** when true, animations are reduced to "first frame" (used by thumbnails) */
  staticFrame?: boolean;
}

const accentColor = (scene?: Scene) => scene?.accentColor || "#e879f9";

// Map scene animation -> framer-motion variants for content entrance
function variantsFor(animation: Scene["animation"]) {
  switch (animation) {
    case "slide-up":
      return {
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      };
    case "slide-left":
      return {
        initial: { opacity: 0, x: 60 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -30 },
      };
    case "zoom":
      return {
        initial: { opacity: 0, scale: 0.7 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.1 },
      };
    case "bounce":
      return {
        initial: { opacity: 0, y: 60, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -30 },
      };
    case "flip":
      return {
        initial: { opacity: 0, rotateY: 90 },
        animate: { opacity: 1, rotateY: 0 },
        exit: { opacity: 0, rotateY: -90 },
      };
    case "ken-burns":
      return {
        initial: { opacity: 0, scale: 1.15 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.05 },
      };
    case "fade":
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
}

const FloatingShapes: React.FC<{ style: VideoStyle }> = ({ style }) => {
  if (style !== "modern" && style !== "playful" && style !== "vibrant")
    return null;

  const colors =
    style === "playful"
      ? ["#fbbf24", "#fb923c", "#f43f5e"]
      : style === "vibrant"
      ? ["#34d399", "#14b8a6", "#06b6d4"]
      : ["#a78bfa", "#e879f9", "#f472b6"];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => {
        const size = 40 + ((i * 17) % 80);
        return (
          <div
            key={i}
            className={cn(
              "absolute rounded-full blur-xl opacity-30",
              i % 2 === 0 ? "float-slow" : "float-medium"
            )}
            style={{
              width: size,
              height: size,
              left: `${(i * 23) % 100}%`,
              top: `${(i * 37) % 100}%`,
              background: colors[i % colors.length],
            }}
          />
        );
      })}
    </div>
  );
};

export const SceneRenderer: React.FC<SceneRendererProps> = ({
  scene,
  style,
  isActive = true,
  staticFrame = false,
}) => {
  const styleInfo = STYLE_MAP[style] ?? STYLE_MAP.modern;
  const gradient = styleInfo.gradient;
  const accent = accentColor(scene);

  const variants = staticFrame
    ? { initial: {}, animate: {}, exit: {} }
    : variantsFor(scene.animation);

  // background image?
  const hasImage = Boolean(scene.imageUrl);

  return (
    <div className="scene-stage absolute inset-0">
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          gradient,
          !staticFrame && "animated-gradient"
        )}
      />

      {/* Optional image layer with ken-burns */}
      {hasImage && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={scene.imageUrl}
            alt=""
            className={cn(
              "h-full w-full object-cover",
              !staticFrame &&
                (scene.animation === "ken-burns" || scene.type === "image"
                  ? "ken-burns"
                  : "transition-transform duration-700")
            )}
          />
          {/* legibility scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/55" />
        </div>
      )}

      {/* Floating decorative shapes for selected styles */}
      <FloatingShapes style={style} />

      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.55)]" />

      {/* Content */}
      <div className="absolute inset-0 grid place-items-center p-8 sm:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id + (isActive ? "-on" : "-off")}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-4xl"
          >
            <SceneContent scene={scene} accent={accent} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const SceneContent: React.FC<{ scene: Scene; accent: string }> = ({
  scene,
  accent,
}) => {
  switch (scene.type) {
    case "title":
      return (
        <div className="text-center">
          {scene.title && (
            <div
              className="inline-block text-xs uppercase tracking-[0.3em] mb-4 font-medium"
              style={{ color: accent }}
            >
              {scene.title}
            </div>
          )}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl leading-[1.05]">
            {scene.text}
          </h1>
          <div
            className="mx-auto mt-6 h-1.5 w-24 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accent}, transparent)`,
            }}
          />
        </div>
      );

    case "text":
      return (
        <div className="max-w-3xl">
          {scene.title && (
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {scene.title}
            </h2>
          )}
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed font-medium">
            {scene.text}
          </p>
        </div>
      );

    case "image":
      return (
        <div className="max-w-3xl text-center">
          {scene.title && (
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {scene.title}
            </h2>
          )}
          <p className="text-base sm:text-lg text-white/90 leading-relaxed">
            {scene.text}
          </p>
        </div>
      );

    case "quote":
      return (
        <div className="max-w-3xl text-center relative">
          <Quote
            className="mx-auto mb-4 size-10 opacity-30"
            style={{ color: accent }}
          />
          <p className="text-2xl sm:text-3xl md:text-4xl italic font-medium text-white leading-snug">
            “{scene.text}”
          </p>
          {scene.title && (
            <p className="mt-4 text-sm uppercase tracking-[0.25em] text-white/70">
              — {scene.title}
            </p>
          )}
        </div>
      );

    case "stats": {
      const num = scene.text.match(/-?\d[\d.,]*/)?.[0] ?? scene.text;
      const label = scene.text.replace(num, "").trim() || scene.title || "";
      return <StatBlock number={num} label={label} accent={accent} sceneId={scene.id} />;
    }

    case "cta":
      return (
        <div className="text-center">
          {scene.title && (
            <p className="text-base sm:text-lg text-white/80 mb-3 uppercase tracking-[0.25em]">
              {scene.title}
            </p>
          )}
          <div
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-5 text-2xl sm:text-3xl font-bold text-white shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${accent}, #ffffff22)`,
              boxShadow: `0 20px 50px -20px ${accent}`,
            }}
          >
            <Sparkles className="size-6" />
            {scene.text}
          </div>
        </div>
      );

    default:
      return (
        <p className="text-3xl sm:text-5xl font-bold text-white text-center">
          {scene.text}
        </p>
      );
  }
};

const StatBlock: React.FC<{
  number: string;
  label: string;
  accent: string;
  sceneId: string;
}> = ({ number, label, accent, sceneId }) => {
  const isNumeric = /^\d+(\.\d+)?$/.test(number);
  const target = isNumeric ? parseFloat(number) : null;
  const mv = useMotionValue(0);
  const [display, setDisplay] = React.useState(number);

  React.useEffect(() => {
    if (target === null) {
      setDisplay(number);
      return;
    }
    const controls = animate(mv, target, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => {
        if (Number.isInteger(target)) {
          setDisplay(String(Math.round(v)));
        } else {
          setDisplay(v.toFixed(1));
        }
      },
    });
    return () => controls.stop();
  }, [sceneId, target, number, mv]);

  return (
    <div className="text-center">
      <div
        className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white drop-shadow-2xl"
        style={{ textShadow: `0 0 60px ${accent}80` }}
      >
        {display}
      </div>
      {label && (
        <p className="mt-4 text-base sm:text-lg uppercase tracking-[0.25em] text-white/80 font-medium">
          {label}
        </p>
      )}
    </div>
  );
};
