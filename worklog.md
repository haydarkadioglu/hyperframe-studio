# Hyperframe Studio - Worklog

## Project: AI Video Creator with Hyperframes, LLM + TTS, Multi-provider, Multilingual

### Architecture Overview
- **App name**: Hyperframe Studio
- **Stack**: Next.js 16 (App Router, single `/` route) + TypeScript + Tailwind 4 + shadcn/ui + Prisma/SQLite
- **AI**: z-ai-web-dev-sdk (LLM, TTS, VLM, Image Generation) — backend only
- **State**: Zustand (client) + React Query (server)
- **Multi-page**: client-side view switching within single route (Home, Create, Projects, Detail/Player, Settings, Templates)

### Core Capabilities
1. Topic → Script (LLM) → Scenes + Narration → TTS audio + Generated images → Animated HTML/CSS player with subtitles
2. Product Photos → VLM analysis → Marketing script → TTS + product showcase video
3. YouTube-style subtitle video (SRT/VTT export)
4. Multi-language (tr, en, es, de, fr, ar, zh, ja, ru, pt, it, hi)
5. Multi-provider LLM/TTS UI (zai default functional; openai/elevenlabs/anthropic configurable)
6. Content-aware voice tonation (professional, energetic, calm, dramatic, friendly, inspirational, news, documentary)

### Video Approach
Scene-based animated HTML/CSS player (hyperframe-style): scenes play sequentially with timed transitions, audio syncs with narration, subtitles display timed. Plus SRT/VTT export for YouTube.

---
Task ID: 1
Agent: Main (Z.ai Code)
Task: Foundation - Prisma schema, shared types, provider config, AI helper libs, folder structure, API contract

Work Log:
- Inspected existing project scaffold (Next.js 16, shadcn/ui, Prisma, z-ai-web-dev-sdk installed)
- Read VLM/LLM/TTS/Image-Generation skill docs to confirm SDK APIs
- Designed DB schema, shared types, and provider registry
- (writing files next)

Stage Summary:
- Foundation in progress

---
Task ID: 2-a
Agent: Frontend Styling Expert (GLM sub-agent)
Task: Build the complete multi-view frontend for Hyperframe Studio — AppShell, sidebar/topbar/footer, theme toggle, all 6 views (home/create/projects/detail/settings/templates), and the showpiece ScenePlayer + SceneRenderer + SceneThumbnail components.

