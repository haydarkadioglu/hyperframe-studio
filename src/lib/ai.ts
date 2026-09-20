import ZAI from "z-ai-web-dev-sdk";
import type {
  GenerateScriptBody,
  GenerateScriptResponse,
  Scene,
  SceneType,
  SceneAnimation,
  Tone,
  VideoStyle,
  AnalyzeProductBody,
  AnalyzeProductResponse,
} from "./types";
import { TONE_SPEED, getVoicesForProvider } from "./providers";
import { toDataUrl } from "./storage";

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
export async function getZai() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

// -------- LLM: generate structured video script as scenes --------
export async function generateScript(
  body: GenerateScriptBody
): Promise<GenerateScriptResponse> {
  const { topic, mode, language, tone, style, targetScenes, productAnalysis, customScript } = body;
  const zai = await getZai();

  const toneGuide: Record<Tone, string> = {
    professional: "Use precise, authoritative language. Suitable for B2B or educational content.",
    energetic: "Use punchy, high-energy sentences. Exciting and motivating.",
    calm: "Use slow, soothing, contemplative language. Mindful and peaceful.",
    dramatic: "Use evocative, suspenseful phrasing with strong emotional beats.",
    friendly: "Use warm, conversational, second-person address as if talking to a friend.",
    inspirational: "Use uplifting, motivational language that builds to a crescendo.",
    news: "Use neutral, factual, anchor-style delivery with clear statements.",
    documentary: "Use measured, narrative, descriptive storytelling voice.",
  };

  const styleGuide: Record<VideoStyle, string> = {
    modern: "Clean gradients, geometric shapes, contemporary typography.",
    cinematic: "Dark moody backgrounds, letterbox feel, dramatic lighting.",
    playful: "Bright colors, rounded shapes, fun iconography.",
    minimal: "Lots of whitespace, monochrome accents, simple type.",
    corporate: "Navy/teal palette, structured grids, business icons.",
    vibrant: "Saturated multi-color, bold contrasts.",
    elegant: "Gold/cream palette, serif typography, luxurious feel.",
    bold: "High-contrast black/red, oversized type, brutalist.",
  };

  const sceneTypeRotation: SceneType[] = ["title", "text", "image", "text", "quote", "image", "stats", "cta"];

  const systemPrompt = `You are Hyperframe Studio's AI video director. You turn a topic into a structured narrated video scene plan.
You output ONLY valid JSON, no markdown fences, no commentary.

The JSON shape must be exactly:
{
  "title": "<short video title in ${language}>",
  "scenes": [
    {
      "type": "title" | "text" | "image" | "quote" | "stats" | "cta",
      "title": "<optional on-screen heading in ${language}>",
      "text": "<on-screen body text in ${language}, max 140 chars>",
      "narration": "<spoken voiceover in ${language}, max 220 chars, MUST match tone: ${tone}>",
      "subtitle": "<subtitle line in ${language}, <= 90 chars, same meaning as narration>",
      "imagePrompt": "<detailed English prompt describing the visual for this scene, photorealistic, no text in image>",
      "animation": "fade" | "slide-up" | "slide-left" | "zoom" | "bounce" | "flip" | "ken-burns",
      "accentColor": "<hex color like #7c3aed>"
    }
  ]
}

Rules:
- Exactly ${targetScenes} scenes.
- First scene MUST be type "title" (the hook).
- Last scene MUST be type "cta" (call to action).
- Alternate scene types in between for visual variety.
- Narration should flow as a continuous spoken story across scenes.
- Subtitle must be a shortened version of narration (readable in ${language}).
- Tone: ${tone}. ${toneGuide[tone]}
- Visual style: ${style}. ${styleGuide[style]}
- Topic: ${topic}
- Language: ${language} (all user-facing text in ${language}; imagePrompt always English).
${mode === "product" && productAnalysis ? `- Mode: product showcase. Product analysis:\n${productAnalysis}\nWeave product features & selling points into the narration naturally.` : ""}
${mode === "script" && customScript ? `- Mode: custom script. Adapt the following source content into scenes:\n${customScript}` : ""}
${mode === "youtube" ? "- Mode: YouTube. Make subtitles especially clean for burned-in captions. End with a subscribe CTA." : ""}

Return ONLY the JSON object.`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: systemPrompt },
      { role: "user", content: `Create the scene plan now for topic: "${topic}".` },
    ],
    thinking: { type: "disabled" },
  });

  const raw = completion.choices?.[0]?.message?.content ?? "";
  const parsed = safeParseJSON(raw);
  if (!parsed || !Array.isArray(parsed.scenes)) {
    throw new Error("LLM did not return valid scene JSON: " + raw.slice(0, 200));
  }

  const baseDurMs = 4200; // ~4.2s per scene baseline
  const scenes: Scene[] = parsed.scenes.map((s: any, i: number) => ({
    id: `scene_${i + 1}`,
    index: i,
    type: (s.type as SceneType) ?? sceneTypeRotation[i % sceneTypeRotation.length],
    title: s.title || undefined,
    text: s.text ?? "",
    narration: s.narration ?? s.text ?? "",
    subtitle: s.subtitle ?? s.narration ?? s.text ?? "",
    imagePrompt: s.imagePrompt || undefined,
    durationMs: estimateDuration(s.narration ?? s.text ?? "", baseDurMs),
    animation: (s.animation as SceneAnimation) ?? "fade",
    accentColor: s.accentColor || "#7c3aed",
  }));

  const totalDurationMs = scenes.reduce((a, s) => a + s.durationMs, 0);
  return {
    title: parsed.title || topic.slice(0, 60),
    scenes,
    totalDurationMs,
  };
}

