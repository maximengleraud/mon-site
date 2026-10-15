import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { DashboardClient } from './client'
import { getReceivedIdeas } from '@/lib/received-ideas'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')
  const userId = session.user.id
  const partyId = session.user.partyId

  const [user, party, proposalCount, ideaCount, activeVotes, receivedIdeas] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { pointsBalance: true, mode: true, pseudo: true } }),
    partyId ? prisma.party.findUnique({ where: { id: partyId }, select: { name: true, slug: true, acronym: true, colorHex: true, _count: { select: { users: true } } } }) : null,
    partyId ? prisma.noteProposal.count({ where: { point: { theme: { partyId } }, status: { in: ['PHASE1', 'PHASE2'] } } }) : 0,
    partyId ? prisma.idea.count({ where: { partyId, status: 'ACTIVE' } }) : 0,
    prisma.votingSession.count({ where: { result: 'PENDING', eligibleUserIds: { has: userId } } }),
    getReceivedIdeas(partyId),
  ])

  return <DashboardClient
    pseudo={user?.pseudo ?? ''}
    mode={user?.mode ?? 'COMPETITION'}
    points={user?.pointsBalance ?? 0}
    partyName={party?.name ?? ''}
    partyAcronym={party?.acronym ?? ''}
    partySlug={party?.slug ?? ''}
    partyColor={party?.colorHex ?? '#2563EB'}
    memberCount={(party as any)?._count?.users ?? 0}
    proposalCount={proposalCount}
    ideaCount={ideaCount}
    activeVotes={activeVotes}
    receivedIdeas={receivedIdeas}
  />
}
