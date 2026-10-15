'use client'
import { MessageSquare } from 'lucide-react'
import { ReceivedIdeaCard, ReceivedIdeasEmpty } from '@/components/received-ideas'

export function IdeesRecuesClient({ ideas }: { ideas: any[] }) {
  const safeIdeas = ideas ?? []
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><MessageSquare className="w-6 h-6" /> Idées reçues</h1>
      <p className="text-sm text-muted-foreground">Idées envoyées par des membres d'autres partis</p>
      {safeIdeas.length === 0 ? (
        <ReceivedIdeasEmpty />
      ) : (
        <div className="space-y-3">
          {safeIdeas.map((idea: any) => <ReceivedIdeaCard key={idea?.id} idea={idea} />)}
        </div>
      )}
    </div>
  )
}
