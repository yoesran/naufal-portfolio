# Badriyatim Family — private family app

A web app to keep Naufal's extended paternal family (descendants of Badriyatim &
Anizir, 90+ across Indonesia) connected after a 2026 _pulang basamo_ reunion.
**Thesis:** a new app won't manufacture engagement (the family's WhatsApp group is
dead) — so build what WhatsApp is _bad_ at: the **silsilah** (family tree),
**events + RSVP**, **iuran / money transparency**, a **photo/story archive**. Not
chat.

**Why it exists (Naufal's goals):** primarily a **portfolio** piece — shows how he
builds product (Next + Supabase, accessibility-first, a cohesive design system).
Secondarily a modest community/civic data point. It is _not_ the scholarship
centerpiece — don't overstate that.

**Stack:** Next.js 16 · Tailwind v4 · shadcn/ui (**Base UI flavor**, not Radix —
`multiple` not `type`, `render` not `asChild`) · (Phase 2) Supabase. Free tier.
Design system "Songket & Rumah Gadang" (Minangkabau: marun/emas/gading, Fraunces +
Plus Jakarta Sans, gonjong motif). **Single-locale (Bahasa Indonesia) by design —
no i18n library** (YAGNI for one language; hardcoded ID strings are intentional,
not a miss).

**Privacy (non-negotiable):** public = names, tree, struktur, tentang only. Contact
details, addresses, and **minors' birthdates** are members-only. This is a
**private repo** — family PII must never be public.

**Phases:** P1 public site (done). P2 in progress — auth done (invite-only magic
link, `proxy.ts` gates `/keluarga`); next members directory, then
**Keuangan/Iuran**, then events.

**Checks (all must stay green):** `npm run lint` · `format:check` · `test:e2e`
(Playwright smoke; builds + starts the prod server itself). After touching data
or anything near privacy: `npm run build`, then grep `.next` for a known phone
number from the private seed — must be zero hits.

@AGENTS.md
