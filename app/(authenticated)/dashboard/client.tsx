'use client'
import { BookOpen, Vote, Lightbulb, Trophy, Coins, Users, MessageSquare } from 'lucide-react'
import { ReceivedIdeaCard, ReceivedIdeasEmpty, type ReceivedIdea } from '@/components/received-ideas'
import Link from 'next/link'
import { FadeIn, SlideIn } from '@/components/ui/animate'
import { PartyImage } from '@/components/party-image'

export function DashboardClient({ pseudo, mode, points, partyName, partyAcronym, partySlug, partyColor, memberCount, proposalCount, ideaCount, activeVotes, receivedIdeas }: {
  pseudo: string; mode: string; points: number; partyName: string; partyAcronym: string; partySlug: string; partyColor: string; memberCount: number; proposalCount: number; ideaCount: number; activeVotes: number; receivedIdeas: ReceivedIdea[]
}) {
  const ideas = receivedIdeas ?? []
  const cards = [
    { href: '/programme', icon: BookOpen, label: 'Programme', value: `${proposalCount} proposition${proposalCount > 1 ? 's' : ''} en cours`, color: 'bg-blue-100 text-blue-700' },
    { href: '/votes', icon: Vote, label: 'Mes votes', value: `${activeVotes} vote${activeVotes > 1 ? 's' : ''} en attente`, color: 'bg-purple-100 text-purple-700' },
    { href: '/idees', icon: Lightbulb, label: 'Boîte à idées', value: `${ideaCount} idée${ideaCount > 1 ? 's' : ''} actives`, color: 'bg-amber-100 text-amber-700' },
    { href: '/classement', icon: Trophy, label: 'Classement', value: mode === 'COMPETITION' ? `${points} points` : 'Mode Tranquillité', color: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl text-white shadow-md min-h-[220px] md:min-h-[260px] flex items-end" style={{ backgroundColor: partyColor }}>
          <PartyImage slug={partySlug} name={partyName} color={partyColor} priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: partyColor }} aria-hidden="true" />
          <div className="relative w-full p-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm">Bienvenue,</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">{pseudo}</h1>
              <p className="text-white/80 text-sm mt-1">{partyAcronym} — {partyName}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">{memberCount} membres</span>
              </div>
              {mode === 'COMPETITION' && (
                <div className="flex items-center gap-2 mt-1">
                  <Coins className="w-4 h-4 text-yellow-300" />
                  <span className="text-lg font-bold">{points} pts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c, i) => (
          <SlideIn key={c.href} from="bottom" delay={i * 0.1}>
            <Link href={c.href} className="block bg-card rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{c.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.value}</p>
                </div>
              </div>
            </Link>
          </SlideIn>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" /> Idées reçues
            {ideas.length > 0 && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{ideas.length}</span>}
          </h2>
          {ideas.length > 3 && <Link href="/idees-recues" className="text-sm text-primary hover:underline">Tout voir</Link>}
        </div>
        {ideas.length === 0 ? <ReceivedIdeasEmpty /> : (
          <div className="space-y-3">
            {ideas.slice(0, 3).map(idea => <ReceivedIdeaCard key={idea.id} idea={idea} />)}
          </div>
        )}
      </section>
    </div>
  )
}
