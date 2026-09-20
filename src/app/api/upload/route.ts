import { NextRequest, NextResponse } from "next/server";
import { saveBase64Image } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(async () => {
      // Maybe multipart form
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return null;
      const buf = Buffer.from(await file.arrayBuffer());
      const b64 = `data:${file.type};base64,${buf.toString("base64")}`;
      return { image: b64, name: file.name };
    });
    if (!body || !body.image) {
      return NextResponse.json({ error: "image (base64) required" }, { status: 400 });
    }
    const saved = await saveBase64Image(body.image, "upload");
    return NextResponse.json({ url: saved.url, name: body.name });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
