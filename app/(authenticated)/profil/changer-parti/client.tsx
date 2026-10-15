'use client'
import { useState } from 'react'
import { ArrowRightLeft, AlertTriangle, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { PartyImage } from '@/components/party-image'

export function ChangerPartiClient({ parties, currentPartyId }: { parties: any[]; currentPartyId: string }) {
  const [selected, setSelected] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const { update } = useSession()
  const router = useRouter()

  const doChange = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/party-change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPartyId: selected }) })
      const data = await res.json()
      if (res.ok) {
        const newParty = (parties ?? []).find((p: any) => p?.id === selected)
        await update({ partyId: selected, partySlug: newParty?.slug, partyColor: newParty?.colorHex, partyAcronym: newParty?.acronym })
        toast.success('Parti changé !')
        router.push('/dashboard')
        router.refresh()
      } else toast.error(data?.error ?? 'Erreur')
    } catch { toast.error('Erreur') }
    setLoading(false)
  }

  const available = (parties ?? []).filter((p: any) => p?.id !== currentPartyId)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><ArrowRightLeft className="w-6 h-6" /> Changer de parti</h1>
      {!confirm ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Sélectionnez votre nouveau parti :</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {available.map((p: any) => (
              <button key={p?.id} onClick={() => setSelected(p?.id)} aria-pressed={selected === p?.id} className={`text-left rounded-xl overflow-hidden border-2 bg-card transition-all ${selected === p?.id ? 'border-blue-600 shadow-md' : 'border-transparent shadow-sm hover:shadow-md'}`}>
                <div className="relative aspect-video bg-muted">
                  <PartyImage slug={p?.slug} name={p?.name ?? ''} color={p?.colorHex} small />
                  <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: p?.colorHex }} />
                  {selected === p?.id && <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>}
                </div>
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">{p?.acronym}</p>
                  <p className="text-xs text-muted-foreground truncate">{p?.name}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => selected && setConfirm(true)} disabled={!selected} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">Continuer</button>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3"><AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" /><p className="text-sm">Vous allez changer de parti politique. Votre solde de points sera remis à zéro et vos contributions resteront associées à votre ancien parti. Vous ne pourrez plus modifier vos anciennes contributions depuis votre nouveau parti. Souhaitez-vous continuer ?</p></div>
          <div className="flex gap-2">
            <button onClick={doChange} disabled={loading} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">{loading ? 'Changement...' : 'Confirmer'}</button>
            <button onClick={() => setConfirm(false)} className="text-sm text-muted-foreground">Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
