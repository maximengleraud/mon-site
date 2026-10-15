'use client'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve()
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Turnstile script error')))
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Turnstile script error'))
    document.head.appendChild(s)
  })
}

export type TurnstileHandle = { reset: () => void }

export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void }>(function Turnstile({ onToken }, ref) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const cb = useRef(onToken)
  cb.current = onToken

  useImperativeHandle(ref, () => ({
    reset: () => {
      cb.current(null)
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
    },
  }))

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) {
      console.error('NEXT_PUBLIC_TURNSTILE_SITE_KEY manquant')
      return
    }
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          language: 'fr',
          theme: 'light',
          callback: (t: string) => cb.current(t),
          'expired-callback': () => cb.current(null),
          'error-callback': () => cb.current(null),
        })
      })
      .catch((e) => console.error(e))
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [])

  return (
    <div className="space-y-1">
      <div ref={container} className="min-h-[65px]" />
      <p className="text-[11px] text-muted-foreground">Vérification anti-robot par Cloudflare Turnstile — réservé aux humains.</p>
    </div>
  )
})
