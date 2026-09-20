"use client";

import * as React from "react";
import type { Scene, VideoStyle } from "@/lib/types";
import { SceneRenderer } from "./scene-renderer";

interface SceneThumbnailProps {
  scene: Scene;
  style: VideoStyle;
  className?: string;
  aspect?: string; // "16/9" | "9/16" | "1/1" | "4/5"
}

const ASPECT_TO_CLASS: Record<string, string> = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
};

/**
 * Static non-animated mini render of a scene. Used in project cards & scene lists.
 * Reuses SceneRenderer with staticFrame so visual style matches the player.
 */
export const SceneThumbnail: React.FC<SceneThumbnailProps> = ({
  scene,
  style,
  className,
  aspect = "16:9",
}) => {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg ${ASPECT_TO_CLASS[aspect] ?? "aspect-video"} ${className ?? ""}`}
    >
      <SceneRenderer scene={scene} style={style} staticFrame isActive={false} />
    </div>
  );
};
