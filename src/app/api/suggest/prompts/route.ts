import { NextRequest, NextResponse } from "next/server";
import { getZai, safeParseJSON } from "@/lib/ai";

// POST /api/suggest/prompts
// body: { topic?: string, mode?: string, language?: string }
// Returns curated + AI-augmented prompt ideas to inspire the user.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const language = body.language || "tr";
    const mode = body.mode || "topic";
    const seed = (body.topic || "").trim();

    // Curated static ideas (fast, always available) by mode + language
    const curated = curatedIdeas(mode, language);

    // If user typed something, also try to generate AI refinements
    let aiIdeas: string[] = [];
    if (seed.length >= 3) {
      try {
        aiIdeas = await generatePromptIdeas(seed, mode, language);
      } catch (e) {
        console.error("AI prompt suggestion failed:", e);
      }
    }

    return NextResponse.json({
      curated,
      ai: aiIdeas,
      seed,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function curatedIdeas(mode: string, language: string): string[] {
  // Turkish + English base; other languages fall back to English curated + AI.
  const trByMode: Record<string, string[]> = {
    topic: [
      "Yapay zekânın gelecekte iş hayatını nasıl değiştireceği",
      "İklim değişikliğiyle bireysel mücadele yöntemleri",
      "Uzay keşiflerinin son 10 yıldaki en büyük atılımları",
      "Mindfulness meditasyonunun bilimsel faydaları",
      "Elektrikli araçların çevreye etkisi ve geleceği",
      "Kripto para teknolojisinin temelleri",
      "Sağlıklı uyku alışkanlıkları ve ipuçları",
      "5G teknolojisinin gündelik hayata etkileri",
    ],
    product: [
      "Akıllı kahve makinesi tanıtımı",
      "Kablosuz kulaklık ürün incelemesi",
      "Doğal cilt bakım serisi lansmanı",
      "Akıllı fitness bilekliği tanıtımı",
      "El yapımı deri cüzdan ürün gösterimi",
      "Modüler mobilya koleksiyonu",
    ],
    script: [
      "Yeni nesil online eğitim platformu için tanıtım metni",
      "Sürdürülebilir moda markası için marka hikâyesi",
      "Fintech startup için yatırımcı sunum senaryosu",
      "Mobil oyun lansmanı için hook metni",
      "Yemek teslimat uygulaması için kampanya metni",
    ],
    youtube: [
      "5 dakikada yapay zeka tarihi",
      "Günde 10 dakika İngilizce öğrenme tüyoları",
      "Evde minimum ekipmanla tam vücut antrenmanı",
      "Photoshop'ta 7 hayat kurtaran ipucu",
      "2026'da izlenmesi gereken 5 belgesel",
    ],
  };
  const enByMode: Record<string, string[]> = {
    topic: [
      "How AI will transform the future of work",
      "Simple daily habits to fight climate change",
      "The biggest space discoveries of the decade",
      "Science-backed benefits of mindfulness",
      "Electric vehicles and their environmental impact",
    ],
    product: [
      "Smart coffee maker product showcase",
      "Wireless earbuds product review",
      "Natural skincare line launch",
      "Smart fitness tracker introduction",
    ],
    script: [
      "Promo script for a next-gen online learning platform",
      "Brand story for a sustainable fashion label",
      "Investor pitch narrative for a fintech startup",
    ],
    youtube: [
      "Artificial intelligence history in 5 minutes",
      "Daily 10-minute English learning tips",
      "Full body workout with minimal equipment at home",
    ],
  };
  if (language === "tr") return trByMode[mode] || trByMode.topic;
  return enByMode[mode] || enByMode.topic;
}

async function generatePromptIdeas(
  seed: string,
  mode: string,
  language: string
): Promise<string[]> {
  const zai = await getZai();
  const langName =
    language === "tr"
      ? "Turkish"
      : language === "en"
      ? "English"
      : language;
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: "assistant",
        content: `You are a creative video ideation assistant. Given a seed topic, generate 5 short, compelling video topic ideas (each under 90 characters) in ${langName}. The ideas should be specific, engaging, and suitable for a ${mode} video. Return ONLY a JSON array of strings, no markdown fences, no commentary.`,
      },
      {
        role: "user",
        content: `Seed: "${seed}"\n\nGenerate 5 ${langName} video topic ideas inspired by this seed.`,
      },
    ],
    thinking: { type: "disabled" },
  });
  const raw = completion.choices?.[0]?.message?.content ?? "[]";
  const parsed = safeParseJSON(raw);
  if (Array.isArray(parsed)) {
    return parsed.filter((x) => typeof x === "string").slice(0, 5);
  }
  return [];
}
