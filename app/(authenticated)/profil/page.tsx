import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProfilClient } from './client'

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pseudo: true, mode: true, role: true, pointsBalance: true, showPartyChange: true, createdAt: true, party: { select: { name: true, acronym: true, colorHex: true } } },
  })

  return <ProfilClient user={JSON.parse(JSON.stringify(user))} />
}
