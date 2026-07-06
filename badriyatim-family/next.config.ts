import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Portfolio-wide standard: components are written compiler-clean (no
  // setState-in-effect, external stores for shared UI state) — turn the
  // optimizer on so that discipline actually pays.
  reactCompiler: true,
}

export default nextConfig
