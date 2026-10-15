'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ExternalLink } from 'lucide-react'
import { SafeDate } from '@/components/safe-format'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export type ReceivedIdea = {
  id: string
  title: string
  content: string
  expiresAt?: string | null
  fromParty?: { acronym?: string; colorHex?: string; name?: string } | null
  author?: { pseudo?: string; mode?: string } | null
}

export function ReceivedIdeaCard({ idea }: { idea: ReceivedIdea }) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-5 space-y-2">
      <div className="flex items-center gap-2">
        <ExternalLink className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold text-amber-600">Idée provenant d'un autre parti</span>
        <span className="text-xs px-2 py-0.5 rounded-full text-white ml-auto" style={{ backgroundColor: idea?.fromParty?.colorHex ?? '#666' }}>{idea?.fromParty?.acronym ?? ''}</span>
      </div>
      <h3 className="font-semibold">{idea?.title}</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-line">{idea?.content}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>par {idea?.author?.mode === 'TRANQUILLITE' ? 'Membre anonyme' : (idea?.author?.pseudo ?? 'Membre')}</span>
        {idea?.expiresAt && <><span>·</span><span>Expire le <SafeDate date={idea.expiresAt} options={{ dateStyle: 'short' }} /></span></>}
      </div>
    </div>
  )
}

export function ReceivedIdeasEmpty() {
  return (
    <div className="bg-card rounded-xl border p-8 text-center">
      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground">Aucune idée reçue pour le moment.</p>
    </div>
  )
}

const STORAGE_KEY = 'received-ideas-popup-seen'

/** S'affiche une fois à l'ouverture de chaque onglet (sessionStorage est propre à l'onglet). */
export function ReceivedIdeasPopup({ ideas }: { ideas: ReceivedIdea[] }) {
  const [open, setOpen] = useState(false)
  const list = ideas ?? []

  useEffect(() => {
    if (list.length === 0) return
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch (e) {
      console.error('sessionStorage indisponible', e)
    }
    setOpen(true)
  }, [list.length])

  if (list.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-amber-500" /> Idées reçues</DialogTitle>
          <DialogDescription>
            {list.length} idée{list.length > 1 ? 's' : ''} envoyée{list.length > 1 ? 's' : ''} par des membres d'autres partis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {list.slice(0, 5).map(idea => <ReceivedIdeaCard key={idea.id} idea={idea} />)}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {list.length > 5 && (
            <Button variant="outline" asChild onClick={() => setOpen(false)}>
              <Link href="/idees-recues">Voir les {list.length} idées</Link>
            </Button>
          )}
          <Button onClick={() => setOpen(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
