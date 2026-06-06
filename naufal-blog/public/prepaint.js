// Runs before first paint (referenced beforeInteractive from the layout). Applies
// the stored theme + reading prefs to <html> so the first frame is correct.
// External file (not an inline <script>) so React 19 doesn't warn when the
// layout re-renders during client navigation. Mirrors src/lib/theme.ts and
// src/components/ReadingPanel.tsx.
(function () {
  try {
    var de = document.documentElement;
    // <html> is rendered once by the root layout with a default lang; set the
    // real one from the URL so screen readers / JS crawlers see the right locale.
    var seg = location.pathname.split("/")[1];
    if (seg === "en" || seg === "id") de.lang = seg;
    var m = localStorage.getItem("theme") || "system";
    if (
      m === "dark" ||
      (m === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      de.classList.add("dark");
    }
    var F = {
      sans: "var(--font-sans)",
      serif: 'Georgia, Cambria, "Times New Roman", serif',
      mono: "var(--font-mono)",
    };
    var f = localStorage.getItem("reading.font");
    if (f && F[f]) de.style.setProperty("--reading-font", F[f]);
    var s = localStorage.getItem("reading.size");
    if (s) de.style.setProperty("--reading-size", s + "px");
    var b = localStorage.getItem("reading.bg");
    if (b && b !== "default") de.setAttribute("data-reading-bg", b);
  } catch {}
})();
