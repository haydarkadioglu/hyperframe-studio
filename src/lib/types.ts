// Shared types used by both frontend and backend (API contract)

export type VideoMode = "topic" | "product" | "script" | "youtube";

export type ProjectStatus = "draft" | "generating" | "ready" | "error";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5";

export type SceneType = "title" | "text" | "image" | "quote" | "stats" | "cta";

export type SceneAnimation =
  | "fade"
  | "slide-up"
  | "slide-left"
  | "zoom"
  | "bounce"
  | "flip"
  | "ken-burns";

export interface Scene {
  id: string;
  index: number;
  type: SceneType;
  title?: string;
  text: string; // on-screen text
  narration: string; // spoken text for TTS
  subtitle: string; // subtitle line (<= 100 chars preferred)
  imageUrl?: string; // generated or uploaded image url
  imagePrompt?: string;
  durationMs: number;
  animation: SceneAnimation;
  accentColor?: string;
}

export interface GenerationProgress {
  step: "idle" | "analyzing" | "script" | "images" | "audio" | "subtitles" | "done" | "error";
  sceneIdx?: number; // current scene being processed (images step)
  total: number; // total scenes
  done: number; // scenes completed
  message?: string;
}

export interface VideoProject {
  id: string;
  title: string;
  topic: string;
  mode: VideoMode;
  language: string;
  llmProvider: string;
  ttsProvider: string;
  imageProvider: string;
  voice: string;
  tone: Tone;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  status: ProjectStatus;
  scenes: Scene[];
  audioUrl?: string;
  subtitles?: string;
  thumbnailUrl?: string;
  durationSec: number;
  sceneCount: number;
  errorMessage?: string;
  progress?: GenerationProgress | null;
  createdAt: string;
  updatedAt: string;
}

export type Tone =
  | "professional"
  | "energetic"
  | "calm"
  | "dramatic"
  | "friendly"
  | "inspirational"
  | "news"
  | "documentary";

export type VideoStyle =
  | "modern"
  | "cinematic"
  | "playful"
  | "minimal"
  | "corporate"
  | "vibrant"
  | "elegant"
  | "bold";

export interface LLMProviderInfo {
  id: string;
  name: string;
  kind: "llm";
  available: boolean; // actually functional in this env
  description: string;
  models: string[];
  requiresKey: boolean;
  website?: string;
}

export interface TTSProviderInfo {
  id: string;
  name: string;
  kind: "tts";
  available: boolean;
  description: string;
  voices: VoiceInfo[];
  requiresKey: boolean;
  website?: string;
}

export interface ImageProviderInfo {
  id: string;
  name: string;
  kind: "image";
  available: boolean;
  description: string;
  models: string[];
  /** supported sizes the provider accepts (use the closest to requested) */
  sizes: string[];
  requiresKey: boolean;
  website?: string;
}

export interface VoiceInfo {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  language: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// --- API request/response contracts ---

export interface CreateProjectBody {
  title: string;
  topic: string;
  mode: VideoMode;
  language: string;
  llmProvider: string;
  ttsProvider: string;
  imageProvider: string;
  voice: string;
  tone: Tone;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  productImages?: string[]; // base64 data urls for product mode
  customScript?: string; // for script mode
  targetScenes?: number;
}

export interface GenerateScriptBody {
  topic: string;
  mode: VideoMode;
  language: string;
  tone: Tone;
  style: VideoStyle;
  targetScenes: number;
  productAnalysis?: string;
  customScript?: string;
}

export interface GenerateScriptResponse {
  title: string;
  scenes: Scene[];
  totalDurationMs: number;
}

export interface GenerateTtsBody {
  text: string;
  voice: string;
  speed?: number;
  provider: string;
  projectId?: string;
}

export interface GenerateTtsResponse {
  audioUrl: string;
  durationMs: number;
}

export interface GenerateImageBody {
  prompt: string;
  size?: string;
  projectId?: string;
  sceneIdx?: number;
  provider?: string;
}

export interface GenerateImageResponse {
  imageUrl: string;
  provider?: string;
  fallback?: boolean;
}

export interface AnalyzeProductBody {
  image: string; // base64 data url
  language: string;
}

export interface AnalyzeProductResponse {
  name: string;
  category: string;
  features: string[];
  description: string;
  sellingPoints: string[];
  imagePrompt: string;
}

export interface RenderProjectBody {
  projectId: string;
  // orchestrates: scenes -> images -> tts (per scene) -> merged audio -> subtitles
}

export interface ProviderSettings {
  [providerId: string]: {
    apiKey?: string;
    enabled: boolean;
    config?: Record<string, unknown>;
  };
}
