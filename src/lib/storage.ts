import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ASSETS_DIR = path.join(process.cwd(), "public", "assets");
const UPLOAD_DIR = path.join(process.cwd(), "upload");

export async function ensureDirs() {
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveAssetBuffer(
  buffer: Buffer,
  ext: string,
  category: "image" | "audio" | "upload" = "image"
): Promise<{ url: string; filename: string; absPath: string }> {
  await ensureDirs();
  const filename = `${category}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const absPath = path.join(ASSETS_DIR, filename);
  await fs.writeFile(absPath, buffer);
  const url = `/assets/${filename}`;
  return { url, filename, absPath };
}

export async function saveBase64Image(
  base64: string,
  category: "image" | "upload" = "image"
): Promise<{ url: string; filename: string; absPath: string }> {
  // base64 may be data URL
  const cleaned = base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(cleaned, "base64");
  const ext = base64.startsWith("data:image/png") ? "png" : base64.startsWith("data:image/webp") ? "webp" : base64.startsWith("data:image/gif") ? "gif" : "jpg";
  return saveAssetBuffer(buffer, ext, category);
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(p: string): Promise<void> {
  try {
    await fs.unlink(p);
  } catch {
    /* ignore */
  }
}

// Convert a public url like /assets/foo.png to absolute filesystem path
export function urlToPath(url: string): string {
  if (url.startsWith("/assets/")) {
    return path.join(ASSETS_DIR, url.replace("/assets/", ""));
  }
  if (url.startsWith("/upload/")) {
    return path.join(UPLOAD_DIR, url.replace("/upload/", ""));
  }
  return url;
}

// Parse a data URL or fetch remote -> return base64 data url for VLM
export async function toDataUrl(input: string): Promise<string> {
  if (input.startsWith("data:")) return input;
  // fetch remote
  if (input.startsWith("http")) {
    const res = await fetch(input);
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }
  // local file
  const abs = urlToPath(input);
  const buf = await fs.readFile(abs);
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}
