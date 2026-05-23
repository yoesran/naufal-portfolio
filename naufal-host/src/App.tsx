import { Suspense } from 'react'

import { RemoteMount } from './components/RemoteMount'

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Naufal portfolio — v0.1</h1>
      <Suspense fallback={<p>Loading remote…</p>}>
        <RemoteMount load={() => import('lab/Counter')} />
      </Suspense>
    </div>
  )
}
