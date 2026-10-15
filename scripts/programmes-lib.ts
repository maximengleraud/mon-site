import fs from 'fs'
import path from 'path'
import type { PrismaClient } from '@prisma/client'

export type ProgrammeJson = { source: string; themes: { title: string; points: { title: string; summary: string; details: string }[] }[] }

export function loadProgramme(slug: string): ProgrammeJson | null {
  const file = path.resolve(process.cwd(), 'data/programmes', `${slug}.json`)
  if (!fs.existsSync(file)) return null
  const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as ProgrammeJson
  return data?.themes?.length ? data : null
}

/** Crée les thèmes/mesures manquants à partir du JSON officiel (aucune suppression). */
export async function createProgrammeFromJson(prisma: PrismaClient, partyId: string, prog: ProgrammeJson) {
  let created = 0
  for (let ti = 0; ti < prog.themes.length; ti++) {
    const t = prog.themes[ti]
    let theme = await prisma.programTheme.findFirst({ where: { partyId, title: t.title } })
    if (theme) await prisma.programTheme.update({ where: { id: theme.id }, data: { order: ti } })
    else theme = await prisma.programTheme.create({ data: { partyId, title: t.title, order: ti } })
    for (let pi = 0; pi < t.points.length; pi++) {
      const p = t.points[pi]
      const exists = await prisma.programPoint.findFirst({ where: { themeId: theme.id, title: p.title } })
      if (exists) {
        await prisma.programPoint.update({ where: { id: exists.id }, data: { content: p.summary, details: p.details, order: pi } })
      } else {
        await prisma.programPoint.create({ data: { themeId: theme.id, title: p.title, content: p.summary, details: p.details, order: pi, isOfficial: true } })
        created++
      }
    }
  }
  await prisma.party.update({ where: { id: partyId }, data: { programSource: prog.source } })
  return created
}
