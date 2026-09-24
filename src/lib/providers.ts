import type {
  LLMProviderInfo,
  TTSProviderInfo,
  ImageProviderInfo,
  VoiceInfo,
  LanguageInfo,
  Tone,
  VideoStyle,
  VideoMode,
} from "./types";

// ---- Languages ----
export const LANGUAGES: LanguageInfo[] = [
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
];

export const LANGUAGE_MAP: Record<string, LanguageInfo> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l])
);

// ---- Tones (content-aware voice direction) ----
export const TONES: { id: Tone; label: string; description: string; emoji: string }[] = [
  { id: "professional", label: "Profesyonel", description: "Net, güvenilir, iş odaklı", emoji: "💼" },
  { id: "energetic", label: "Enerjik", description: "Canlı, heyecanlı, tempolu", emoji: "⚡" },
  { id: "calm", label: "Sakin", description: "Yavaş, huzurlu, meditatif", emoji: "🌿" },
  { id: "dramatic", label: "Dramatik", description: "Vurgulu, etkileyici, sinematik", emoji: "🎭" },
  { id: "friendly", label: "Samimi", description: "Sıcak, yakın, sohbet havasında", emoji: "😊" },
  { id: "inspirational", label: "İlham Verici", description: "Yükselen, motive edici", emoji: "✨" },
  { id: "news", label: "Haber", description: "Tarafsız, net anchorman", emoji: "📰" },
  { id: "documentary", label: "Belgesel", description: "Anlatımsal, bilgilendirici", emoji: "🎬" },
];

export const TONE_MAP: Record<Tone, (typeof TONES)[number]> = Object.fromEntries(
  TONES.map((t) => [t.id, t])
) as Record<Tone, (typeof TONES)[number]>;

// Map tone -> recommended TTS speed
export const TONE_SPEED: Record<Tone, number> = {
  professional: 1.0,
  energetic: 1.2,
  calm: 0.85,
  dramatic: 0.9,
  friendly: 1.05,
  inspirational: 0.95,
  news: 1.0,
  documentary: 0.92,
};

// ---- Video styles ----
export const STYLES: { id: VideoStyle; label: string; description: string; gradient: string }[] = [
  { id: "modern", label: "Modern", description: "Temiz, gradient, çağdaş", gradient: "from-violet-500 via-fuchsia-500 to-pink-500" },
  { id: "cinematic", label: "Sinematik", description: "Koyu, kontrastlı, film havası", gradient: "from-slate-800 via-slate-900 to-black" },
  { id: "playful", label: "Eğlenceli", description: "Renkli, neşeli, hareketli", gradient: "from-amber-400 via-orange-500 to-rose-500" },
  { id: "minimal", label: "Minimal", description: "Sade, beyaz, boşluklu", gradient: "from-zinc-100 via-zinc-200 to-zinc-300" },
  { id: "corporate", label: "Kurumsal", description: "Profesyonel, mavi-tonlu", gradient: "from-cyan-600 via-blue-600 to-indigo-700" },
  { id: "vibrant", label: "Canlı", description: "Doymuş renkler, cesur", gradient: "from-emerald-400 via-teal-500 to-cyan-600" },
  { id: "elegant", label: "Zarif", description: "Altın tonları, lüks", gradient: "from-amber-700 via-yellow-600 to-amber-400" },
  { id: "bold", label: "Cesur", description: "Yüksek kontrast, tipografi odaklı", gradient: "from-rose-600 via-red-600 to-orange-600" },
];

export const STYLE_MAP: Record<VideoStyle, (typeof STYLES)[number]> = Object.fromEntries(
  STYLES.map((s) => [s.id, s])
) as Record<VideoStyle, (typeof STYLES)[number]>;

// ---- Video modes ----
export const MODES: { id: VideoMode; label: string; description: string; emoji: string; gradient: string }[] = [
  {
    id: "topic",
    label: "Konu → Video",
    description: "Bir konu yaz, AI senaryo, ses ve görselleri üretsin",
    emoji: "💡",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "product",
    label: "Ürün Tanıtımı",
    description: "Ürün fotoğraflarını yükle, VLM analiz etsin, tanıtım videosu oluşsun",
    emoji: "📦",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "script",
    label: "Kendi Senaryon",
    description: "Hazır metnini gir, AI sahnelere bölsün ve videoya çevirsin",
    emoji: "✍️",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "youtube",
    label: "YouTube Altyazılı",
    description: "SRT altyazılı, YouTube uyumlu video üret",
    emoji: "▶️",
    gradient: "from-red-500 to-rose-500",
  },
];

