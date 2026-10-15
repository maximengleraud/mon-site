import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { MesPointsClient } from './client'

export default async function MesPointsPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { pointsBalance: true, mode: true } }),
    prisma.pointTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  return <MesPointsClient
    points={user?.pointsBalance ?? 0}
    mode={user?.mode ?? 'COMPETITION'}
    transactions={JSON.parse(JSON.stringify(transactions))}
  />
}