function estimateDuration(text: string, base: number): number {
  // ~140 wpm narration; word count drives duration
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const ms = Math.max(2200, Math.min(9000, Math.round((words / 140) * 60 * 1000) + 600));
  return Math.max(ms, base);
}

export function safeParseJSON(s: string): any | null {
  if (!s) return null;
  // strip code fences
  let t = s.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  // find first { and last }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

// -------- VLM: analyze a product image --------
export async function analyzeProductImage(
  body: AnalyzeProductBody
): Promise<AnalyzeProductResponse> {
  const zai = await getZai();
  const dataUrl = await toDataUrl(body.image);

  const prompt = `You are a product marketing analyst. Analyze this product image and respond with ONLY valid JSON (no markdown fences) in this exact shape:
{
  "name": "<product name guess in ${body.language}>",
  "category": "<product category in ${body.language}>",
  "features": ["<feature 1 in ${body.language}>", "<feature 2>", "<feature 3>", "<feature 4>"],
  "description": "<2-3 sentence product description in ${body.language}>",
  "sellingPoints": ["<selling point 1 in ${body.language}>", "<selling point 2>", "<selling point 3>"],
  "imagePrompt": "<detailed English prompt to generate a clean studio product photo of this kind of item, professional lighting, white background>"
}

Be specific and marketing-friendly. Return ONLY the JSON.`;

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    thinking: { type: "disabled" },
  });

  const raw = response.choices?.[0]?.message?.content ?? "";
  const parsed = safeParseJSON(raw);
  if (!parsed) throw new Error("VLM did not return valid JSON: " + raw.slice(0, 200));
  return {
    name: parsed.name || "Ürün",
    category: parsed.category || "Genel",
    features: parsed.features || [],
    description: parsed.description || "",
    sellingPoints: parsed.sellingPoints || [],
    imagePrompt:
      parsed.imagePrompt ||
      "professional studio product photo, soft lighting, white background, high detail",
  };
}

// -------- Image generation --------
export async function generateImage(
  prompt: string,
  size: string = "1344x768"
): Promise<{ base64: string; buffer: Buffer }> {
  const zai = await getZai();
  const response = await zai.images.generations.create({
    prompt,
    size,
  });
  const imageBase64 = response.data?.[0]?.base64;
  if (!imageBase64) throw new Error("Image generation returned no data");
  const buffer = Buffer.from(imageBase64, "base64");
  return { base64: imageBase64, buffer };
}

// -------- TTS --------
// NOTE: Z.ai TTS in this env rejects `mp3`; use `wav` (default) which is fully supported.
// The browser <audio> element plays wav natively.
export async function generateTtsAudio(
  text: string,
  voice: string,
  speed: number = 1.0,
  format: "wav" | "mp3" | "pcm" = "wav"
): Promise<Buffer> {
  const zai = await getZai();
  // Split long text (>900 chars) into chunks; concatenate wav buffers.
  const chunks = splitText(text, 900);
  const buffers: Buffer[] = [];
  const fmt = format === "mp3" ? "wav" : format; // mp3 not supported here -> wav
  for (const chunk of chunks) {
    const response = await zai.audio.tts.create({
      input: chunk,
      voice,
      speed: Math.min(2, Math.max(0.5, speed)),
      response_format: fmt,
      stream: false,
    });
    const ab = await response.arrayBuffer();
    buffers.push(Buffer.from(new Uint8Array(ab)));
  }
  if (buffers.length === 1) return buffers[0];
  // Concatenate WAV buffers properly: keep first header, append PCM data of rest, fix sizes.
  return concatWav(buffers);
}

// Minimal WAV concatenation: assumes same format (16-bit PCM, 24000Hz, mono/stereo).
// Keeps the header of the first buffer, appends raw audio data from all buffers,
// and rewrites the data chunk size + RIFF chunk size fields.
function concatWav(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) return Buffer.alloc(0);
  const first = buffers[0];
  if (first.length < 44) return first;
  // Collect PCM payloads (skip 44-byte header of each WAV)
  const payloads: Buffer[] = [];
  for (const b of buffers) {
    payloads.push(b.subarray(44));
  }
  const dataLen = payloads.reduce((a, p) => a + p.length, 0);
  const out = Buffer.concat([first.subarray(0, 44), ...payloads]);
  // RIFF chunk size = 36 + dataLen (write at offset 4, little-endian uint32)
  out.writeUInt32LE(36 + dataLen, 4);
  // data chunk size (write at offset 40, little-endian uint32)
  out.writeUInt32LE(dataLen, 40);
  return out;
}

function splitText(text: string, max: number): string[] {
  const t = text.trim();
  if (t.length <= max) return [t];
  const sentences = t.match(/[^.!?。！？]+[.!?。！？]+|\S[^.!?。！？]*$/g) || [t];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length <= max) {
      cur += s;
    } else {
      if (cur) chunks.push(cur.trim());
      // if single sentence longer than max, hard split
      if (s.length > max) {
        for (let i = 0; i < s.length; i += max) chunks.push(s.slice(i, i + max));
        cur = "";
      } else {
        cur = s;
      }
    }
  }
  if (cur) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

// Recommend voice + speed from tone+language for a provider
export function recommendTts(provider: string, tone: Tone, language: string) {
  const voices = getVoicesForProvider(provider);
  let voice = voices[0]?.id ?? "tongtong";
  if (provider === "zai") {
    if (["en"].includes(language)) {
      voice = tone === "calm" || tone === "documentary" ? "kazi" : "jam";
    } else if (tone === "dramatic" || tone === "inspirational") voice = "luodo";
    else if (tone === "professional" || tone === "news") voice = "xiaochen";
    else if (tone === "friendly" || tone === "energetic") voice = "chuichui";
    else voice = "tongtong";
  }
  const speed = TONE_SPEED[tone] ?? 1.0;
  return { voice, speed };
}
