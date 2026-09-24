import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject, addAsset } from "@/lib/project-store";
import {
  generateScript,
  analyzeProductImage,
  generateImage,
  generateTtsAudio,
  recommendTts,
} from "@/lib/ai";
import { buildSRT } from "@/lib/subtitles";
import { saveAssetBuffer, toDataUrl } from "@/lib/storage";
import { TONE_SPEED } from "@/lib/providers";
import { getProviderKey } from "@/lib/settings-store";
import type { Scene, VideoProject } from "@/lib/types";

// Background jobs tracker (in-memory; fine for single dev instance)
const running = new Set<string>();

// Exported so the GET route can detect stale "generating" state after a server restart
export function isProjectRunning(id: string): boolean {
  return running.has(id);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const productImages: string[] = body.productImages || [];
    const customScript: string | undefined = body.customScript;
    const targetScenes: number = body.targetScenes || 5;

    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
    // Only refuse if a job is ACTUALLY running in this process.
    // A "generating" DB status with no running job means a stale/stuck state (e.g. server restart) → allow re-render.
    if (running.has(id)) {
      return NextResponse.json({ project, alreadyRunning: true });
    }

    // Kick off background generation (do not await in the route to allow long jobs)
    running.add(id);
    void runGeneration(project.id, {
      topic: project.topic,
      mode: project.mode,
      language: project.language,
      tone: project.tone,
      style: project.style,
      targetScenes,
      productImages,
      customScript,
      voice: project.voice,
      aspectRatio: project.aspectRatio,
      imageProvider: project.imageProvider || "zai",
    }).catch(async (err) => {
      console.error("Generation failed for", id, err);
      await updateProject(id, { status: "error", errorMessage: String(err?.message || err) });
    }).finally(() => {
      running.delete(id);
    });

    return NextResponse.json({ project, started: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function runGeneration(
  projectId: string,
  opts: {
    topic: string;
    mode: string;
    language: string;
    tone: VideoProject["tone"];
    style: VideoProject["style"];
    targetScenes: number;
    productImages: string[];
    customScript?: string;
    voice: string;
    aspectRatio: string;
    imageProvider: string;
  }
) {
  await updateProject(projectId, {
    status: "generating",
    errorMessage: null,
    progress: { step: "analyzing", total: opts.targetScenes, done: 0, message: "analyzing" },
  });

  // 1) Product analysis (if product mode)
  let productAnalysis: string | undefined;
  if (opts.mode === "product" && opts.productImages.length > 0) {
    const analyses = [];
    for (const img of opts.productImages.slice(0, 4)) {
      try {
        const analysis = await analyzeProductImage({
          image: img,
          language: opts.language,
        });
        analyses.push(analysis);
      } catch (e) {
        console.error("Product analysis failed:", e);
      }
    }
    if (analyses.length > 0) {
      productAnalysis = analyses
        .map((a, i) => `Product ${i + 1}: ${a.name} (${a.category})\nFeatures: ${a.features.join(", ")}\nSelling points: ${a.sellingPoints.join(", ")}\nDescription: ${a.description}`)
        .join("\n\n");
    }
  }

  // 2) Generate script
  await updateProject(projectId, {
    progress: { step: "script", total: opts.targetScenes, done: 0, message: "writing script" },
  });
  const script = await generateScript({
    topic: opts.topic,
    mode: opts.mode as any,
    language: opts.language,
    tone: opts.tone,
    style: opts.style,
    targetScenes: opts.targetScenes,
    productAnalysis,
    customScript: opts.customScript,
  });

  const scenes: Scene[] = script.scenes;

  // Persist scenes early so the UI can show scene placeholders while images generate
  await updateProject(projectId, {
    scenes,
    progress: { step: "images", total: scenes.length, done: 0, sceneIdx: 0, message: "generating images" },
  });

  // 3) Generate images for scenes that have imagePrompt
  const sizeForAspect = imageSizeForAspect(opts.aspectRatio);
  let thumbUrl: string | undefined;
  const imageScenes = scenes.filter((s) => s.imagePrompt);
  let imagesDone = 0;
  // Resolve API key for the chosen image provider (if external)
  const imageApiKey = opts.imageProvider !== "zai"
    ? await getProviderKey(opts.imageProvider)
    : undefined;
  for (const scene of scenes) {
    if (scene.imagePrompt) {
      await updateProject(projectId, {
        progress: {
          step: "images",
          total: imageScenes.length,
          done: imagesDone,
          sceneIdx: scene.index,
          message: `generating image ${imagesDone + 1}/${imageScenes.length}`,
        },
      });
      try {
        const { buffer } = await generateImage(scene.imagePrompt, sizeForAspect, {
          provider: opts.imageProvider,
          apiKey: imageApiKey,
        });
        const saved = await saveAssetBuffer(buffer, "png", "image");
        scene.imageUrl = saved.url;
        await addAsset({ projectId, type: "image", url: saved.url, role: "scene-visual", sceneIdx: scene.index });
        if (!thumbUrl) thumbUrl = saved.url;
      } catch (e) {
        console.error("Image gen failed for scene", scene.index, e);
        // If external provider fails, fall back to Z.ai built-in so generation doesn't stall
        if (opts.imageProvider !== "zai") {
          try {
            const { buffer } = await generateImage(scene.imagePrompt, sizeForAspect, { provider: "zai" });
            const saved = await saveAssetBuffer(buffer, "png", "image");
            scene.imageUrl = saved.url;
            await addAsset({ projectId, type: "image", url: saved.url, role: "scene-visual", sceneIdx: scene.index });
            if (!thumbUrl) thumbUrl = saved.url;
          } catch (e2) {
            console.error("Fallback Z.ai image gen also failed for scene", scene.index, e2);
          }
        }
      }
      imagesDone++;
      // Persist updated scenes after each image so UI reflects progress incrementally
      await updateProject(projectId, {
        scenes,
        progress: {
          step: "images",
          total: imageScenes.length,
          done: imagesDone,
          sceneIdx: scene.index,
          message: `generated image ${imagesDone}/${imageScenes.length}`,
        },
      });
    }
  }

  // 4) Generate TTS audio for full narration (concatenated)
  await updateProject(projectId, {
    progress: { step: "audio", total: scenes.length, done: 0, message: "recording narration" },
  });
  const fullNarration = scenes.map((s) => s.narration || s.text).join(" ");
  const { voice, speed } = recommendTts("zai", opts.tone, opts.language);
  let audioUrl: string | undefined;
  try {
    const audioBuf = await generateTtsAudio(fullNarration, voice, speed, "wav");
    const saved = await saveAssetBuffer(audioBuf, "wav", "audio");
    audioUrl = saved.url;
    await addAsset({ projectId, type: "audio", url: saved.url, role: "narration" });
  } catch (e) {
    console.error("TTS failed:", e);
  }

  // 5) Build SRT subtitles
  await updateProject(projectId, {
    progress: { step: "subtitles", total: scenes.length, done: scenes.length, message: "creating subtitles" },
  });
  const subtitles = buildSRT(scenes);

  // 6) Update project to ready
  await updateProject(projectId, {
    title: script.title,
    scenes,
    status: "ready",
    audioUrl: audioUrl ?? null,
    subtitles,
    thumbnailUrl: thumbUrl ?? null,
    errorMessage: null,
    progress: { step: "done", total: scenes.length, done: scenes.length, message: "done" },
  });
}

function imageSizeForAspect(aspect: string): string {
  switch (aspect) {
    case "9:16":
      return "768x1344";
    case "1:1":
      return "1024x1024";
    case "4:5":
      return "864x1152";
    case "16:9":
    default:
      return "1344x768";
  }
}
