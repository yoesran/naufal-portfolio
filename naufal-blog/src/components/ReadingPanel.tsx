"use client";

import { useState } from "react";
import { Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Labels = {
  label: string;
  font: string;
  size: string;
  background: string;
  reset: string;
  fontSans: string;
  fontSerif: string;
  fontMono: string;
  bgDefault: string;
  bgPaper: string;
  bgSepia: string;
  bgInk: string;
};

type Font = "sans" | "serif" | "mono";
type Bg = "default" | "paper" | "sepia" | "ink";

const FONT_STACKS: Record<Font, string> = {
  sans: "var(--font-sans)",
  serif: 'Georgia, Cambria, "Times New Roman", serif',
  mono: "var(--font-mono)",
};

const MIN_SIZE = 15;
const MAX_SIZE = 22;
const DEFAULT_SIZE = 17;

// Prefs live on <html> so the pre-paint script can apply them before the reading
// container exists; reading.css surfaces them on #reading + .post-prose.
function el(): HTMLElement {
  return document.documentElement;
}

// Lazy initializers read what the pre-paint script already applied (storage).
// Guarded for the prerender; the popover is closed initially, so reading
// different values on the client causes no hydration mismatch.
function initFont(): Font {
  if (typeof window === "undefined") return "sans";
  const f = localStorage.getItem("reading.font");
  return f === "serif" || f === "mono" || f === "sans" ? f : "sans";
}
function initSize(): number {
  if (typeof window === "undefined") return DEFAULT_SIZE;
  const s = Number(localStorage.getItem("reading.size"));
  return s >= MIN_SIZE && s <= MAX_SIZE ? s : DEFAULT_SIZE;
}
function initBg(): Bg {
  if (typeof window === "undefined") return "default";
  const b = localStorage.getItem("reading.bg");
  return b === "paper" || b === "sepia" || b === "ink" ? b : "default";
}

export function ReadingPanel({ labels }: { labels: Labels }) {
  const [font, setFont] = useState<Font>(initFont);
  const [size, setSize] = useState(initSize);
  const [bg, setBg] = useState<Bg>(initBg);

  function applyFont(f: Font) {
    setFont(f);
    localStorage.setItem("reading.font", f);
    el().style.setProperty("--reading-font", FONT_STACKS[f]);
  }
  function applySize(n: number) {
    setSize(n);
    localStorage.setItem("reading.size", String(n));
    el().style.setProperty("--reading-size", `${n}px`);
  }
  function applyBg(b: Bg) {
    setBg(b);
    localStorage.setItem("reading.bg", b);
    if (b === "default") el().removeAttribute("data-reading-bg");
    else el().setAttribute("data-reading-bg", b);
  }
  function reset() {
    applyFont("sans");
    applySize(DEFAULT_SIZE);
    applyBg("default");
  }

  const fonts: [Font, string][] = [
    ["sans", labels.fontSans],
    ["serif", labels.fontSerif],
    ["mono", labels.fontMono],
  ];
  const bgs: [Bg, string][] = [
    ["default", labels.bgDefault],
    ["paper", labels.bgPaper],
    ["sepia", labels.bgSepia],
    ["ink", labels.bgInk],
  ];

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="font-mono">
            <Type />
            {labels.label}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64 gap-3.5">
        <Group label={labels.font}>
          <ToggleGroup
            value={[font]}
            onValueChange={(next: string[]) => {
              const v = next[0];
              if (v) applyFont(v as Font);
            }}
            spacing={0}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {fonts.map(([value, text]) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="text-muted-foreground data-[state=on]:text-foreground flex-1"
                style={{ fontFamily: FONT_STACKS[value] }}
              >
                {text}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Group>

        <Group label={`${labels.size} · ${size}px`}>
          <Slider
            min={MIN_SIZE}
            max={MAX_SIZE}
            value={[size]}
            onValueChange={(v) => applySize(Array.isArray(v) ? v[0] : v)}
            aria-label={labels.size}
          />
        </Group>

        <Group label={labels.background}>
          <ToggleGroup
            value={[bg]}
            onValueChange={(next: string[]) => {
              const v = next[0];
              if (v) applyBg(v as Bg);
            }}
            spacing={0}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {bgs.map(([value, text]) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="text-muted-foreground data-[state=on]:text-foreground flex-1 px-1"
              >
                {text}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Group>

        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="text-muted-foreground self-start font-mono"
        >
          {labels.reset}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground font-mono text-[0.7rem] tracking-wide uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}
