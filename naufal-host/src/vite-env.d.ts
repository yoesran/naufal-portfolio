/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LAB_URL?: string
  readonly VITE_PARTY_HOST?: string
  readonly VITE_BLOG_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
