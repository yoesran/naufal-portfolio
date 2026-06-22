// Publishes the assistant's blog-side knowledge: serializes the post registry +
// the CV (per locale, phone dropped) into `public/knowledge.json`, which deploys
// with the blog. The host's `// ask` block fetches it cross-origin at runtime
// (env-driven VITE_BLOG_URL — same pattern as the quality dashboard reading
// health.json), so adding a post here and redeploying the blog updates the
// assistant with no host rebuild. Also refreshes the host's same-origin dev seed
// (mirrors how the host's scripts/reports.mjs refreshes public/health.json).
//
// Run by `npm run knowledge`, and automatically via `prebuild` before `next
// build` so every deploy republishes. The shape + phone-stripping live in
// src/lib/knowledge.ts (type-checked + unit-tested); this is just the writer.
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildKnowledge } from '../src/lib/knowledge'

const here = dirname(fileURLToPath(import.meta.url))
const knowledge = buildKnowledge()
const json = JSON.stringify(knowledge, null, 2) + '\n'

// (1) Published with the blog → fetched cross-origin by the host assistant.
writeFileSync(resolve(here, '../public/knowledge.json'), json)
// (2) Host dev seed (same-origin) so the assistant works offline in dev + tests.
writeFileSync(resolve(here, '../../naufal-host/public/knowledge.json'), json)

console.log(
  `knowledge.json → ${Object.keys(knowledge.cv).length} locales, ${knowledge.posts.length} post(s)`
)
