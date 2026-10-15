import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { AdminClient } from './client'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) redirect('/dashboard')

  const [userCount, partyCount, proposalCount, ideaCount, reportCount, crossPartyCount] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.party.count(),
    prisma.noteProposal.count({ where: { status: { in: ['PHASE1', 'PHASE2'] } } }),
    prisma.idea.count({ where: { status: 'ACTIVE' } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.crossPartyIdea.count({ where: { status: 'PENDING' } }),
  ])

  const recentReports = await prisma.report.findMany({ where: { status: 'PENDING' }, take: 10, orderBy: { createdAt: 'desc' }, include: { reporter: { select: { pseudo: true } } } })
  const pendingCrossParty = await prisma.crossPartyIdea.findMany({ where: { status: 'PENDING' }, take: 10, orderBy: { createdAt: 'desc' }, include: { author: { select: { pseudo: true } }, fromParty: { select: { acronym: true } }, toParty: { select: { acronym: true } } } })

  return <AdminClient
    stats={{ userCount, partyCount, proposalCount, ideaCount, reportCount, crossPartyCount }}
    recentReports={JSON.parse(JSON.stringify(recentReports))}
    pendingCrossParty={JSON.parse(JSON.stringify(pendingCrossParty))}
  />
}
