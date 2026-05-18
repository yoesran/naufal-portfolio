import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { federation } from "@module-federation/vite";

export default defineConfig({
  plugins: [
    svelte(),
    federation({
      name: "lab",
      filename: "remoteEntry.js",
      exposes: {
        "./Counter": "./src/lib/mountCounter.ts",
      },
      shared: [],
    }),
  ],
  server: { port: 5174, origin: "http://localhost:5174" },
  preview: { port: 5174 },
  build: { target: "chrome89" },
});
