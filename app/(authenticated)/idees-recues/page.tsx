import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { IdeesRecuesClient } from './client'

export default async function IdeesRecuesPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')
  if (!session.user.partyId) redirect('/dashboard')

  const ideas = await prisma.crossPartyIdea.findMany({
    where: { toPartyId: session.user.partyId, status: 'APPROVED', expiresAt: { gt: new Date() } },
    include: { fromParty: { select: { acronym: true, colorHex: true, name: true } }, author: { select: { pseudo: true, mode: true } } },
    orderBy: { approvedAt: 'desc' },
  })

  return <IdeesRecuesClient ideas={JSON.parse(JSON.stringify(ideas))} />
}
