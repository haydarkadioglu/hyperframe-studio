# Hyperframe Studio

AI-powered video creator web app. Write a topic, upload a product photo, or paste a script — AI automatically generates the script, images, narration, and subtitles.

![Hyperframe Studio](public/logo.svg)

---

## What can it do?

- **4 modes**: Topic → Video, Product Showcase (upload photos), Your Own Script, YouTube Subtitled
- **Animated player**: every scene is motion (ken-burns, gradient, light effects)
- **AI providers**: Z.ai (built-in, no key needed), OpenAI DALL·E, Stability AI, Replicate FLUX
- **12 languages**: Turkish, English, German, Arabic (RTL), French, Spanish, Italian, Portuguese, Russian, Chinese, Japanese, Hindi
- **8 tones**: Professional, energetic, calm, dramatic, friendly, inspirational, news, documentary
- **Scene editor**: edit every scene after generation
- **Downloads**: SRT, VTT, audio file
- **Theming**: dark/light + 6 accent colors

---

## Setup

### Requirements

- [Node.js](https://nodejs.org) 18+ installed
- Internet connection (AI models run online)

### Step-by-step install

**1. Download**

Open your terminal and paste:

```bash
git clone https://github.com/haydarkadioglu/hyperframe-studio.git
cd hyperframe-studio
```

> Don't have Git? Install it from [git-scm.com/downloads](https://git-scm.com/downloads).

**2. Install packages**

```bash
npm install --legacy-peer-deps
```

Takes a few minutes. The `--legacy-peer-deps` flag is important — don't forget it.

**3. Create the database**

```bash
cp .env.example .env
npx prisma db push --accept-data-loss
```

This creates a `db/custom.db` database file.

**4. Run**

```bash
npm run dev
```

**5. Open in browser**

Go to: **http://localhost:3000**

Done! 🎉 Now hit "New Video" and start creating.

---

### Docker setup (alternative)

Don't want to install Node.js? Use [Docker](https://docs.docker.com/get-docker/):

```bash
git clone https://github.com/haydarkadioglu/hyperframe-studio.git
cd hyperframe-studio
docker compose up --build
```

Then go to **http://localhost:3000**.

To stop: `docker compose down`

---

## How to use

1. Click **New Video**
2. Pick a mode (Topic / Product / Script / YouTube)
3. Enter your content (write a topic, upload photos, or paste a script)
4. Choose language, tone, style, providers
5. Click **Generate Video** — wait a few minutes (you'll see a progress bar)
6. When done, watch in the player, edit scenes, download SRT/audio

---

## AI providers (optional)

Z.ai is built-in and needs no key. For higher-quality images, you can use your own API key:

1. Go to the **Settings** page
2. Find the provider card you want (OpenAI, Stability, Replicate)
3. Enter your API key and click **Save**
4. When generating a video, pick it as the "Image Provider"

Where to get keys:
- OpenAI: https://platform.openai.com/api-keys
- Stability: https://platform.stability.ai/api-keys
- Replicate: https://replicate.com/account/api-tokens

No key or invalid key? No problem — it automatically falls back to Z.ai, the video still generates.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Check code quality |
| `npx prisma db push` | Update database schema |
| `npx prisma generate` | Regenerate Prisma client |

---

## Troubleshooting

**Server won't start / port 3000 in use**
Something else is using port 3000. Close it or change the port in `docker-compose.yml`.

**Generation stuck**
Refresh the page. If still stuck, click "Try again" on the project card.

**"Unknown argument" Prisma error**
```bash
npx prisma generate
```
then restart the server.

**No audio**
Click the play button once (browsers block autoplay).

**Image generation is slow**
30–50 seconds per scene is normal. Watch the progress bar.

---

## License

For personal use. Provided as-is.

## Credits

Built with [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Prisma](https://www.prisma.io), and [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk).
