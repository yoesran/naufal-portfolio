import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const remoteDist = path.resolve(__dirname, '../naufal-lab/dist')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'host',
      remotes: {
        lab: {
          type: 'module',
          name: 'lab',
          entry: 'http://127.0.0.1:5174/remoteEntry.js',
        },
      },
      dts: {
        generateTypes: false,
        consumeTypes: true,
        displayErrorInTerminal: true,
      },
      shared: ['react', 'react-dom'],
    }),
    {
      name: 'watch-remote-dist',
      configureServer(server) {
        server.watcher.add(remoteDist)
        server.watcher.on('change', (file) => {
          if (file.startsWith(remoteDist)) {
            server.ws.send({ type: 'full-reload' })
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  build: { target: 'chrome89' },
})
