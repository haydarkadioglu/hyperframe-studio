import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LANGUAGE_MAP, MODE_MAP } from "@/lib/providers";

export async function GET() {
  try {
    const projects = await db.videoProject.findMany({
      select: {
        id: true,
        mode: true,
        language: true,
        tone: true,
        style: true,
        status: true,
        durationSec: true,
        sceneCount: true,
        aspectRatio: true,
        llmProvider: true,
        ttsProvider: true,
        createdAt: true,
      },
    });

    const total = projects.length;
    const ready = projects.filter((p) => p.status === "ready").length;
    const generating = projects.filter((p) => p.status === "generating").length;
    const draft = projects.filter((p) => p.status === "draft").length;
    const error = projects.filter((p) => p.status === "error").length;

    const totalDurationSec = projects.reduce((a, p) => a + (p.durationSec || 0), 0);
    const totalScenes = projects.reduce((a, p) => a + (p.sceneCount || 0), 0);

    // Distributions
    const byMode = tally(projects.map((p) => p.mode));
    const byLanguage = tally(projects.map((p) => p.language));
    const byTone = tally(projects.map((p) => p.tone));
    const byStyle = tally(projects.map((p) => p.style));
    const byStatus = tally(projects.map((p) => p.status));
    const byAspectRatio = tally(projects.map((p) => p.aspectRatio));
    const byLlmProvider = tally(projects.map((p) => p.llmProvider));
    const byTtsProvider = tally(projects.map((p) => p.ttsProvider));

    // Last 14 days activity (videos created per day)
    const days = 14;
    const now = new Date();
    const dailyActivity: { date: string; label: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const count = projects.filter((p) => {
        const c = new Date(p.createdAt);
        return c >= d && c < next;
      }).length;
      dailyActivity.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        count,
      });
    }

    // Enrich distributions with labels
    const languageDist = Object.entries(byLanguage).map(([code, count]) => ({
      code,
      name: LANGUAGE_MAP[code]?.name ?? code,
      flag: LANGUAGE_MAP[code]?.flag ?? "🌐",
      count,
    }));
    const modeDist = Object.entries(byMode).map(([id, count]) => ({
      id,
      label: MODE_MAP[id as keyof typeof MODE_MAP]?.label ?? id,
      emoji: MODE_MAP[id as keyof typeof MODE_MAP]?.emoji ?? "🎬",
      count,
    }));

    return NextResponse.json({
      totals: {
        total,
        ready,
        generating,
        draft,
        error,
        totalDurationSec,
        totalScenes,
      },
      distributions: {
        byMode: modeDist,
        byLanguage: languageDist,
        byTone: Object.entries(byTone).map(([id, count]) => ({ id, count })),
        byStyle: Object.entries(byStyle).map(([id, count]) => ({ id, count })),
        byStatus: Object.entries(byStatus).map(([id, count]) => ({ id, count })),
        byAspectRatio: Object.entries(byAspectRatio).map(([id, count]) => ({ id, count })),
        byLlmProvider: Object.entries(byLlmProvider).map(([id, count]) => ({ id, count })),
        byTtsProvider: Object.entries(byTtsProvider).map(([id, count]) => ({ id, count })),
      },
      dailyActivity,
    });
  } catch (e: any) {
    console.error("Stats error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function tally(arr: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of arr) out[v] = (out[v] || 0) + 1;
  return out;
}
