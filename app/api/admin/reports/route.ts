export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  try {
    const { reportId, action } = await req.json()
    await prisma.report.update({ where: { id: reportId }, data: { status: action, resolvedAt: new Date(), resolvedById: session.user.id } })
    await prisma.auditLog.create({ data: { adminId: session.user.id, action: `report_${action?.toLowerCase()}`, targetType: 'Report', targetId: reportId } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Erreur' }, { status: 500 }) }
}
