# Hyperframe Studio

AI ile video üreten web uygulaması. Konu yaz, ürün fotoğrafı yükle veya senaryo gir — AI senaryoyu, görselleri, seslendirmeyi ve altyazıları otomatik üretsin.

![Hyperframe Studio](public/logo.svg)

---

## Neler yapabilir?

- **4 mod**: Konu → Video, Ürün Tanıtımı (fotoğraf yükle), Kendi Senaryon, YouTube Altyazılı
- **Animasyonlu oynatıcı**: Her sahne hareketli (ken-burns, gradient, ışık efektleri)
- **AI sağlayıcıları**: Z.ai (yerleşik, anahtarsız), OpenAI DALL·E, Stability AI, Replicate FLUX
- **12 dil**: Türkçe, İngilizce, Almanca, Arapça (RTL), Fransızca, İspanyolca, İtalyanca, Portekizce, Rusça, Çince, Japonca, Hintçe
- **8 ton**: Profesyonel, enerjik, sakin, dramatik, samimi, ilham verici, haber, belgesel
- **Sahne editörü**: Ürettikten sonra her sahneyi düzenle
- **İndir**: SRT, VTT, ses dosyası
- **Tema**: Koyu/aydınlık + 6 renk teması

---

## Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org) 18+ yüklü olmalı (indirip kurun)
- İnternet bağlantısı (AI modelleri çevrimiçi çalışır)

### Adım adım kurulum

**1. İndir**

Terminal/komut satırı aç ve şunu yapıştır:

```bash
git clone https://github.com/haydarkadioglu/hyperframe-studio.git
cd hyperframe-studio
```

> Git yüklü değilse: [git-scm.com/downloads](https://git-scm.com/downloads) adresinden indir.

**2. Paketleri kur**

```bash
npm install --legacy-peer-deps
```

Birkaç dakika sürebilir. `--legacy-peer-deps` önemli, yazmayı unutma.

**3. Veritabanını oluştur**

```bash
cp .env.example .env
npx prisma db push --accept-data-loss
```

Bu, `db/custom.db` adında bir veritabanı dosyası oluşturur.

**4. Çalıştır**

```bash
npm run dev
```

**5. Tarayıcıda aç**

Şu adrese git: **http://localhost:3000**

Bitti! 🎉 Artık "New Video" butonuna basıp video üretmeye başlayabilirsin.

---

### Docker ile kurulum (alternatif)

Node.js kurmakla uğraşmak istemiyorsan [Docker](https://docs.docker.com/get-docker/) kullan:

```bash
git clone https://github.com/haydarkadioglu/hyperframe-studio.git
cd hyperframe-studio
docker compose up --build
```

Sonra **http://localhost:3000** adresine git.

Durdurmak için: `docker compose down`

---

## Nasıl kullanılır?

1. **New Video** butonuna bas
2. Mod seç (Konu / Ürün / Senaryo / YouTube)
3. İçeriğini gir (konu yaz, fotoğraf yükle veya senaryo yapıştır)
4. Dil, ton, stil, sağlayıcı seç
5. **Generate Video**'ya bas — birkaç dakika bekle (ilerleme çubuğunu göreceksin)
6. Tamamlanınca video oynatıcıda izle, sahneleri düzenle, SRT/ses indir

---

## AI sağlayıcıları (isteğe bağlı)

Z.ai yerleşik olarak gelir, anahtar gerekmez. Daha kaliteli görseller için kendi API anahtarını kullanabilirsin:

1. **Settings** sayfasına git
2. İstediğin sağlayıcının kartını bul (OpenAI, Stability, Replicate)
3. API anahtarını gir ve **Save**'e bas
4. Video üretirken "Image Provider" olarak onu seç

Anahtar nereden alınır:
- OpenAI: https://platform.openai.com/api-keys
- Stability: https://platform.stability.ai/api-keys
- Replicate: https://replicate.com/account/api-tokens

Anahtar yoksa veya yanlışsa sorun değil — otomatik Z.ai'e düşer, video yine üretilir.

---

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusunu başlat (port 3000) |
| `npm run build` | Production derlemesi yap |
| `npm start` | Production sunucusunu başlat |
| `npm run lint` | Kod kalitesini kontrol et |
| `npx prisma db push` | Veritabanı şemasını güncelle |
| `npx prisma generate` | Prisma client'ı yenile |

---

## Sorun mu var?

**Sunucu başlamıyor / port 3000 dolu**
Başka bir şey 3000 portunu kullanıyor olabilir. Kapat veya `docker-compose.yml`'den portu değiştir.

**Video üretimi takılı kaldı**
Sayfayı yenile. Hâlâ takılıysa, proje kartında "Tekrar dene" butonuna bas.

**"Unknown argument" Prisma hatası**
```bash
npx prisma generate
```
sonra sunucuyu yeniden başlat.

**Ses çıkmıyor**
Oynat düğmesine bir kez tıkla (tarayıcı otomatik oynatmayı engelliyor).

**Görsel üretimi yavaş**
Sahne başına 30-50 saniye normal. İlerleme çubuğundan takip edebilirsin.

---

## Lisans

Kişisel kullanım için. Olduğu gibi sunulur.

## Teşekkürler

[Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Prisma](https://www.prisma.io), ve [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) ile yapıldı.
