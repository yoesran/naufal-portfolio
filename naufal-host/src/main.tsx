import { Component, type ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'
import './lib/i18n.ts'

window.addEventListener('unhandledrejection', (e) => {
  console.warn('[host] unhandled rejection:', e.reason)
  e.preventDefault()
})

class TopErrorBoundary extends Component<
  { children: ReactNode },
  { error: unknown }
> {
  state = { error: null as unknown }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown) {
    console.error('[host] render error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-background text-foreground min-h-dvh">
          <div className="mx-auto max-w-2xl px-6 py-16 font-mono text-sm">
            <p className="text-foreground">
              Something went wrong loading this page.
            </p>
            <p className="text-muted-foreground mt-2">
              Try refreshing. If it persists, check the browser console.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TopErrorBoundary>
      <App />
    </TopErrorBoundary>
  </StrictMode>
)
