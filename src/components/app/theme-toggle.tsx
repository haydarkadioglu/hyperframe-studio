"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Tema değiştir"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="size-9 rounded-full"
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4 text-amber-300" />
        ) : (
          <Moon className="size-4 text-violet-600" />
        )
      ) : (
        <Sun className="size-4" />
      )}
    </Button>
  );
}
