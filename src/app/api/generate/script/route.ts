import { NextRequest, NextResponse } from "next/server";
import { generateScript } from "@/lib/ai";
import type { GenerateScriptBody } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateScriptBody;
    if (!body.topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }
    const result = await generateScript({
      topic: body.topic,
      mode: body.mode,
      language: body.language || "tr",
      tone: body.tone,
      style: body.style,
      targetScenes: body.targetScenes || 5,
      productAnalysis: body.productAnalysis,
      customScript: body.customScript,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Script gen error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