export const MODE_MAP: Record<VideoMode, (typeof MODES)[number]> = Object.fromEntries(
  MODES.map((m) => [m.id, m])
) as Record<VideoMode, (typeof MODES)[number]>;

// ---- LLM Providers ----
export const LLM_PROVIDERS: LLMProviderInfo[] = [
  {
    id: "zai",
    name: "Z.ai GLM",
    kind: "llm",
    available: true,
    description: "Yerleşik GLM modeli. Hemen çalışır, anahtar gerekmez.",
    models: ["glm-4.6", "glm-4.5v"],
    requiresKey: false,
  },
  {
    id: "openai",
    name: "OpenAI GPT",
    kind: "llm",
    available: true,
    description: "GPT-4o / GPT-4o-mini. Kendi API anahtarını girin.",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    requiresKey: true,
    website: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    kind: "llm",
    available: true,
    description: "Claude 3.5 Sonnet. Kendi API anahtarını girin.",
    models: ["claude-3-5-sonnet", "claude-3-opus"],
    requiresKey: true,
    website: "https://console.anthropic.com/",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    kind: "llm",
    available: true,
    description: "Gemini 1.5 Pro / Flash. Kendi API anahtarını girin.",
    models: ["gemini-1.5-pro", "gemini-1.5-flash"],
    requiresKey: true,
    website: "https://aistudio.google.com/apikey",
  },
];

// ---- TTS Providers ----
// Z.ai voices (functional by default)
const ZAI_VOICES: VoiceInfo[] = [
  { id: "tongtong", name: "Tongtong", description: "Sıcak ve samimi", gender: "female", language: "zh" },
  { id: "chuichui", name: "Chuichui", description: "Canlı ve neşeli", gender: "female", language: "zh" },
  { id: "xiaochen", name: "Xiaochen", description: "Sakin ve profesyonel", gender: "male", language: "zh" },
  { id: "jam", name: "Jam", description: "İngiliz aksanı, centilmen", gender: "male", language: "en" },
  { id: "kazi", name: "Kazi", description: "Net ve standart", gender: "neutral", language: "en" },
  { id: "douji", name: "Douji", description: "Doğal ve akıcı", gender: "neutral", language: "zh" },
  { id: "luodo", name: "Luodo", description: "Etkileyici, duygusal", gender: "male", language: "zh" },
];

export const TTS_PROVIDERS: TTSProviderInfo[] = [
  {
    id: "zai",
    name: "Z.ai TTS",
    kind: "tts",
    available: true,
    description: "Yerleşik TTS. 7 ses, çoklu dil. Hemen çalışır.",
    voices: ZAI_VOICES,
    requiresKey: false,
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    kind: "tts",
    available: true,
    description: "Ultra gerçekçi çoklu dil sesleri. API anahtarı gerekir.",
    voices: [
      { id: "rachel", name: "Rachel", description: "Sakin, kadın Amerikan", gender: "female", language: "en" },
      { id: "domi", name: "Domi", description: "Güçlü, kadın Amerikan", gender: "female", language: "en" },
      { id: "bella", name: "Bella", description: "Yumuşak, kadın", gender: "female", language: "en" },
      { id: "antoni", name: "Antoni", description: "Sıcak, erkek Amerikan", gender: "male", language: "en" },
      { id: "elli", name: "Elli", description: "Emotionel, kadın", gender: "female", language: "en" },
      { id: "josh", name: "Josh", description: "Derin, erkek Amerikan", gender: "male", language: "en" },
      { id: "arnold", name: "Arnold", description: "Enerjik, erkek", gender: "male", language: "en" },
      { id: "multi-lingual", name: "Multi-lingual", description: "Türkçe dahil çoklu dil", gender: "neutral", language: "multi" },
    ],
    requiresKey: true,
    website: "https://elevenlabs.io/app/settings/api-keys",
  },
  {
    id: "openai-tts",
    name: "OpenAI TTS",
    kind: "tts",
    available: true,
    description: "OpenAI ses sentezi (tts-1, tts-1-hd). API anahtarı gerekir.",
    voices: [
      { id: "alloy", name: "Alloy", description: "Nötr, dengeli", gender: "neutral", language: "en" },
      { id: "echo", name: "Echo", description: "Erkek, sakin", gender: "male", language: "en" },
      { id: "fable", name: "Fable", description: "İngiliz aksanı, anlatıcı", gender: "neutral", language: "en" },
      { id: "onyx", name: "Onyx", description: "Derin, erkek", gender: "male", language: "en" },
      { id: "nova", name: "Nova", description: "Kadın, sıcak", gender: "female", language: "en" },
      { id: "shimmer", name: "Shimmer", description: "Kadın, parlak", gender: "female", language: "en" },
    ],
    requiresKey: true,
    website: "https://platform.openai.com/api-keys",
  },
];

