import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { IdeesClient } from './client'

export default async function IdeesPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')
  const partyId = session.user.partyId
  if (!partyId) redirect('/dashboard')

  const ideas = await prisma.idea.findMany({
    where: { partyId, status: 'ACTIVE' },
    include: {
      author: { select: { pseudo: true, mode: true } },
      ideaVotes: { where: { userId: session.user.id } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const serialized = JSON.parse(JSON.stringify(ideas))
  return <IdeesClient ideas={serialized} partyColor={session.user.partyColor} />
}
