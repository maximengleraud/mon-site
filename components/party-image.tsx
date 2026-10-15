'use client'
import Image from 'next/image'
import { useState } from 'react'

const KNOWN = new Set(['npa', 'lo', 'lfi', 'ps', 'eelv', 'pcf', 're', 'modem', 'horizons', 'lr', 'udi', 'rn', 'reconquete', 'dlf'])

export function partyImageSrc(slug?: string | null, small = false) {
  if (!slug || !KNOWN.has(slug)) return null
  return `/parties/${slug}-membres${small ? '-sm' : ''}.webp`
}

/** Montage photo des membres d'un parti (photos libres Wikimedia Commons), dans un conteneur `relative` dimensionné par le parent. */
export function PartyImage({ slug, name, color, small = false, priority = false, className = '' }: {
  slug?: string | null; name: string; color?: string; small?: boolean; priority?: boolean; className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = partyImageSrc(slug, small)
  if (!src || failed) {
    return <div className={`absolute inset-0 ${className}`} style={{ background: `linear-gradient(135deg, ${color ?? '#2563EB'}, ${color ?? '#2563EB'}99)` }} aria-hidden="true" />
  }
  return (
    <Image
      src={src}
      alt={`Montage photo de personnalités du parti ${name}`}
      fill
      priority={priority}
      sizes={small ? '240px' : '(max-width: 768px) 100vw, 1024px'}
      className={`object-cover ${className}`}
      onError={() => { console.error(`Image du parti introuvable : ${src}`); setFailed(true) }}
    />
  )
}
