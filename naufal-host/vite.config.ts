import { transformAsync } from '@babel/core'
import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import reactCompiler from 'babel-plugin-react-compiler'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type HtmlTagDescriptor, defineConfig, loadEnv } from 'vite'

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const labUrl = env.VITE_LAB_URL || 'http://127.0.0.1:5174'
  // Canonical origin for the OG/Twitter share tags. Env-driven so the deploy
  // target (pages.dev today, naufal.dev once the custom domain lands) is a
  // one-line change, not a hunt through index.html. The default keeps dev sane.
  const siteUrl = env.VITE_SITE_URL || 'https://naufal-host.pages.dev'
  // Cloudflare Web Analytics beacon token (public, page-embedded — not a
  // secret). When unset (e.g. local dev), no beacon is injected at all, so dev
  // traffic never reaches analytics. Token comes from the CF dashboard →
  // Web Analytics → your site. See docs/deployment.md.
  const cfBeaconToken = env.VITE_CF_BEACON_TOKEN || ''

  return {
    plugins: [
      reactCompilerPlugin(),
      react(),
      tailwindcss(),
      federation({
        name: 'host',
        // Deliberately NO build-time `remotes`: a config remote gets its
        // remoteEntry.js fetched inside the generated bootstrap, before the app
        // entry executes — a cross-origin fetch (or, lab down, a connection
        // timeout) on the first-paint critical path (measured: ~1s of deployed
        // FCP; 3s stalls locally). The lab is registered at runtime instead,
        // on first use — see src/lib/lab-remote.ts. Type note: `lab/*` types
        // come from the checked-out `@mf-types/` snapshot (tsconfig paths);
        // to refresh after the lab's exposed API changes, temporarily restore
        // `remotes` + `dts.consumeTypes` here and run dev with the lab up.
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
        // The MF bootstrap is a chain of tiny virtual modules, each discovered
        // only after the previous one executes — a serial request waterfall
        // (~12 round trips) that gates first paint. Vite's own modulepreload
        // emission can't see through the plugin's bootstrap wrapper, so inject
        // the hints ourselves: every chunk in the boot-critical graph (the MF
        // virtual modules + the real entry and its static imports — NOT the
        // lazy block chunks), plus the latin body font. Measured: deployed FCP
        // 4.4s → ~1s.
        name: 'preload-critical',
        transformIndexHtml: {
          order: 'post' as const,
          handler(_html: string, ctx: { bundle?: Record<string, unknown> }) {
            if (!ctx.bundle) return [] // dev server: no bundle, nothing to do
            type Chunk = {
              type: string
              isEntry?: boolean
              facadeModuleId?: string | null
              imports?: string[]
            }
            const bundle = ctx.bundle as Record<string, Chunk>
            const critical = new Set<string>()
            const addWithStaticImports = (file: string) => {
              if (critical.has(file)) return
              const c = bundle[file]
              if (!c || c.type !== 'chunk') return
              critical.add(file)
              for (const dep of c.imports ?? []) addWithStaticImports(dep)
            }
            for (const [file, c] of Object.entries(bundle)) {
              if (c.type !== 'chunk') continue
              const isMfInternal =
                /virtual_mf|hostInit|rolldown-runtime|preload-helper|remoteEntry/.test(
                  file
                )
              const isAppEntry =
                c.isEntry ||
                (c.facadeModuleId ?? '')
                  .replace(/\\/g, '/')
                  .endsWith('src/main.tsx')
              if (isMfInternal || isAppEntry) addWithStaticImports(file)
            }
            const tags: HtmlTagDescriptor[] = [...critical].map((file) => ({
              tag: 'link',
              attrs: {
                rel: 'modulepreload',
                crossorigin: '',
                href: `/${file}`,
              },
              injectTo: 'head',
            }))
            const font = Object.keys(bundle).find((f) =>
              /inter-latin-wght-normal.*\.woff2$/.test(f)
            )
            if (font)
              tags.push({
                tag: 'link',
                attrs: {
                  rel: 'preload',
                  as: 'font',
                  type: 'font/woff2',
                  crossorigin: '',
                  href: `/${font}`,
                },
                injectTo: 'head',
              })
            return tags
          },
        },
      },
      {
        // Warm the connection to the remote's origin so the cross-origin
        // remoteEntry.js fetch (now off the boot path — it happens on the first
        // federated interaction) still skips DNS + TLS setup when it fires.
        // Env-aware via labUrl; crossorigin to match the module script's
        // anonymous CORS fetch.
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
        // Bake the canonical origin into the share tags. index.html ships the
        // `__SITE_URL__` placeholder so the OG/Twitter URLs follow the deploy
        // target without a hardcoded hostname.
        name: 'site-url',
        transformIndexHtml(html) {
          return html.replaceAll('__SITE_URL__', siteUrl)
        },
      },
      {
        // Inject the Cloudflare Web Analytics beacon — only when a token is
        // configured, so local dev (no token) ships no analytics at all. The
        // beacon is privacy-first (no cookies → no consent banner) and defer'd
        // off the critical path.
        name: 'cf-web-analytics',
        transformIndexHtml: () =>
          cfBeaconToken
            ? [
                {
                  tag: 'script',
                  attrs: {
                    defer: true,
                    src: 'https://static.cloudflareinsights.com/beacon.min.js',
                    'data-cf-beacon': JSON.stringify({ token: cfBeaconToken }),
                  },
                  injectTo: 'body',
                },
              ]
            : [],
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
