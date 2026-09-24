import { db } from "./db";
import type { VideoProject, Scene, ProjectStatus, GenerationProgress } from "./types";
import { scenesToJson, jsonToScenes } from "./subtitles";

export interface ProjectRow {
  id: string;
  title: string;
  topic: string;
  mode: string;
  language: string;
  llmProvider: string;
  ttsProvider: string;
  imageProvider: string;
  voice: string;
  tone: string;
  style: string;
  aspectRatio: string;
  status: string;
  scenes: Scene[];
  audioUrl: string | null;
  subtitles: string | null;
  thumbnailUrl: string | null;
  durationSec: number;
  sceneCount: number;
  errorMessage: string | null;
  progress?: GenerationProgress | null;
  createdAt: string;
  updatedAt: string;
}

export function rowToProject(row: any): ProjectRow {
  return {
    id: row.id,
    title: row.title,
    topic: row.topic,
    mode: row.mode,
    language: row.language,
    llmProvider: row.llmProvider,
    ttsProvider: row.ttsProvider,
    imageProvider: row.imageProvider,
    voice: row.voice,
    tone: row.tone,
    style: row.style,
    aspectRatio: row.aspectRatio,
    status: row.status,
    scenes: jsonToScenes(row.scenes),
    audioUrl: row.audioUrl,
    subtitles: row.subtitles,
    thumbnailUrl: row.thumbnailUrl,
    durationSec: row.durationSec,
    sceneCount: row.sceneCount,
    errorMessage: row.errorMessage,
    progress: row.progress ? safeParseProgress(row.progress) : null,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  };
}

function safeParseProgress(s: string): GenerationProgress | null {
  try {
    const p = JSON.parse(s);
    if (p && typeof p === "object" && typeof p.step === "string") {
      return p as GenerationProgress;
    }
  } catch {}
  return null;
}

export function rowToVideoProject(row: any): VideoProject {
  const r = rowToProject(row);
  return {
    ...r,
    mode: r.mode as VideoProject["mode"],
    status: r.status as ProjectStatus,
    tone: r.tone as VideoProject["tone"],
    style: r.style as VideoProject["style"],
    aspectRatio: r.aspectRatio as VideoProject["aspectRatio"],
  } as VideoProject;
}

export async function getProject(id: string) {
  const row = await db.videoProject.findUnique({ where: { id } });
  if (!row) return null;
  return rowToVideoProject(row);
}

export async function listProjects(opts?: { limit?: number; status?: string }) {
  const rows = await db.videoProject.findMany({
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    where: opts?.status ? { status: opts.status } : undefined,
  });
  return rows.map(rowToVideoProject);
}

export async function createProjectRow(data: {
  title: string;
  topic: string;
  mode: string;
  language: string;
  llmProvider: string;
  ttsProvider: string;
  imageProvider: string;
  voice: string;
  tone: string;
  style: string;
  aspectRatio: string;
  scenes?: Scene[];
  status?: string;
}) {
  const scenes = data.scenes ?? [];
  const row = await db.videoProject.create({
    data: {
      title: data.title,
      topic: data.topic,
      mode: data.mode,
      language: data.language,
      llmProvider: data.llmProvider,
      ttsProvider: data.ttsProvider,
      imageProvider: data.imageProvider,
      voice: data.voice,
      tone: data.tone,
      style: data.style,
      aspectRatio: data.aspectRatio,
      status: data.status ?? "draft",
      scenes: scenesToJson(scenes),
      sceneCount: scenes.length,
      durationSec: Math.round(
        scenes.reduce((a, s) => a + s.durationMs, 0) / 1000
      ),
    },
  });
  return rowToVideoProject(row);
}

export async function updateProject(
  id: string,
  data: Partial<{
    title: string;
    scenes: Scene[];
    status: string;
    audioUrl: string | null;
    subtitles: string | null;
    thumbnailUrl: string | null;
    durationSec: number;
    sceneCount: number;
    errorMessage: string | null;
    tone: string;
    style: string;
    progress: GenerationProgress | null;
  }>
) {
  const row = await db.videoProject.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.scenes !== undefined
        ? { scenes: scenesToJson(data.scenes), sceneCount: data.scenes.length, durationSec: Math.round(data.scenes.reduce((a, s) => a + s.durationMs, 0) / 1000) }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.audioUrl !== undefined ? { audioUrl: data.audioUrl } : {}),
      ...(data.subtitles !== undefined ? { subtitles: data.subtitles } : {}),
      ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl } : {}),
      ...(data.durationSec !== undefined ? { durationSec: data.durationSec } : {}),
      ...(data.sceneCount !== undefined ? { sceneCount: data.sceneCount } : {}),
      ...(data.errorMessage !== undefined ? { errorMessage: data.errorMessage } : {}),
      ...(data.tone !== undefined ? { tone: data.tone } : {}),
      ...(data.style !== undefined ? { style: data.style } : {}),
      ...(data.progress !== undefined ? { progress: data.progress ? JSON.stringify(data.progress) : null } : {}),
    },
  });
  return rowToVideoProject(row);
}

export async function deleteProject(id: string) {
  await db.videoProject.delete({ where: { id } });
}

export async function addAsset(data: {
  projectId: string;
  type: string;
  url: string;
  name?: string;
  mimeType?: string;
  role?: string;
  sceneIdx?: number;
}) {
  return db.asset.create({ data });
}
