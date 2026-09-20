import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings-store";
import type { ProviderSettings } from "@/lib/types";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { settings: ProviderSettings };
    if (!body.settings) {
      return NextResponse.json({ error: "settings required" }, { status: 400 });
    }
    await saveSettings(body.settings);
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
