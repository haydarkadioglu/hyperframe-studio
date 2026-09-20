"use client";

import { Cpu, AudioLines, Image as ImageIcon, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Heart className="size-3 text-rose-500" />
          <span>
            <span className="font-medium text-foreground">Hyperframe Studio</span>{" "}
            · AI destekli video üretimi
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <Badge icon={Cpu} label="LLM" />
          <Badge icon={AudioLines} label="TTS" />
          <Badge icon={ImageIcon} label="VLM" />
        </div>
      </div>
    </footer>
  );
}

function Badge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5">
      <Icon className="size-3 text-fuchsia-500" />
      <span className="font-medium">{label}</span>
    </span>
  );
}
