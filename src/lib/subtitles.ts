import type { Scene } from "./types";

// Build SRT subtitle file from scenes (each scene's subtitle spans its duration)
export function buildSRT(scenes: Scene[]): string {
  let srt = "";
  let idx = 1;
  let cursorMs = 0;
  for (const scene of scenes) {
    const start = cursorMs;
    const end = cursorMs + scene.durationMs;
    srt += `${idx}\n`;
    srt += `${msToSrtTime(start)} --> ${msToSrtTime(end)}\n`;
    srt += `${scene.subtitle || scene.narration || scene.text}\n\n`;
    cursorMs = end;
    idx++;
  }
  return srt.trimEnd() + "\n";
}

export function buildVTT(scenes: Scene[]): string {
  let vtt = "WEBVTT\n\n";
  let idx = 1;
  let cursorMs = 0;
  for (const scene of scenes) {
    const start = cursorMs;
    const end = cursorMs + scene.durationMs;
    vtt += `${idx}\n`;
    vtt += `${msToVttTime(start)} --> ${msToVttTime(end)}\n`;
    vtt += `${scene.subtitle || scene.narration || scene.text}\n\n`;
    cursorMs = end;
    idx++;
  }
  return vtt;
}

export function msToSrtTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const milli = ms % 1000;
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(milli, 3)}`;
}

export function msToVttTime(ms: number): string {
  // VTT uses '.' instead of ','
  return msToSrtTime(ms).replace(",", ".");
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

// Serialize/deserialize project <-> DB row
export function scenesToJson(scenes: Scene[]): string {
  return JSON.stringify(scenes);
}

export function jsonToScenes(json: string | null | undefined): Scene[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr as Scene[];
  } catch {
    return [];
  }
}