// ---- Image Providers ----
export const IMAGE_PROVIDERS: ImageProviderInfo[] = [
  {
    id: "zai",
    name: "Z.ai Image",
    kind: "image",
    available: true,
    description: "Built-in image generation. Works instantly, no key needed.",
    models: ["cogview-3-plus"],
    sizes: ["1024x1024", "768x1344", "864x1152", "1344x768", "1152x864", "1440x720", "720x1440"],
    requiresKey: false,
  },
  {
    id: "openai-image",
    name: "OpenAI DALL·E",
    kind: "image",
    available: true,
    description: "DALL·E 3 (1024×1024 / 1792×1024 / 1024×1792). Bring your own API key.",
    models: ["dall-e-3", "dall-e-2"],
    sizes: ["1024x1024", "1792x1024", "1024x1792"],
    requiresKey: true,
    website: "https://platform.openai.com/api-keys",
  },
  {
    id: "stability",
    name: "Stability AI",
    kind: "image",
    available: true,
    description: "Stable Diffusion 3 / SDXL. High-quality photorealism. API key required.",
    models: ["stable-diffusion-3", "stable-diffusion-xl", "stable-image-core"],
    sizes: ["1024x1024", "1344x768", "768x1344", "1152x864", "864x1152"],
    requiresKey: true,
    website: "https://platform.stability.ai/api-keys",
  },
  {
    id: "replicate",
    name: "Replicate FLUX",
    kind: "image",
    available: true,
    description: "FLUX.1 by Black Forest Labs via Replicate. Stunning detail. API key required.",
    models: ["black-forest-labs/flux-1.1-pro", "black-forest-labs/flux-schnell"],
    sizes: ["1024x1024", "1024x768", "768x1024", "1024x576", "576x1024"],
    requiresKey: true,
    website: "https://replicate.com/account/api-tokens",
  },
];

export function getLLMProvider(id: string): LLMProviderInfo | undefined {
  return LLM_PROVIDERS.find((p) => p.id === id);
}

export function getTTSProvider(id: string): TTSProviderInfo | undefined {
  return TTS_PROVIDERS.find((p) => p.id === id);
}

export function getImageProvider(id: string): ImageProviderInfo | undefined {
  return IMAGE_PROVIDERS.find((p) => p.id === id);
}

export function getVoicesForProvider(providerId: string): VoiceInfo[] {
  return getTTSProvider(providerId)?.voices ?? ZAI_VOICES;
}

// Recommended voice based on tone + language
export function recommendVoice(providerId: string, tone: Tone, language: string): string {
  const voices = getVoicesForProvider(providerId);
  // English content prefers jam (gentleman) / neutral
  if (["en"].includes(language)) {
    if (tone === "energetic" || tone === "news") return "jam";
    if (tone === "calm" || tone === "documentary") return "kazi";
  }
  // emotional tones
  if (tone === "dramatic" || tone === "inspirational") {
    const luodo = voices.find((v) => v.id === "luodo");
    if (luodo) return luodo.id;
  }
  // professional / friendly
  if (tone === "professional" || tone === "news") {
    const xiaochen = voices.find((v) => v.id === "xiaochen");
    if (xiaochen) return xiaochen.id;
  }
  // friendly
  if (tone === "friendly" || tone === "energetic") {
    const chuichui = voices.find((v) => v.id === "chuichui");
    if (chuichui) return chuichui.id;
  }
  return voices[0]?.id ?? "tongtong";
}
