"use client";

import { useSyncExternalStore } from "react";

// Tiny theme store: light / dark / system, applied as the `.dark` class on
// <html> (the CSS already defines both palettes). Persisted to localStorage
// under "theme"; a matchMedia listener re-applies while in system mode. The
// no-FOUC <head> script in the layout mirrors this read so the first paint is
// already the right palette.
export type Mode = "light" | "dark" | "system";

export const THEME_KEY = "theme";

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveDark(mode: Mode): boolean {
  return mode === "dark" || (mode === "system" && systemPrefersDark());
}

function read(): Mode {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(THEME_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

function apply(mode: Mode): void {
  document.documentElement.classList.toggle("dark", resolveDark(mode));
}

let mode: Mode = "system";
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

let mediaBound = false;
function bindMedia() {
  if (mediaBound || typeof window === "undefined") return;
  mediaBound = true;
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (mode === "system") apply(mode);
    });
}

export function setMode(next: Mode): void {
  mode = next;
  localStorage.setItem(THEME_KEY, next);
  apply(next);
  emit();
}

function subscribe(cb: () => void): () => void {
  if (listeners.size === 0) {
    // First subscriber syncs the in-memory mode with what the no-FOUC script
    // already applied, and binds the system listener.
    mode = read();
    bindMedia();
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useThemeMode(): Mode {
  return useSyncExternalStore(
    subscribe,
    () => mode,
    () => "system" as Mode,
  );
}
