import { db } from "./db";
import type { ProviderSettings } from "./types";

const APP_SETTINGS_KEY = "app:settings";

const DEFAULTS: ProviderSettings = {
  zai: { enabled: true },
  openai: { enabled: false },
  anthropic: { enabled: false },
  gemini: { enabled: false },
  elevenlabs: { enabled: false },
  "openai-tts": { enabled: false },
};

export async function getSettings(): Promise<ProviderSettings> {
  const row = await db.appSetting.findUnique({ where: { id: APP_SETTINGS_KEY } });
  if (!row) return { ...DEFAULTS };
  try {
    const parsed = JSON.parse(row.value) as ProviderSettings;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(settings: ProviderSettings): Promise<void> {
  const merged = { ...DEFAULTS, ...settings };
  await db.appSetting.upsert({
    where: { id: APP_SETTINGS_KEY },
    create: { id: APP_SETTINGS_KEY, value: JSON.stringify(merged) },
    update: { value: JSON.stringify(merged) },
  });
}

export async function getProviderKey(providerId: string): Promise<string | undefined> {
  const settings = await getSettings();
  return settings[providerId]?.apiKey;
}
