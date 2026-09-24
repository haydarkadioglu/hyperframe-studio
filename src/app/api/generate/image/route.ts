import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/ai";
import { saveAssetBuffer } from "@/lib/storage";
import { addAsset, getProject } from "@/lib/project-store";
import { getProviderKey } from "@/lib/settings-store";
import type { GenerateImageBody } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateImageBody;
    if (!body.prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }
    const size = body.size || "1344x768";

    // Resolve image provider + API key:
    // - If projectId given, use that project's imageProvider setting.
    // - Else fall back to body.provider or "zai".
    let provider = body.provider || "zai";
    let apiKey: string | undefined;
    if (body.projectId) {
      const project = await getProject(body.projectId);
      if (project?.imageProvider) provider = project.imageProvider;
    }
    if (provider !== "zai") {
      apiKey = await getProviderKey(provider);
    }

    try {
      const { buffer } = await generateImage(body.prompt, size, { provider, apiKey });
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
      return NextResponse.json({ imageUrl: saved.url, provider });
    } catch (e: any) {
      // Fallback to Z.ai built-in if external provider fails
      if (provider !== "zai") {
        console.error(`${provider} image gen failed, falling back to Z.ai:`, e?.message);
        const { buffer } = await generateImage(body.prompt, size, { provider: "zai" });
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
        return NextResponse.json({ imageUrl: saved.url, provider: "zai", fallback: true });
      }
      throw e;
    }
  } catch (e: any) {
    console.error("Image gen error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
