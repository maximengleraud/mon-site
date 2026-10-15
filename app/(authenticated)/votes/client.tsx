'use client'
import { useState } from 'react'
import { Vote, ThumbsUp, ThumbsDown, Clock } from 'lucide-react'
import { toast } from 'sonner'

export function VotesClient({ sessions }: { sessions: any[] }) {
  const [voted, setVoted] = useState<Record<string, string>>({})

  const castVote = async (sessionId: string, choice: 'FOR' | 'AGAINST') => {
    try {
      const res = await fetch('/api/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, choice }) })
      const data = await res.json()
      if (res.ok) { toast.success('Vote enregistré !'); setVoted(prev => ({ ...prev, [sessionId]: choice })) }
      else toast.error(data?.error ?? 'Erreur')
    } catch { toast.error('Erreur serveur') }
  }

  const safeSessions = sessions ?? []

  if (safeSessions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Vote className="w-6 h-6" /> Votes en cours</h1>
        <div className="bg-card rounded-xl border p-8 text-center">
          <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun vote en attente pour le moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Vote className="w-6 h-6" /> Votes en cours</h1>
      {safeSessions.map((s: any) => {
        const alreadyVoted = (s?.votes?.length ?? 0) > 0 || voted[s?.id]
        const authorName = s?.proposal?.author?.mode === 'TRANQUILLITE' ? 'Membre anonyme' : (s?.proposal?.author?.pseudo ?? 'Membre')
        const endsAt = s?.endsAt ? new Date(s.endsAt) : null
        return (
          <div key={s?.id} className="bg-card rounded-xl border shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700">Phase {s?.phase}</span>
              {endsAt && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Fin: {endsAt.toLocaleDateString('fr-FR')} {endsAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
            <p className="text-xs text-muted-foreground">{s?.proposal?.point?.theme?.title} — proposé par {authorName}</p>
            <div className="bg-muted/50 rounded-lg p-3"><p className="text-sm">{s?.proposal?.content}</p></div>
            {alreadyVoted ? (
              <p className="text-sm text-green-600 font-medium">✓ Vous avez voté</p>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => castVote(s?.id, 'FOR')} className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"><ThumbsUp className="w-4 h-4" /> Pour</button>
                <button onClick={() => castVote(s?.id, 'AGAINST')} className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"><ThumbsDown className="w-4 h-4" /> Contre</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
