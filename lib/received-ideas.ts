import { prisma } from '@/lib/db'

export async function getReceivedIdeas(partyId: string | null | undefined) {
  if (!partyId) return []
  const ideas = await prisma.crossPartyIdea.findMany({
    where: { toPartyId: partyId, status: 'APPROVED', expiresAt: { gt: new Date() } },
    include: { fromParty: { select: { acronym: true, colorHex: true, name: true } }, author: { select: { pseudo: true, mode: true } } },
    orderBy: { approvedAt: 'desc' },
  })
  return JSON.parse(JSON.stringify(ideas))
}
