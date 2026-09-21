# Hyperframe Studio

**AI-powered video creator** — turn a topic, a script, or a product photo into an animated, narrated, subtitled video in minutes. Built with Next.js, the Z.ai web-dev SDK (LLM + TTS + VLM + image generation), and a polished scene-based animated player.

![Hyperframe Studio](public/logo.svg)

---

## ✨ Features

- **4 creation modes**
  - **Topic → Video** — write a topic, AI writes the script, generates images, narrates it, and builds subtitles.
  - **Product Showcase** — upload product photos, VLM analyzes them, a promo video is generated.
  - **Your Own Script** — paste your text, AI splits it into scenes and converts it to a video.
  - **YouTube Subtitled** — SRT/VTT-subtitled, YouTube-ready video.
- **Hyperframe animated player** — scene-by-scene player with continuous ken-burns image motion, animated gradient backgrounds, drifting light streaks, floating shapes, and breathing content. Never a static "photo".
- **Multi-provider UI** — Z.ai GLM (built-in, works out of the box), OpenAI GPT, Anthropic Claude, Google Gemini for LLM; Z.ai TTS, ElevenLabs, OpenAI TTS for narration.
- **12 video content languages** — Turkish, English, Spanish, German, French, Italian, Portuguese, Russian, Arabic, Chinese, Japanese, Hindi.
- **8 content-aware tones** — professional, energetic, calm, dramatic, friendly, inspirational, news, documentary. Each recommends a matching voice + speed.
- **8 visual styles** — modern, cinematic, playful, minimal, corporate, vibrant, elegant, bold.
- **Per-scene generation progress** — real-time progress bar (% per phase) + per-scene thumbnail strip that fills in as images generate.
- **Scene editor** — after generation, edit every scene: type, animation, text, narration, subtitle, image prompt (+ regenerate), duration, accent color. Saving rebuilds SRT subtitles automatically.
- **Share / embed dialog** — shareable link, iframe embed code, QR code, 8 social-share buttons, quick downloads.
- **Dashboard** — KPI cards, 14-day activity chart, mode/language/provider distributions (recharts).
- **12 UI interface languages** — English (default), Türkçe, Deutsch, Français, Español, Italiano, Português, العربية (RTL), Русский, 中文, 日本語, हिन्दी.
- **Dark/light mode** + 6 accent color themes.
- **Player keyboard shortcuts** — space (play/pause), ←/→ (3s seek), j/l (10s seek), m (mute), f (fullscreen), c (captions), r (loop), ,/. (speed), 0-9 (seek to N/10).
- **Playback speed** (0.5x–2x) + loop.
- **SRT / VTT / audio downloads**.

---

## 🧱 Tech stack

