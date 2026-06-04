import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { transformAsync } from '@babel/core'
import reactCompiler from 'babel-plugin-react-compiler'
import { federation } from '@module-federation/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { buildPrePaintScript, buildPrePaintStyle } from './src/lib/theme-tokens'

// React Compiler. `@rolldown/plugin-babel` + `reactCompilerPreset` is the
// documented path for Vite 8 / plugin-react v6, but its transform hook never
// fires for our source files in this project (likely an environment-handshake
// interaction with the federation plugin) — verified by a no-op build with
// `panicThreshold: 'all_errors'`. This minimal plugin calls @babel/core
// directly and works the same way for the compiler's purposes.
const reactCompilerPlugin = () => ({
  name: 'react-compiler',
  enforce: 'pre' as const,
  async transform(code: string, id: string) {
    if (!/\.[jt]sx?$/.test(id) || id.includes('node_modules')) return null
    const result = await transformAsync(code, {
      filename: id,
      babelrc: false,
      configFile: false,
      plugins: [[reactCompiler, {}]],
      parserOpts: { sourceType: 'module', plugins: ['typescript', 'jsx'] },
    })
    if (!result?.code) return null
    return { code: result.code, map: result.map }
  },
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const remoteDist = path.resolve(__dirname, '../naufal-lab/dist')

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const labUrl = env.VITE_LAB_URL || 'http://127.0.0.1:5174'

  return {
    plugins: [
      reactCompilerPlugin(),
      react(),
      tailwindcss(),
      federation({
        name: 'host',
        remotes: {
          lab: {
            type: 'module',
            name: 'lab',
            entry: `${labUrl}/remoteEntry.js`,
          },
        },
        dts: {
          generateTypes: false,
          // Only download the remote's .d.ts in dev (serve). The production
          // build doesn't need them for the runtime bundle, and consuming them
          // would couple the build to the remote being reachable.
          consumeTypes: command === 'serve',
          displayErrorInTerminal: true,
        },
        runtimePlugins: ['./src/lib/mf-fallback-plugin.ts'],
        hostInitInjectLocation: 'html',
        shared: ['react', 'react-dom'],
      }),
      {
        // Generate the no-FOUC pre-paint <script>/<style> from the theme tokens
        // (single source of truth) and inject them where index.html marks the
        // slot. Keeps the inline script from drifting out of sync with theme.ts.
        name: 'theme-prepaint',
        transformIndexHtml(html) {
          return html.replace(
            '<!-- theme-prepaint -->',
            `<script>${buildPrePaintScript()}</script>\n    <style>${buildPrePaintStyle()}</style>`
          )
        },
      },
      {
        // Warm the connection to the remote's origin so the cross-origin
        // remoteEntry.js fetch (on the critical path for federated blocks)
        // skips DNS + TLS setup. Env-aware via labUrl; crossorigin to match the
        // module script's anonymous CORS fetch.
        name: 'preconnect-remote',
        transformIndexHtml: () => [
          {
            tag: 'link',
            attrs: { rel: 'preconnect', href: labUrl, crossorigin: '' },
            injectTo: 'head',
          },
        ],
      },
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
  }
})
