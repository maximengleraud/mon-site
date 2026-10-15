'use client'
import { useState } from 'react'
import { Lightbulb, ThumbsUp, ThumbsDown, Plus, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export function IdeesClient({ ideas: initialIdeas, partyColor }: { ideas: any[]; partyColor: string }) {
  const [ideas, setIdeas] = useState(initialIdeas ?? [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [direction, setDirection] = useState(0)

  const current = ideas?.[currentIndex]

  const voteIdea = async (ideaId: string, vote: 'LIKE' | 'DISLIKE') => {
    try {
      const res = await fetch('/api/ideas/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ideaId, vote }) })
      if (res.ok) {
        setDirection(vote === 'LIKE' ? 1 : -1)
        setTimeout(() => { setCurrentIndex(prev => prev + 1); setDirection(0) }, 300)
      } else {
        const data = await res.json()
        toast.error(data?.error ?? 'Erreur')
        setCurrentIndex(prev => prev + 1)
      }
    } catch { toast.error('Erreur') }
  }

  const submitIdea = async () => {
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) })
      const data = await res.json()
      if (res.ok) { toast.success('Idée soumise !'); setShowForm(false); setTitle(''); setContent('') }
      else toast.error(data?.error ?? 'Erreur')
    } catch { toast.error('Erreur') }
    setSubmitting(false)
  }

  const authorName = (idea: any) => idea?.author?.mode === 'TRANQUILLITE' ? 'Membre anonyme' : (idea?.author?.pseudo ?? 'Membre')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Lightbulb className="w-6 h-6" style={{ color: partyColor }} /> Boîte à idées</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"><Plus className="w-4 h-4" /> Nouvelle</button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Nouvelle idée</h3><button onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button></div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" maxLength={100} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Décrivez votre idée (max 500 caractères)" className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={4} maxLength={500} />
          <p className="text-xs text-muted-foreground text-right">{content?.length ?? 0}/500</p>
          <button onClick={submitIdea} disabled={submitting} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"><Send className="w-3 h-3" /> {submitting ? 'Envoi...' : 'Soumettre'}</button>
        </div>
      )}

      {/* Tinder-style cards */}
      <div className="relative h-80 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {current ? (
            <motion.div
              key={current?.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, x: direction * 200 }}
              exit={{ opacity: 0, x: direction * 300 }}
              transition={{ duration: 0.3 }}
              className="absolute w-full max-w-md bg-card rounded-2xl border shadow-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{authorName(current)}</span>
                <span className="text-xs text-muted-foreground">{currentIndex + 1}/{ideas?.length ?? 0}</span>
              </div>
              <h3 className="font-display font-bold text-lg">{current?.title}</h3>
              <p className="text-sm text-muted-foreground">{current?.content}</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs">👍 {current?.likesCount ?? 0} · 👎 {current?.dislikesCount ?? 0}</span>
              </div>
              {(current?.ideaVotes?.length ?? 0) > 0 ? (
                <p className="text-sm text-green-600">✓ Déjà voté</p>
              ) : (
                <div className="flex gap-3 justify-center">
                  <button onClick={() => voteIdea(current?.id, 'DISLIKE')} className="w-14 h-14 rounded-full border-2 border-red-300 flex items-center justify-center hover:bg-red-50 transition-colors"><ThumbsDown className="w-6 h-6 text-red-500" /></button>
                  <button onClick={() => voteIdea(current?.id, 'LIKE')} className="w-14 h-14 rounded-full border-2 border-green-300 flex items-center justify-center hover:bg-green-50 transition-colors"><ThumbsUp className="w-6 h-6 text-green-500" /></button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center">
              <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{(ideas?.length ?? 0) === 0 ? 'Aucune idée pour le moment.' : 'Vous avez vu toutes les idées !'}</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
