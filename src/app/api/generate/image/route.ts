import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/ai";
import { saveAssetBuffer } from "@/lib/storage";
import { addAsset } from "@/lib/project-store";
import type { GenerateImageBody } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateImageBody;
    if (!body.prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }
    const size = body.size || "1344x768";
    const { buffer } = await generateImage(body.prompt, size);
    const saved = await saveAssetBuffer(buffer, "png", "image");
    if (body.projectId) {
      await addAsset({
        projectId: body.projectId,
        type: "image",
        url: saved.url,
        role: "scene-visual",
        sceneIdx: body.sceneIdx,
      });
    }
    return NextResponse.json({ imageUrl: saved.url });
  } catch (e: any) {
    console.error("Image gen error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
