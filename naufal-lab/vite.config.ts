import { federation } from '@module-federation/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { type HtmlTagDescriptor, defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    federation({
      name: 'lab',
      filename: 'remoteEntry.js',
      exposes: {
        './SpringToy': './src/lib/mountSpringToy.ts',
        './Presence': './src/lib/mountPresence.ts',
      },
      dts: {
        generateTypes: true,
        consumeTypes: false,
        displayErrorInTerminal: true,
      },
      shared: [],
    }),
    {
      // Same fix as the host's `preload-critical` (kept in sync by hand — the
      // repos deliberately share no tooling): the MF bootstrap loads the
      // standalone page through a serial chain of tiny virtual modules, gating
      // first paint on ~6 round trips. Inject modulepreload hints for the whole
      // boot graph + the latin body font so they fetch in one parallel burst.
      name: 'preload-critical',
      transformIndexHtml: {
        order: 'post' as const,
        handler(_html: string, ctx: { bundle?: Record<string, unknown> }) {
          if (!ctx.bundle) return []
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
                .endsWith('src/main.ts')
            if (isMfInternal || isAppEntry) addWithStaticImports(file)
          }
          const tags: HtmlTagDescriptor[] = [...critical].map((file) => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: '', href: `/${file}` },
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
  ],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
    },
  },
  preview: {
    port: 5174,
    host: '127.0.0.1',
    cors: true,
    allowedHosts: true,
  },
  server: {
    port: 5174,
    host: '127.0.0.1',
    origin: 'http://127.0.0.1:5174',
    cors: true,
    allowedHosts: true,
  },
  build: { target: 'chrome89' },
})
