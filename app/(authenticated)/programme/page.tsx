import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProgrammeClient } from './client'

export default async function ProgrammePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')
  const partyId = session.user.partyId
  if (!partyId) redirect('/dashboard')

  const themes = await prisma.programTheme.findMany({
    where: { partyId },
    orderBy: { order: 'asc' },
    include: {
      points: {
        orderBy: { order: 'asc' },
        include: {
          adoptedNotes: { where: { isArchived: false }, include: { author: { select: { pseudo: true, mode: true } } } },
          noteProposals: { where: { status: { in: ['PENDING', 'PHASE1', 'PHASE2'] } }, include: { author: { select: { pseudo: true, mode: true } } } },
        },
      },
    },
  })

  const party = await prisma.party.findUnique({ where: { id: partyId }, select: { name: true, slug: true, acronym: true, colorHex: true, programSource: true } })

  const serialized = JSON.parse(JSON.stringify(themes))

  return <ProgrammeClient themes={serialized} party={{ name: party?.name ?? '', slug: party?.slug ?? '', acronym: party?.acronym ?? '', colorHex: party?.colorHex ?? '#2563EB', programSource: party?.programSource ?? null }} userId={session.user.id} />
}
