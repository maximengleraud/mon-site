// Remplace les mesures génériques (sans titre, sans note ni proposition) par les programmes officiels de data/programmes.
// Les mesures ayant des notes adoptées ou des propositions sont conservées.
import { PrismaClient } from '@prisma/client'
import { loadProgramme, createProgrammeFromJson } from './programmes-lib'

const prisma = new PrismaClient()

async function main() {
  const parties = await prisma.party.findMany({ select: { id: true, slug: true } })
  for (const party of parties) {
    const prog = loadProgramme(party.slug)
    if (!prog) { console.log(`${party.slug}: pas de fichier, ignoré`); continue }
    const generic = await prisma.programPoint.findMany({
      where: { title: null, theme: { partyId: party.id }, adoptedNotes: { none: {} }, noteProposals: { none: {} } },
      select: { id: true },
    })
    for (const p of generic) await prisma.programPoint.delete({ where: { id: p.id } })
    const emptyThemes = await prisma.programTheme.findMany({ where: { partyId: party.id, points: { none: {} } }, select: { id: true } })
    for (const t of emptyThemes) await prisma.programTheme.delete({ where: { id: t.id } })
    const created = await createProgrammeFromJson(prisma, party.id, prog)
    console.log(`${party.slug}: ${generic.length} génériques retirées, ${created} mesures créées`)
  }
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
