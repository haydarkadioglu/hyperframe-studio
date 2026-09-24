import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/app/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hyperframe Studio — AI Video Creator",
  description:
    "AI destekli video üretim stüdyosu. LLM senaryo, çoklu TTS, VLM ile ürün analizi, Hyperframes animasyonları ve YouTube uyumlu altyazılar ile saniyeler içinde profesyonel video üretin.",
  keywords: [
    "AI video",
    "Hyperframe",
    "LLM",
    "TTS",
    "VLM",
    "video üretimi",
    "altyazı",
    "SRT",
    "Next.js",
  ],
  authors: [{ name: "Hyperframe Studio" }],
  openGraph: {
    title: "Hyperframe Studio — AI Video Creator",
    description:
      "AI ile saniyeler içinde video üret: LLM senaryo, TTS seslendirme, çoklu dil & provider.",
    siteName: "Hyperframe Studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyperframe Studio",
    description: "AI destekli video üretim stüdyosu.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Initialize UI locale before hydration to avoid flash + set RTL */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var codes=['en','tr','de','ar','fr','es','it','pt','ru','zh','ja','hi'];var s=localStorage.getItem('hf:ui-locale');var l=s&&codes.indexOf(s)>=0?s:'en';document.documentElement.lang=l;document.documentElement.dir=(l==='ar')?'rtl':'ltr';}catch(e){document.documentElement.lang='en';document.documentElement.dir='ltr';}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            {children}
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
