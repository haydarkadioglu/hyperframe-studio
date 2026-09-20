import { NextRequest, NextResponse } from "next/server";
import { analyzeProductImage } from "@/lib/ai";
import type { AnalyzeProductBody } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeProductBody;
    if (!body.image) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }
    const result = await analyzeProductImage({ image: body.image, language: body.language || "tr" });
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Product analysis error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
