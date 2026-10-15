import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ClassementClient } from './client'

export default async function ClassementPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')

  const [globalTop, partyTop, partyChanges] = await Promise.all([
    prisma.user.findMany({
      where: { mode: 'COMPETITION', deletedAt: null },
      orderBy: { pointsBalance: 'desc' },
      take: 50,
      select: { id: true, pseudo: true, pointsBalance: true, party: { select: { acronym: true, colorHex: true } } },
    }),
    session.user.partyId ? prisma.user.findMany({
      where: { partyId: session.user.partyId, mode: 'COMPETITION', deletedAt: null },
      orderBy: { pointsBalance: 'desc' },
      take: 50,
      select: { id: true, pseudo: true, pointsBalance: true },
    }) : [],
    prisma.partyChange.findMany({
      where: { isPublic: true, expiresAt: { gt: new Date() } },
      orderBy: { changedAt: 'desc' },
      take: 20,
      include: { user: { select: { pseudo: true, mode: true, showPartyChange: true } }, fromParty: { select: { acronym: true, colorHex: true } }, toParty: { select: { acronym: true, colorHex: true } } },
    }),
  ])

  return <ClassementClient
    globalTop={JSON.parse(JSON.stringify(globalTop))}
    partyTop={JSON.parse(JSON.stringify(partyTop))}
    partyChanges={JSON.parse(JSON.stringify(partyChanges?.filter((c: any) => c?.user?.showPartyChange && c?.user?.mode !== 'TRANQUILLITE')))}
    partyColor={session.user.partyColor}
    userId={session.user.id}
  />
}