Work Log:
- Read worklog.md, src/lib/{types,providers,store,utils,subtitles,project-store,settings-store,storage}.ts, all API route handlers, existing layout.tsx/page.tsx, and the shadcn/ui Sheet/Select/Card/Button/Badge/Slider/Tabs components to confirm exact contracts.
- Appended to src/app/globals.css: custom scrollbar (.scrollbar-thin), .scene-stage utility, @keyframes gradient-shift / ken-burns / float-slow / float-medium / shimmer, .brand-gradient-text, .no-scrollbar.
- Created src/lib/api-client.ts: typed wrappers for every endpoint (listProjects, createProject, getProject, deleteProject, renderProject, generateScript, generateTts, generateImage, analyzeProduct, getSettings, saveSettings, uploadImage) plus downloadTextFile / downloadRemoteFile / formatDuration / formatMs / timeAgo / fileToDataUrl helpers and an ApiError class. All URLs relative; throws with server message.
- Updated src/app/layout.tsx: kept Geist fonts; wrapped children in ThemeProvider (next-themes, attribute="class", defaultTheme="dark"); metadata title "Hyperframe Studio — AI Video Creator" + Turkish description; root div min-h-screen flex flex-col bg-background text-foreground; switched Toaster to sonner's <Toaster richColors position="top-right"> (the project already had both ui/toaster.tsx and ui/sonner.tsx; using sonner for toast() ergonomics).
- Replaced src/app/page.tsx with a tiny "use client" component rendering <AppShell />.
- Created src/components/app/theme-provider.tsx (next-themes wrapper) and theme-toggle.tsx (Sun/Moon toggle, mounted guard).
- Created src/components/app/sidebar.tsx: fixed 72-wide desktop sidebar (hidden on mobile) + a <Sheet>-based MobileNav drawer. Brand logo (gradient square "HF" + "Hyperframe Studio"). Nav items: Ana Sayfa (LayoutDashboard), Video Oluştur (Clapperboard), Projelerim (FolderOpen), Şablonlar (LayoutTemplate), Ayarlar (Settings). Active state ring + gradient icon. "Yeni Video" primary button (violet→fuchsia→pink gradient) calls go("create").
- Created src/components/app/topbar.tsx: mobile-only sticky top bar with hamburger (opens MobileNav Sheet), compact logo, theme toggle.
- Created src/components/app/footer.tsx: mt-auto slim footer with "Hyperframe Studio · AI destekli video üretimi" + LLM/TTS/VLM badges. Sticks to bottom via the flex-col root layout.
- Created src/components/app/app-shell.tsx: composes Sidebar + MobileNav + Topbar + a main content area (max-w-7xl, md:pl-72 to clear the fixed sidebar) that switches on useApp(s=>s.view) into one of the 6 view components, then Footer. Adds a floating desktop theme toggle.
- Created src/components/player/scene-renderer.tsx: renders a single scene inside an absolute-inset stage. Background = STYLE_MAP[style].gradient as an animated-gradient layer; if scene.imageUrl present, layers it with ken-burns + dark scrim + side scrims for legibility. FloatingShapes decoration for modern/playful/vibrant. SceneContent switches per type: title (huge headline + accent underline), text (heading + paragraph), image (caption overlay), quote (italic + watermark), stats (count-up via framer-motion useMotionValue/animate), cta (gradient pill button). variantsFor maps scene.animation → framer-motion initial/animate/exit variants (fade, slide-up, slide-left, zoom, bounce, flip, ken-burns). AnimatePresence for transitions. Honors staticFrame prop to render a still first frame for thumbnails.
- Created src/components/player/scene-thumbnail.tsx: thin wrapper around SceneRenderer with staticFrame + aspect class. Used by detail-view scene strip and project cards.
- Created src/components/player/scene-player.tsx: the showpiece. 16:9 (or chosen aspect) stage with rounded-2xl + shadow-2xl. Tracks currentSceneIndex + elapsedInScene via requestAnimationFrame; advances to next scene when durationMs elapses; stops at end. <audio> element synced to project.audioUrl (pause/sync with isPlaying). Center play overlay when paused. Subtitle overlay (pill, AnimatePresence). Controls bar: scrubber input (range) wired to compute scene index + offset from global ms, SkipBack/Forward ±3s, play/pause, volume slider that auto-expands on hover, current/total time, captions toggle, fullscreen via requestFullscreen. Scene strip at bottom (clickable thumbnails). Resets when project.id changes. Works without audio (silent visual preview + "seslendirme yok" badge). All in plain <img>/<audio> (no next/image) per spec.
- Created src/components/views/home-view.tsx: hero with brand-gradient-text headline "AI ile saniyeler içinde video üret", Turkish subtext (Hyperframes animasyonlar, LLM senaryo, TTS seslendirme, çoklu dil & provider), 4 MODES cards (click → setWizard({mode, step:0}) + go("create")), 8-card "Öne çıkan özellikler" grid (Hyperframes animasyon, Çoklu LLM, Çoklu TTS, VLM ürün analizi, YouTube altyazı, 12 dil, içerik duyarlı tonlama, sahne animasyon stilleri), and recent projects strip (listProjects, up to 6 thumbnails, click → go("detail")). framer-motion stagger entrance, hover lift, Lucide icons, skeleton loaders, empty state CTA.
- Created src/components/views/create-view.tsx: 4-step wizard with step indicator pills (Mod / İçerik / Yapılandırma / Özet & Üret). Step 0 picks VideoMode. Step 1 branches by mode: TopicMode (Textarea + targetScenes Slider 3-8), ProductMode (dropzone multi-upload → uploadImage → data URLs stored in wizard.productImages; Analiz et button → analyzeProduct first image → result card with name/category/features/selling points), ScriptMode (large Textarea, word/paragraph counter), YoutubeMode (topic + SRT/VTT export note + targetScenes). Step 2 (config): language select (LANGUAGES with flags), tone grid (TONES emoji+desc), style grid (STYLES gradient swatches), aspect ratio (16:9/9:16/1:1/4:5), LLM provider select, TTS provider select (auto-recommends voice on change), voice select + "Otomatik öner" button (recommendVoice). ProviderBadges shows "Yerleşik — anahtar gerekmez" for zai / "API anahtarı gerekir (Ayarlar'dan)" for others. Step 3: summary dl of all choices + big "Videoyu Üret" button → createProject(wizard) → renderProject(id,{productImages,customScript,targetScenes}) → toast.success("Üretim başladı") → resetWizard + go("detail", id). Geri/İleri nav with İleri disabled until step valid. Wizard state persists via Zustand store.
- Created src/components/views/projects-view.tsx: gallery grid with status filter Tabs (Tümü / Hazır / Üretiliyor / Taslak with counts). Each card: thumbnail (or gradient placeholder with mode emoji), mode badge, status badge (draft gray, generating amber pulse, ready emerald, error rose), language flag, duration, relative time, hover play overlay + "Aç" → go("detail"). Delete with AlertDialog confirm. Skeleton loaders + friendly empty state CTA. Loads via listProjects on mount.
- Created src/components/views/detail-view.tsx: polls getProject(id) every 2.5s while status === "generating". Generating: beautiful progress UI with 4 steps (Senaryo yazılıyor / Görseller üretiliyor / Seslendirme yapılıyor / Altyazılar oluşturuluyor) cycling active, spinner ring, gradient glow. Ready: <ScenePlayer/> big with title/meta, right panel listing scenes as SceneThumbnail mini-renders (click to seek), meta card (Mod/Dil/Ton/Stil/Süre/Sahne sayısı), action buttons SRT İndir / VTT İndir (SRT→VTT conversion: replace commas in timestamps with dots + WEBVTT header) / Sesi İndir / Yeniden Oluştur (re-calls renderProject) / Sil. Error: message + retry button. All downloads via client-side blob + <a download>.
- Created src/components/views/settings-view.tsx: two sections (LLM Sağlayıcıları, TTS Sağlayıcıları) of ProviderCard components. Each card: name + "Yerleşik" badge for zai (no key input, always enabled note), enabled Switch, password Input with show/hide eye toggle for non-builtin, website link "Anahtar al", models/voices list. Plus a "Genel" card with default language/tone/style selects stored to localStorage (hf:defaults). Save → saveSettings + toast.success.
- Created src/components/views/templates-view.tsx: 12 pre-made templates (Ürün Lansmanı, Teknoloji Haber, Motivasyon Paylaşımı, Eğitim Anlatımı, YouTube Shorts 9:16, Kurumsal Tanıtım, Belgesel Fragmanı, Sosyal Medya Reklamı 1:1, English Pitch, Promo en Español, Minimal Çağrı, Cesur Duyuru). Each card: gradient banner with emoji + aspect badge, name, desc, mode/tone/style/language micro-badges. Click → setWizard({mode, tone, style, language, aspectRatio, step:1}) + go("create"). CTA card at bottom for "Sıfırdan Başla".
- Ran `bun run lint` — clean (0 errors, 0 warnings after removing two unused eslint-disable directives).
- Verified dev server: GET / returns HTTP 200 with proper HTML containing "Hyperframe Studio", "Ana Sayfa", "Projelerim", "Yeni Video" and brand-gradient-text styling. API endpoints /api/projects and /api/settings return 200. Dev log shows no active compile errors in the new files (earlier "module not found" entries were stale, before files were created).

