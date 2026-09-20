import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rowToVideoProject } from "@/lib/project-store";

// Duplicate a project: clone all fields + scenes, reset status to draft, clear outputs.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const src = await db.videoProject.findUnique({ where: { id } });
    if (!src) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const dup = await db.videoProject.create({
      data: {
        title: `${src.title} (kopya)`,
        topic: src.topic,
        mode: src.mode,
        language: src.language,
        llmProvider: src.llmProvider,
        ttsProvider: src.ttsProvider,
        voice: src.voice,
        tone: src.tone,
        style: src.style,
        aspectRatio: src.aspectRatio,
        status: "draft",
        scenes: src.scenes, // keep scene plan so user can edit without regenerating
        sceneCount: src.sceneCount,
        durationSec: src.durationSec,
        // clear outputs
        audioUrl: null,
        subtitles: null,
        thumbnailUrl: null,
        errorMessage: null,
      },
    });

    return NextResponse.json({ project: rowToVideoProject(dup) });
  } catch (e: any) {
    console.error("Duplicate error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
