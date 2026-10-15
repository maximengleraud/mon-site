import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ChangerPartiClient } from './client'

export default async function ChangerPartiPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')

  const parties = await prisma.party.findMany({ where: { isActive: true }, orderBy: { slug: 'asc' } })
  return <ChangerPartiClient parties={JSON.parse(JSON.stringify(parties))} currentPartyId={session.user.partyId ?? ''} />
}
