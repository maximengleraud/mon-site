import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { VotesClient } from './client'

export default async function VotesPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')

  const sessions = await prisma.votingSession.findMany({
    where: { result: 'PENDING', eligibleUserIds: { has: session.user.id } },
    include: {
      proposal: { include: { point: { include: { theme: true } }, author: { select: { pseudo: true, mode: true } } } },
      votes: { where: { userId: session.user.id } },
    },
    orderBy: { endsAt: 'asc' },
  })

  const serialized = JSON.parse(JSON.stringify(sessions))
  return <VotesClient sessions={serialized} />
}
