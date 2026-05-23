import path from 'node:path'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    federation({
      name: 'lab',
      filename: 'remoteEntry.js',
      exposes: {
        './Counter': './src/lib/mountCounter.ts',
      },
      dts: {
        generateTypes: true,
        consumeTypes: false,
        displayErrorInTerminal: true,
      },
      shared: [],
    }),
  ],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
    },
  },
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
})