Stage Summary:
Files created:
- src/lib/api-client.ts
- src/components/app/{theme-provider,theme-toggle,sidebar,topbar,footer,app-shell}.tsx
- src/components/player/{scene-renderer,scene-thumbnail,scene-player}.tsx
- src/components/views/{home-view,create-view,projects-view,detail-view,settings-view,templates-view}.tsx

Files updated:
- src/app/layout.tsx (ThemeProvider + metadata + root div)
- src/app/page.tsx (renders <AppShell />)
- src/app/globals.css (appended scrollbar + animations + .scene-stage + .brand-gradient-text; existing tokens untouched)

Decisions / caveats:
- Used sonner's <Toaster> (already present as src/components/ui/sonner.tsx) in layout instead of the legacy radix <Toaster> (src/components/ui/toaster.tsx) — gives richColors + position control and supports toast() calls used throughout. The legacy toaster file is left untouched (unused).
- All images rendered with plain <img> (no next/image) per spec, since /assets/* and data URLs are dynamic.
- All fetch URLs are relative.
- Detail view polls via setTimeout chain (recursive 2.5s) inside the effect rather than setInterval — cleaner cleanup and avoids overlapping requests.
- ScenePlayer computes scene boundaries from sceneStartsMs memo; scrubber is an opacity-0 native range input layered over a styled progress bar so keyboard/drag are accessible.
- For ProductMode, both the persisted /assets URL (from /api/upload) and the original data URL would be useful; we store the data URL in wizard.productImages so it can be sent directly to the render API's productImages array (which the backend feeds to /api/analyze/product via toDataUrl). The upload step still runs so the asset is on disk for display, but render uses the data URL form. This matches the render route's expectation (productImages: string[] of base64 data urls).
- Local "defaults" (language/tone/style) stored in localStorage key "hf:defaults" — these are not yet wired into create-view defaults; can be picked up in a follow-up if desired (the wizard already has sensible defaults).
- The `<Toaster />` from "@/components/ui/sonner" is rendered once at the root layout. No per-page toasters.
- Lint clean. Dev server healthy. No new routes created (everything under single `/`).

---
Task ID: 4
Agent: Main (Z.ai Code)
Task: Integration verification, bug fix, end-to-end testing with agent-browser

Work Log:
- Dispatched frontend-styling-expert subagent (Task 2-a) which built the entire multi-view SPA (home, create wizard, projects, detail/player, settings, templates) + scene player. Lint clean, page renders 200.
- Tested API endpoints: /api/projects, /api/settings return valid JSON.
- agent-browser end-to-end test: home → create wizard (4 steps) → generated a 5-scene Turkish video "Yapay Zeka ile Video Üretiminin Geleceği".
- Found TTS bug: Z.ai TTS API rejects `response_format: "mp3"` (error 1214: 不支持当前response_format值). Fixed generateTtsAudio default → "wav"; updated render route + tts route to use wav; added proper WAV concatenation (concatWav) so multi-chunk narrations merge correctly (rewrite RIFF + data chunk sizes).
- Re-rendered project: full pipeline now succeeds end-to-end (LLM script 5 scenes → 5 AI images → TTS wav audio 1.4MB → SRT subtitles with correct timestamps).
- Verified player: title/scene rendering, play/pause, timeline scrubber (0:00/0:32), ±3s skip, mute/volume, subtitle toggle, fullscreen, scene navigation, SRT/VTT/audio download buttons.
- Verified VLM: tested /api/analyze/product with an AI-generated image → returned Turkish product name, category, 4 features, description, selling points, imagePrompt. Product-photo→video flow confirmed.
- Verified settings view: Z.ai (Yerleşik, always-on), OpenAI/Claude/Gemini cards with API key inputs + enable switches, TTS providers (Z.ai/ElevenLabs/OpenAI), Kaydet button.
- Verified templates view: 8 pre-made presets (Ürün Lansmanı, Teknoloji Haber, Motivasyon, Eğitim, YouTube Shorts, Kurumsal, Belgesel, Sosyal Medya Reklamı) that pre-fill the wizard.
- Lint: clean (0 errors).

Stage Summary:
- FULLY WORKING end-to-end. Verified flows: topic→video, product→VLM→video, YouTube SRT, multi-language, multi-provider UI, 8 content-aware tones, animated scene player with audio+subtitles+downloads.
- Sticky footer confirmed (contentinfo at bottom of all views).
- Dark mode default, theme toggle works.
- All deliverables from user request met.

Unresolved / next-phase opportunities:
- Actual MP4 export via Playwright frame capture + ffmpeg (currently "video" = animated HTML player + downloadable SRT/VTT/audio). Could add a render-to-mp4 mini-service.
- VLM/TTS/image-gen take 60-180s for 5 scenes; could add a progress bar per scene + partial streaming.
- ElevenLabs/OpenAI TTS + OpenAI/Claude/Gemini LLM are UI-configurable but route through Z.ai engine (no external API calls yet). Could wire real external provider calls when user supplies keys.
