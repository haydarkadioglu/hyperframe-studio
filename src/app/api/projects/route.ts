import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProjectRow } from "@/lib/project-store";
import type { CreateProjectBody } from "@/lib/types";

export async function GET() {
  try {
    const projects = await listProjects({ limit: 60 });
    return NextResponse.json({ projects });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateProjectBody;
    if (!body.topic || !body.mode) {
      return NextResponse.json({ error: "topic and mode are required" }, { status: 400 });
    }
    const project = await createProjectRow({
      title: body.title || body.topic.slice(0, 60),
      topic: body.topic,
      mode: body.mode,
      language: body.language || "tr",
      llmProvider: body.llmProvider || "zai",
      ttsProvider: body.ttsProvider || "zai",
      voice: body.voice || "tongtong",
      tone: body.tone || "professional",
      style: body.style || "modern",
      aspectRatio: body.aspectRatio || "16:9",
      status: "draft",
    });
    return NextResponse.json({ project });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
