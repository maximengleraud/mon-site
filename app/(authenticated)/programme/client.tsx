'use client'
import { useState } from 'react'
import { BookOpen, Lock, CheckCircle, Clock, Plus, Minus, ChevronDown, ChevronRight, Send, Info, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { PartyImage } from '@/components/party-image'

type Author = { pseudo: string; mode: string }
type Note = { id: string; content: string; adoptedAt: string; author: Author }
type Proposal = { id: string; content: string; status: string; author: Author; submittedAt: string; replacesNoteId?: string | null }
type Point = { id: string; title?: string | null; content: string; details?: string | null; isOfficial: boolean; adoptedNotes: Note[]; noteProposals: Proposal[] }
type Theme = { id: string; title: string; points: Point[] }

const MAX_NOTES = 3

export function ProgrammeClient({ themes, party, userId }: { themes: Theme[]; party: { name: string; slug?: string; acronym: string; colorHex: string; programSource?: string | null }; userId: string }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [moreInfo, setMoreInfo] = useState<Record<string, boolean>>({})
  const [proposalOpen, setProposalOpen] = useState<string | null>(null)
  const [proposalContent, setProposalContent] = useState('')
  const [replacesNoteId, setReplacesNoteId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleInfo = (id: string) => setMoreInfo(prev => ({ ...prev, [id]: !prev[id] }))
  const authorName = (a: Author) => a?.mode === 'TRANQUILLITE' ? 'Membre anonyme' : (a?.pseudo ?? 'Membre')
  const closeForm = () => { setProposalOpen(null); setProposalContent(''); setReplacesNoteId('') }

  const submitProposal = async (point: Point) => {
    if (proposalContent.trim().length < 5) { toast.error('Votre note doit contenir au moins 5 caractères'); return }
    const full = (point.adoptedNotes?.length ?? 0) >= MAX_NOTES
    if (full && !replacesNoteId) { toast.error('Choisissez la note à remplacer'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointId: point.id, content: proposalContent, ...(full ? { replacesNoteId } : {}) }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Proposition soumise au vote !'); closeForm(); router.refresh() }
      else toast.error(data?.error ?? 'Erreur')
    } catch { toast.error('Erreur serveur') }
    setSubmitting(false)
  }

  const totalPoints = (themes ?? []).reduce((s, t) => s + (t?.points?.length ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <div className="relative overflow-hidden rounded-2xl aspect-[16/6] md:aspect-[16/5] mb-4 shadow-md bg-muted">
          <PartyImage slug={party.slug} name={party.name} color={party.colorHex} priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: party.colorHex }} aria-hidden="true" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 text-white">
            <p className="text-xs uppercase tracking-wider text-white/80">{party.name}</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6" /> Programme {party.acronym}
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Programme officiel du parti ({themes?.length ?? 0} thèmes, {totalPoints} mesures). Chaque mesure peut recevoir jusqu'à {MAX_NOTES} notes adoptées par les membres.
        </p>
        {party.programSource && (
          <p className="text-xs text-muted-foreground mt-2 bg-muted/60 rounded-lg px-3 py-2">
            <span className="font-semibold">Source :</span> {party.programSource}
          </p>
        )}
      </div>

      {(themes ?? []).map((theme: Theme) => (
        <div key={theme.id} className="bg-card rounded-xl border shadow-sm">
          <button onClick={() => toggle(theme.id)} className="w-full flex items-center justify-between p-4 hover:bg-accent/50 rounded-t-xl transition-colors">
            <span className="font-semibold text-sm">{theme.title} <span className="text-xs font-normal text-muted-foreground">· {theme?.points?.length ?? 0} mesure{(theme?.points?.length ?? 0) > 1 ? 's' : ''}</span></span>
            {expanded[theme.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {expanded[theme.id] && (
            <div className="px-4 pb-4 space-y-4">
              {(theme?.points ?? []).map((point: Point) => {
                const notes = point?.adoptedNotes ?? []
                const full = notes.length >= MAX_NOTES
                const hasActive = (point?.noteProposals?.length ?? 0) > 0
                return (
                  <div key={point.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1">
                        {point.title && <p className="text-sm font-semibold">{point.title}</p>}
                        <p className="text-sm text-foreground/90">{point.content}</p>
                        {point.details && (
                          <>
                            <button onClick={() => toggleInfo(point.id)} aria-expanded={!!moreInfo[point.id]} className="inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2.5 py-1 rounded-md border hover:bg-accent transition-colors" style={{ color: party.colorHex, borderColor: party.colorHex + '55' }}>
                              {moreInfo[point.id] ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              {moreInfo[point.id] ? "Moins d'info" : "Plus d'info"}
                            </button>
                            {moreInfo[point.id] && (
                              <div className="mt-2 flex gap-2 rounded-lg bg-muted/60 p-3">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                <p className="text-sm leading-relaxed whitespace-pre-line">{point.details}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${full ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`} title="Notes adoptées">
                        {notes.length}/{MAX_NOTES} notes
                      </span>
                    </div>

                    {notes.map((note: Note, i: number) => (
                      <div key={note.id} className="ml-6 bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">Note adoptée n°{i + 1}</span>
                          <span className="text-xs text-muted-foreground">par {authorName(note.author)}</span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}

                    {(point?.noteProposals ?? []).map((prop: Proposal) => {
                      const replaced = prop.replacesNoteId ? notes.find(n => n.id === prop.replacesNoteId) : null
                      return (
                        <div key={prop.id} className="ml-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700">{prop.status === 'PENDING' ? 'En attente' : prop.status === 'PHASE1' ? 'Vote Phase 1' : 'Vote Phase 2'}</span>
                            <span className="text-xs text-muted-foreground">par {authorName(prop.author)}</span>
                          </div>
                          {replaced && <p className="text-xs italic text-amber-800 mb-1">Cette proposition vise à remplacer la note suivante : « {replaced.content} »</p>}
                          <p className="text-sm">{prop.content}</p>
                        </div>
                      )
                    })}

                    {!hasActive && (
                      <div className="ml-6">
                        {proposalOpen === point.id ? (
                          <div className="space-y-2">
                            {full && (
                              <div className="space-y-1">
                                <label className="text-xs font-medium">Ce point a déjà {MAX_NOTES} notes adoptées. Choisissez celle que votre proposition remplacera :</label>
                                <select value={replacesNoteId} onChange={e => setReplacesNoteId(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-background">
                                  <option value="">— Sélectionner une note —</option>
                                  {notes.map((n, i) => <option key={n.id} value={n.id}>Note n°{i + 1} : {n.content.slice(0, 80)}{n.content.length > 80 ? '…' : ''}</option>)}
                                </select>
                                {replacesNoteId && (
                                  <p className="text-xs italic text-muted-foreground">Cette proposition vise à remplacer la note suivante : « {notes.find(n => n.id === replacesNoteId)?.content} »</p>
                                )}
                              </div>
                            )}
                            <textarea value={proposalContent} onChange={e => setProposalContent(e.target.value)} placeholder="Votre note..." maxLength={2000} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} />
                            <div className="flex gap-2">
                              <button onClick={() => submitProposal(point)} disabled={submitting} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                                <Send className="w-3 h-3" /> {submitting ? 'Envoi...' : 'Soumettre au vote'}
                              </button>
                              <button onClick={closeForm} className="text-xs text-muted-foreground hover:text-foreground">Annuler</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { closeForm(); setProposalOpen(point.id) }} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                            {full ? <><RefreshCw className="w-3 h-3" /> Proposer une note de remplacement</> : <><Plus className="w-3 h-3" /> Proposer une note</>}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
