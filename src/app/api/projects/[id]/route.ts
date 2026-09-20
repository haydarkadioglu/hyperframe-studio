import { NextRequest, NextResponse } from "next/server";
import { getProject, deleteProject, updateProject } from "@/lib/project-store";
import { buildSRT } from "@/lib/subtitles";
import type { Scene } from "@/lib/types";
import { isProjectRunning } from "./render/route";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

    // Stale-detection: if the DB says "generating" but no job is actually running in this process
    // (e.g. after a dev server restart) AND it's been more than 90 seconds since the last update,
    // mark the project as "error" so the UI shows a retry option instead of polling forever.
    if (project.status === "generating" && !isProjectRunning(id)) {
      const updated = new Date(project.updatedAt).getTime();
      const ageMs = Date.now() - (isNaN(updated) ? 0 : updated);
      if (ageMs > 90_000) {
        const fixed = await updateProject(id, {
          status: "error",
          errorMessage: "Üretim zaman aşımına uğradı (sunucu yeniden başlatılması veya beklenmeyen kesinti). Tekrar deneyebilirsiniz.",
        });
        return NextResponse.json({ project: fixed });
      }
    }

    return NextResponse.json({ project });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: update title / tone / style / scenes.
// When scenes change, subtitles (SRT) are rebuilt automatically.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

    const patch: {
      title?: string;
      tone?: string;
      style?: string;
      scenes?: Scene[];
      status?: string;
      errorMessage?: string | null;
    } = {};

    if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim().slice(0, 200);
    if (typeof body.tone === "string") patch.tone = body.tone;
    if (typeof body.style === "string") patch.style = body.style;
    if (typeof body.status === "string") patch.status = body.status;
    if (body.errorMessage !== undefined) patch.errorMessage = body.errorMessage;

    let scenesChanged = false;
    if (Array.isArray(body.scenes)) {
      // Re-index and validate minimal shape
      const scenes: Scene[] = body.scenes.map((s: any, i: number) => ({
        id: s.id || `scene_${i + 1}`,
        index: i,
        type: s.type || "text",
        title: s.title || undefined,
        text: String(s.text ?? ""),
        narration: String(s.narration ?? s.text ?? ""),
        subtitle: String(s.subtitle ?? s.narration ?? s.text ?? ""),
        imagePrompt: s.imagePrompt || undefined,
        imageUrl: s.imageUrl || undefined,
        durationMs: Math.max(1500, Math.min(15000, Number(s.durationMs) || 4000)),
        animation: s.animation || "fade",
        accentColor: s.accentColor || "#7c3aed",
      }));
      patch.scenes = scenes;
      scenesChanged = true;
    }

    const updated = await updateProject(id, patch);

    // If scenes changed, rebuild SRT subtitles
    if (scenesChanged && updated.scenes.length > 0) {
      const subtitles = buildSRT(updated.scenes);
      const withSubs = await updateProject(id, { subtitles });
      return NextResponse.json({ project: withSubs });
    }

    return NextResponse.json({ project: updated });
  } catch (e: any) {
    console.error("PATCH project error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
