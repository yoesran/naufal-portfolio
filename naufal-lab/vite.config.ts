import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    svelte(),
    federation({
      name: 'lab',
      filename: 'remoteEntry.js',
      exposes: {
        './Counter': './src/lib/mountCounter.ts',
      },
      dts: true,
      shared: [],
    }),
  ],
  preview: {
    port: 5174,
    host: '127.0.0.1',
  },
  server: {
    port: 5174,
    host: '127.0.0.1',
    origin: 'http://127.0.0.1:5174',
  },
  build: { target: 'chrome89' },
});