| Layer | Tech |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, single `/` route) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com) (New York) + Lucide icons |
| Animations | Framer Motion |
| Charts | Recharts |
| State | Zustand (client) + React Query (server) |
| Database | Prisma ORM + SQLite |
| AI | [`z-ai-web-dev-sdk`](https://www.npmjs.com/package/z-ai-web-dev-sdk) — LLM, TTS, VLM, image generation (server-side only) |
| Toasts | Sonner |
| Themes | next-themes |

---

## 🚀 Getting started

You can run Hyperframe Studio in **two ways**: directly with Node.js + npm, or with Docker.

### Option A — Local development (Node.js + npm)

#### Prerequisites

- **Node.js 18+** (v20 LTS or newer recommended)
- **npm 9+** (comes with Node.js)
- **Git**
- Internet connection (the Z.ai SDK calls hosted AI models; no API key required for the built-in provider)

#### 1. Clone

```bash
git clone https://github.com/haydarkadioglu/hyperframe-studio.git
cd hyperframe-studio
```

#### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag avoids peer-dependency resolution conflicts with the Z.ai SDK and some Radix packages.

#### 3. Configure environment

The app reads a single env var: `DATABASE_URL` (a SQLite file path). A `.env` is included by default:

```bash
# .env
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

If you cloned to a different path, update it. Or copy the template and adjust:

```bash
cp .env.example .env
# then edit .env to point to your desired db location
```

No API keys are required — the built-in Z.ai provider (GLM for LLM, Z.ai TTS for narration, GLM-4.6v for VLM, image generation) works out of the box. Optional external providers (OpenAI, Anthropic, Gemini, ElevenLabs, OpenAI TTS) can be configured in-app under **Settings** once you have their API keys.

#### 4. Set up the database

Push the Prisma schema to create the SQLite database and tables:

```bash
npx prisma db push --accept-data-loss
```

This creates `db/custom.db` and all tables (`VideoProject`, `Asset`, `ProviderSetting`, `AppSetting`).

#### 5. Run the dev server

```bash
npm run dev
```

The app starts on **http://localhost:3000**.

#### 6. Open it

Open `http://localhost:3000` in your browser. You'll land on the home page (English by default). Use the **🌐 globe icon** (bottom-right) to switch the UI language. Click **New Video** to start creating.

---

### Option B — Docker (one command, no Node.js needed)

#### Prerequisites

- **[Docker](https://docs.docker.com/get-docker/)** (v20+)
- **Docker Compose** v2 (included with Docker Desktop; on Linux install `docker-compose-plugin`)

#### 1. Clone

```bash
git clone https://github.com/haydarkadioglu/hyperframe-studio.git
cd hyperframe-studio
```

#### 2. Build & run

```bash
docker compose up --build
```

That's it. The first build takes a few minutes (installs deps, builds Next.js, generates Prisma client). Subsequent runs are instant (cached layers).

The app is available at **http://localhost:3000**.

#### Run detached (background)

```bash
docker compose up -d --build
```

#### Stop

```bash
docker compose down
```

#### What Docker does for you

The `Dockerfile` is a **3-stage multi-stage build**:
1. **deps** — installs all dependencies (cached).
2. **builder** — runs `prisma generate` + `npm run build` (produces a Next.js standalone bundle).
3. **runner** — minimal production image (~150 MB) with only the standalone server + static assets + prisma schema. Runs as a non-root user.

On startup, the container runs `npx prisma db push` (creates the SQLite schema) then `node server.js` (Next.js standalone production server).

#### Persistent data

Two Docker named volumes keep your data across container recreations:

| Volume | Mount path | Contents |
|---|---|---|
| `hyperframe-db` | `/app/db` | SQLite database (`custom.db`) — all your projects |
| `hyperframe-assets` | `/app/public/assets` | Generated AI images + TTS audio files |
| `hyperframe-uploads` | `/app/upload` | User-uploaded product photos |

To **wipe all data** and start fresh:

```bash
docker compose down -v
```

#### View logs

```bash
docker compose logs -f
```

#### Rebuild after code changes

```bash
docker compose up --build
```

#### Custom port

Edit `docker-compose.yml` and change `"3000:3000"` to e.g. `"8080:3000"` to expose the app on port 8080.

---

## 📜 Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server (port 3000) with Turbopack |
| `npm run build` | Production build (standalone output) |
| `npm start` | Start the production server (after `npm run build`) |
| `npm run lint` | Run ESLint |
| `npx prisma db push` | Push the Prisma schema to the SQLite database |
| `npx prisma generate` | Regenerate the Prisma Client |
| `npx prisma migrate dev` | Run Prisma migrations (dev) |
| `npx prisma migrate reset` | Reset the database (destructive) |

---

## 🎬 How video generation works

When you click **Generate Video**, the app runs this pipeline in the background:

1. **(Product mode only) VLM analysis** — uploaded product photos are analyzed by `glm-4.6v` to extract name, category, features, selling points, and a generated image prompt.
2. **LLM script** — `glm-4.6` writes a structured scene plan (JSON) with on-screen text, narration, subtitle, image prompt, animation, accent color, and duration per scene. All user-facing text is in the chosen video language; image prompts are in English.
3. **Image generation** — each scene's image prompt is sent to the image-generation model; the resulting PNG is saved to `public/assets/`. The scene is persisted after each image so you see progress incrementally.
4. **TTS narration** — the full narration is concatenated and converted to a single WAV file via Z.ai TTS, using a voice + speed recommended for the chosen tone. Long text is split into ≤900-char chunks and the WAV files are merged (RIFF/data chunk sizes rewritten).
5. **SRT subtitles** — built from scene durations, with correct `00:00:00,000 --> 00:00:00,000` timestamps.
6. **Ready** — the project status flips to `ready`, and the animated player + scene editor + downloads become available.

Throughout, a **progress** object (`{ step, sceneIdx, total, done, message }`) is written to the database at each phase, and the detail view polls `/api/projects/:id` every 2.5s to render a live progress bar + per-scene thumbnail strip.

> **Note:** image generation is the slowest step (~30–48s per scene × N scenes). This is expected for hosted diffusion models.

---

## 🗂️ Project structure

```
.
├── prisma/
│   └── schema.prisma            # VideoProject, Asset, ProviderSetting, AppSetting models
├── public/
│   └── assets/                  # generated AI images + TTS audio (gitignored)
├── src/
│   ├── app/
│   │   ├── api/                 # API routes (projects, render, generate/{script,tts,image}, analyze/product, stats, settings, upload, suggest/prompts)
│   │   ├── globals.css          # Tailwind tokens + animations (gradient-shift, ken-burns, streaks, orbs, accent themes, RTL)
│   │   ├── layout.tsx           # Root layout, fonts, ThemeProvider, locale init script
│   │   └── page.tsx             # Single route — renders <AppShell />
│   ├── components/
│   │   ├── app/                 # AppShell, Sidebar, Topbar, Footer, ThemeToggle, LanguageSwitcher, AccentPicker, ShareDialog
│   │   ├── player/              # ScenePlayer, SceneRenderer, SceneThumbnail
│   │   ├── views/               # HomeView, CreateView (4-step wizard), ProjectsView, DetailView, SettingsView, TemplatesView, DashboardView
│   │   └── ui/                  # shadcn/ui components
│   └── lib/
│       ├── ai.ts                # Z.ai SDK wrappers: generateScript, generateImage, generateTtsAudio, analyzeProductImage
│       ├── api-client.ts        # Typed fetch wrappers for all API routes
│       ├── i18n.ts              # UI dictionary (en/tr/de/ar + 8 partial locales)
│       ├── use-locale.ts        # useLocale() hook (t(), locale, setLocale, isRTL)
│       ├── providers.ts         # LANGUAGES, TONES, STYLES, MODES, LLM/TTS_PROVIDERS, voices
│       ├── project-store.ts     # Prisma CRUD: getProject, listProjects, createProjectRow, updateProject, deleteProject
│       ├── settings-store.ts    # Provider settings persistence
│       ├── storage.ts           # saveAssetBuffer, saveBase64Image, toDataUrl
│       ├── subtitles.ts         # buildSRT, buildVTT, scene JSON serialization
│       ├── store.ts             # Zustand store (view navigation, wizard state)
│       ├── types.ts             # Shared TypeScript types (VideoProject, Scene, GenerationProgress, ...)
│       └── db.ts                # Prisma Client singleton
├── Dockerfile                   # Multi-stage production build
├── docker-compose.yml           # One-command run with persistent volumes
├── .dockerignore
├── .env                         # DATABASE_URL (gitignored)
├── .env.example                 # template
├── .gitignore
└── package.json
```

---

## 🔌 API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create a draft project |
| `GET` | `/api/projects/:id` | Get a project (includes stale "generating" detection) |
| `PATCH` | `/api/projects/:id` | Update title/tone/style/scenes/status/errorMessage (scenes → rebuilds SRT) |
| `DELETE` | `/api/projects/:id` | Delete a project + its assets |
| `POST` | `/api/projects/:id/render` | Kick off background generation (script → images → TTS → SRT) |
| `POST` | `/api/projects/:id/duplicate` | Clone a project (status → draft, outputs cleared) |
| `POST` | `/api/generate/script` | Generate a scene plan from a topic (LLM) |
| `POST` | `/api/generate/tts` | Generate a WAV audio file from text (TTS) |
| `POST` | `/api/generate/image` | Generate an image from a prompt |
| `POST` | `/api/analyze/product` | Analyze a product image (VLM) |
| `POST` | `/api/suggest/prompts` | Curated + AI-generated topic ideas |
| `GET` / `POST` | `/api/settings` | Read/save provider settings + API keys |
| `POST` | `/api/upload` | Upload an image (base64 → `/assets/`) |
| `GET` | `/api/stats` | Dashboard statistics (totals, distributions, 14-day activity) |

---

## 🌍 Internationalization

The app has **two independent language settings**:

1. **UI interface language** — the language of buttons, labels, menus. Set via the 🌐 globe icon. Stored in `localStorage["hf:ui-locale"]`. Sets `<html lang>` and `<html dir>` (RTL for Arabic). Fully translated for `en`/`tr`/`de`/`ar`; `fr`/`es`/`it`/`pt`/`ru`/`zh`/`ja`/`hi` fall back to English (translations to be completed progressively).

2. **Video content language** — the language the LLM writes the script in and the TTS narrates in. Chosen in the **Create** wizard (step 2). 12 options: Turkish, English, Spanish, German, French, Italian, Portuguese, Russian, Arabic, Chinese, Japanese, Hindi.

So you can have the UI in English while generating a video in Turkish — they don't affect each other.

---

## 🎨 Theming

- **Dark/light mode** via `next-themes` (dark is default).
- **6 accent color themes** — violet (default), emerald, amber, rose, cyan, fuchsia. Applied via `data-accent` attribute on `<html>` + CSS variables (`--accent-1/2/3`). Persisted to `localStorage["hf:accent"]`.

---

## ❓ Troubleshooting

**The dev server won't start / port 3000 in use**
Make sure nothing else is on port 3000. The project is configured to always use port 3000.

**`npm install` fails with peer-dependency errors**
Use the legacy resolver: `npm install --legacy-peer-deps`.

**Generation stuck on "Generating..." forever**
The dev server's hot-reload can kill an in-flight background job when you edit a file. The app detects this: if a project's status is "generating" but no job is actually running (and `updatedAt` is older than 90s), it auto-marks the project as "error" with a retry option. Click **Try again** to re-render.

**Prisma error: "Unknown argument `progress`" (or similar)**
The Prisma Client needs regenerating after a schema change:
```bash
npx prisma generate
```
Then restart the dev server (`npm run dev`).

**No audio in the player**
Browser autoplay policy may block audio until you interact. Click the **Play** button (or press space). Audio is WAV format (the Z.ai TTS API in this env rejects MP3).

**Image generation is slow**
~30–48s per scene is normal for hosted diffusion models. The progress bar and per-scene thumbnail strip show exactly where it is.

**Docker: build fails on `npm install`**
Make sure you're using the `--legacy-peer-deps` resolver (already baked into the Dockerfile). If you have a local `node_modules` folder, ensure it's excluded by `.dockerignore` (it is by default).

**Docker: can't access port 3000**
Check the container is running: `docker compose ps`. View logs: `docker compose logs -f`. If another process uses port 3000, map to a different host port in `docker-compose.yml` (`"8080:3000"`).

---

## 📝 License

This project is provided as-is for demonstration purposes.

---

## 🙏 Credits

Built with [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Framer Motion](https://www.framer.com/motion/), [Prisma](https://www.prisma.io), [Recharts](https://recharts.org), [Lucide](https://lucide.dev), and the [`z-ai-web-dev-sdk`](https://www.npmjs.com/package/z-ai-web-dev-sdk).
