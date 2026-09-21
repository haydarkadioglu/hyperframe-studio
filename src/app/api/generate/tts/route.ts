import { NextRequest, NextResponse } from "next/server";
import { generateTtsAudio, recommendTts } from "@/lib/ai";
import { saveAssetBuffer } from "@/lib/storage";
import { addAsset } from "@/lib/project-store";
import type { GenerateTtsBody, Tone } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateTtsBody;
    if (!body.text || body.text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    // If voice not provided, recommend based on tone — assume professional if missing
    let voice = body.voice || "tongtong";
    let speed = body.speed ?? 1.0;
    // Always use Z.ai TTS engine in this env (provider field kept for UI parity)
    const rec = recommendTts("zai", "professional", "tr");
    if (!body.voice) voice = rec.voice;
    if (body.speed == null) speed = rec.speed;

    const buffer = await generateTtsAudio(body.text, voice, speed, "wav");
    const saved = await saveAssetBuffer(buffer, "wav", "audio");
    if (body.projectId) {
      await addAsset({ projectId: body.projectId, type: "audio", url: saved.url, role: "narration" });
    }
    // Rough duration estimate from text length & speed (mp3 has no easy header read here)
    const words = body.text.trim().split(/\s+/).length;
    const durationMs = Math.round((words / (140 * speed)) * 60 * 1000);
    return NextResponse.json({ audioUrl: saved.url, durationMs });
  } catch (e: any) {
    console.error("TTS error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
