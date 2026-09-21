// Typed client wrappers for all Hyperframe Studio API endpoints.
// All URLs are relative. Each function returns parsed JSON or throws with message.

import type {
  VideoProject,
  CreateProjectBody,
  GenerateScriptBody,
  GenerateScriptResponse,
  GenerateTtsBody,
  GenerateTtsResponse,
  GenerateImageBody,
  GenerateImageResponse,
  AnalyzeProductBody,
  AnalyzeProductResponse,
  ProviderSettings,
  Scene,
} from "./types";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = "ApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (e: any) {
    throw new ApiError(e?.message || "Ağ hatası", 0, e);
  }

  const text = await res.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  if (!res.ok) {
    const msg =
      (json && (json.error || json.message)) ||
      res.statusText ||
      `İstek başarısız (${res.status})`;
    throw new ApiError(msg, res.status, json);
  }

  return json as T;
}

// ---- Projects ----

export async function listProjects(): Promise<VideoProject[]> {
  const data = await request<{ projects: VideoProject[] }>("/api/projects");
  return data.projects ?? [];
}

export async function createProject(
  body: CreateProjectBody
): Promise<VideoProject> {
  const data = await request<{ project: VideoProject }>("/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.project;
}

export async function getProject(id: string): Promise<VideoProject> {
  const data = await request<{ project: VideoProject }>(
    `/api/projects/${encodeURIComponent(id)}`
  );
  return data.project;
}

export async function deleteProject(id: string): Promise<void> {
  await request<{ ok: boolean }>(
    `/api/projects/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export async function renderProject(
  id: string,
  body: {
    productImages?: string[];
    customScript?: string;
    targetScenes?: number;
  }
): Promise<{ project: VideoProject; started: boolean; alreadyRunning?: boolean }> {
  return request(`/api/projects/${encodeURIComponent(id)}/render`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function duplicateProject(id: string): Promise<VideoProject> {
  const d = await request<{ project: VideoProject }>(
    `/api/projects/${encodeURIComponent(id)}/duplicate`,
    { method: "POST" }
  );
  return d.project;
}

export async function updateProject(
  id: string,
  patch: { title?: string; tone?: string; style?: string; scenes?: Scene[] }
): Promise<VideoProject> {
  const d = await request<{ project: VideoProject }>(
    `/api/projects/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(patch) }
  );
  return d.project;
}

// ---- Generation primitives ----

export async function generateScript(
  body: GenerateScriptBody
): Promise<GenerateScriptResponse> {
  return request<GenerateScriptResponse>("/api/generate/script", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function generateTts(
  body: GenerateTtsBody
): Promise<GenerateTtsResponse> {
  return request<GenerateTtsResponse>("/api/generate/tts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function generateImage(
  body: GenerateImageBody
): Promise<GenerateImageResponse> {
  return request<GenerateImageResponse>("/api/generate/image", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function analyzeProduct(
  body: AnalyzeProductBody
): Promise<AnalyzeProductResponse> {
  return request<AnalyzeProductResponse>("/api/analyze/product", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- Settings ----

export async function getSettings(): Promise<ProviderSettings> {
  const data = await request<{ settings: ProviderSettings }>("/api/settings");
  return data.settings ?? {};
}

export async function saveSettings(
  settings: ProviderSettings
): Promise<ProviderSettings> {
  const data = await request<{ settings: ProviderSettings }>("/api/settings", {
    method: "POST",
    body: JSON.stringify({ settings }),
  });
  return data.settings ?? {};
}

// ---- Upload ----

export async function uploadImage(
  base64: string,
  name?: string
): Promise<{ url: string; name?: string }> {
  return request<{ url: string; name?: string }>("/api/upload", {
    method: "POST",
    body: JSON.stringify({ image: base64, name }),
  });
}

// ---- Stats ----

export interface StatsData {
  totals: {
    total: number;
    ready: number;
    generating: number;
    draft: number;
    error: number;
    totalDurationSec: number;
    totalScenes: number;
  };
  distributions: {
    byMode: { id: string; label: string; emoji: string; count: number }[];
    byLanguage: { code: string; name: string; flag: string; count: number }[];
    byTone: { id: string; count: number }[];
    byStyle: { id: string; count: number }[];
    byStatus: { id: string; count: number }[];
    byAspectRatio: { id: string; count: number }[];
    byLlmProvider: { id: string; count: number }[];
    byTtsProvider: { id: string; count: number }[];
  };
  dailyActivity: { date: string; label: string; count: number }[];
}

export async function getStats(): Promise<StatsData> {
  return request<StatsData>("/api/stats");
}

// ---- Prompt suggestions ----

export interface SuggestPromptsResponse {
  curated: string[];
  ai: string[];
  seed: string;
}

export async function suggestPrompts(body: {
  topic?: string;
  mode?: string;
  language?: string;
}): Promise<SuggestPromptsResponse> {
  return request<SuggestPromptsResponse>("/api/suggest/prompts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- File download helpers ----

export function downloadTextFile(
  filename: string,
  contents: string,
  mime = "text/plain"
): void {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadRemoteFile(url: string, filename?: string): void {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---- Misc helpers ----

export function formatDuration(sec: number): string {
  if (!sec || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatMs(ms: number): string {
  return formatDuration(Math.round((ms || 0) / 1000));
}

export function timeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "az önce";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} dk önce`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} sa önce`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day} gün önce`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} ay önce`;
    return `${Math.floor(month / 12)} yıl önce`;
  } catch {
    return "—";
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
