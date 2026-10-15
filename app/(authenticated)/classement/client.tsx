'use client'
import { Trophy, ArrowRightLeft, Medal } from 'lucide-react'
import { useState } from 'react'
import { SafeDate } from '@/components/safe-format'

export function ClassementClient({ globalTop, partyTop, partyChanges, partyColor, userId }: {
  globalTop: any[]; partyTop: any[]; partyChanges: any[]; partyColor: string; userId: string
}) {
  const [tab, setTab] = useState<'global' | 'parti' | 'changements'>('global')

  const renderLeaderboard = (items: any[], showParty: boolean) => (
    <div className="space-y-1">
      {(items ?? []).map((u: any, i: number) => (
        <div key={u?.id ?? i} className={`flex items-center gap-3 p-3 rounded-lg ${u?.id === userId ? 'bg-blue-50 border border-blue-200' : 'hover:bg-accent/50'}`}>
          <span className="w-8 text-center font-mono text-sm font-bold">
            {i === 0 ? <Medal className="w-5 h-5 text-yellow-500 mx-auto" /> : i === 1 ? <Medal className="w-5 h-5 text-gray-400 mx-auto" /> : i === 2 ? <Medal className="w-5 h-5 text-amber-700 mx-auto" /> : `#${i + 1}`}
          </span>
          <span className="flex-1 text-sm font-medium">{u?.pseudo ?? 'Membre'}</span>
          {showParty && <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: u?.party?.colorHex ?? '#666' }}>{u?.party?.acronym ?? ''}</span>}
          <span className="font-mono text-sm font-bold">{u?.pointsBalance ?? 0} pts</span>
        </div>
      ))}
      {(items?.length ?? 0) === 0 && <p className="text-center text-muted-foreground py-8">Aucun participant.</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Trophy className="w-6 h-6" style={{ color: partyColor }} /> Classement</h1>
      <div className="flex gap-2">
        {(['global', 'parti', 'changements'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`} style={tab === t ? { backgroundColor: partyColor } : undefined}>
            {t === 'global' ? 'Global' : t === 'parti' ? 'Mon parti' : 'Changements'}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-4">
        {tab === 'global' && renderLeaderboard(globalTop, true)}
        {tab === 'parti' && renderLeaderboard(partyTop, false)}
        {tab === 'changements' && (
          <div className="space-y-2">
            {(partyChanges ?? []).map((c: any) => (
              <div key={c?.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50">
                <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{c?.user?.pseudo ?? 'Membre'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: c?.fromParty?.colorHex ?? '#666' }}>{c?.fromParty?.acronym ?? '?'}</span>
                <span className="text-xs">→</span>
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: c?.toParty?.colorHex ?? '#666' }}>{c?.toParty?.acronym ?? '?'}</span>
                <SafeDate date={c?.changedAt} options={{ dateStyle: 'short' }} className="text-xs text-muted-foreground ml-auto" />
              </div>
            ))}
            {(partyChanges?.length ?? 0) === 0 && <p className="text-center text-muted-foreground py-8">Aucun changement de parti récent.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
