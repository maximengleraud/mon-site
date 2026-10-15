export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  try {
    const { id, action } = await req.json()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

    await prisma.crossPartyIdea.update({
      where: { id },
      data: { status: action, ...(action === 'APPROVED' ? { approvedAt: now, expiresAt } : {}) },
    })
    await prisma.auditLog.create({ data: { adminId: session.user.id, action: `cross_party_${action?.toLowerCase()}`, targetType: 'CrossPartyIdea', targetId: id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Erreur' }, { status: 500 }) }
}
