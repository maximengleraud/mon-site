import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { loadProgramme, createProgrammeFromJson } from './programmes-lib'

const prisma = new PrismaClient()

const PARTIES = [
  { slug: 'npa', acronym: 'NPA', name: 'Nouveau Parti anticapitaliste', fullName: 'Nouveau Parti anticapitaliste', category: 'Extrême gauche', colorHex: '#8B0000', description: 'Parti anticapitaliste et révolutionnaire.' },
  { slug: 'lo', acronym: 'LO', name: 'Lutte ouvrière', fullName: 'Lutte ouvrière', category: 'Extrême gauche', colorHex: '#8B0000', description: 'Parti trotskyste défendant les travailleurs.' },
  { slug: 'lfi', acronym: 'LFI', name: 'La France insoumise', fullName: 'La France insoumise', category: 'Gauche radicale', colorHex: '#CC0000', description: 'Mouvement de gauche radicale fondé par Jean-Luc Mélenchon.' },
  { slug: 'ps', acronym: 'PS', name: 'Parti socialiste', fullName: 'Parti socialiste', category: 'Gauche', colorHex: '#E53E3E', description: 'Parti social-démocrate historique.' },
  { slug: 'eelv', acronym: 'EELV', name: 'Les Écologistes', fullName: 'Europe Écologie Les Verts', category: 'Gauche', colorHex: '#38A169', description: 'Parti écologiste engagé pour la transition.' },
  { slug: 'pcf', acronym: 'PCF', name: 'Parti communiste français', fullName: 'Parti communiste français', category: 'Gauche', colorHex: '#E53E3E', description: 'Parti communiste historique.' },
  { slug: 're', acronym: 'RE', name: 'Renaissance', fullName: 'Renaissance', category: 'Centre et bloc central', colorHex: '#9CA3AF', description: 'Parti centriste présidentiel.' },
  { slug: 'modem', acronym: 'MoDem', name: 'Mouvement démocrate', fullName: 'Mouvement démocrate', category: 'Centre et bloc central', colorHex: '#F59E0B', description: 'Parti centriste fondé par François Bayrou.' },
  { slug: 'horizons', acronym: 'HOR', name: 'Horizons', fullName: 'Horizons', category: 'Centre et bloc central', colorHex: '#3B82F6', description: 'Parti de centre droit fondé par Édouard Philippe.' },
  { slug: 'lr', acronym: 'LR', name: 'Les Républicains', fullName: 'Les Républicains', category: 'Droite et centre droit', colorHex: '#2563EB', description: 'Parti de droite républicaine.' },
  { slug: 'udi', acronym: 'UDI', name: 'Union des démocrates et indépendants', fullName: 'Union des démocrates et indépendants', category: 'Droite et centre droit', colorHex: '#60A5FA', description: 'Confédération de partis centristes.' },
  { slug: 'rn', acronym: 'RN', name: 'Rassemblement national', fullName: 'Rassemblement national', category: 'Extrême droite', colorHex: '#1E3A8A', description: 'Parti national-populiste.' },
  { slug: 'reconquete', acronym: 'REC', name: 'Reconquête', fullName: 'Reconquête', category: 'Extrême droite', colorHex: '#1E3A8A', description: 'Parti fondé par Éric Zemmour.' },
  { slug: 'dlf', acronym: 'DLF', name: 'Debout La France', fullName: 'Debout La France', category: 'Extrême droite', colorHex: '#1E40AF', description: 'Parti souverainiste gaulliste.' },
]

const THEMES = ['Économie', 'Fiscalité', 'Éducation', 'Santé', 'Sécurité', 'Immigration', 'Environnement', 'Énergie', 'Institutions', 'Politique étrangère', 'Travail', 'Logement']

const SAMPLE_POINTS: Record<string, string[]> = {
  'Économie': ['Soutenir les PME et artisans locaux par des aides ciblées.', 'Renforcer la souveraineté économique nationale.', 'Promouvoir l\'économie circulaire et durable.'],
  'Fiscalité': ['Réformer l\'impôt sur le revenu pour plus de progressivité.', 'Lutter contre l\'évasion fiscale internationale.', 'Baisser la TVA sur les produits de première nécessité.'],
  'Éducation': ['Réduire le nombre d\'élèves par classe à 20 maximum.', 'Revaloriser les salaires des enseignants.', 'Renforcer l\'éducation civique et numérique.'],
  'Santé': ['Garantir l\'accès aux soins en zone rurale.', 'Recruter 10 000 soignants supplémentaires.', 'Investir dans la prévention et la santé mentale.'],
  'Sécurité': ['Augmenter les effectifs de police et gendarmerie.', 'Moderniser la justice pour réduire les délais.', 'Renforcer la vidéoprotection dans les villes.'],
  'Immigration': ['Accélérer le traitement des demandes d\'asile.', 'Renforcer l\'intégration par la langue et l\'emploi.', 'Coopérer avec les pays d\'origine pour le co-développement.'],
  'Environnement': ['Atteindre la neutralité carbone d\'ici 2050.', 'Interdire les pesticides les plus dangereux.', 'Créer des corridors écologiques sur tout le territoire.'],
  'Énergie': ['Développer massivement les énergies renouvelables.', 'Rénover 500 000 logements par an.', 'Maintenir le nucléaire comme énergie de transition.'],
  'Institutions': ['Introduire une dose de proportionnelle aux législatives.', 'Limiter le cumul des mandats dans le temps.', 'Renforcer le pouvoir du Parlement.'],
  'Politique étrangère': ['Renforcer la défense européenne commune.', 'Maintenir l\'engagement français dans l\'OTAN.', 'Augmenter l\'aide au développement.'],
  'Travail': ['Passer à la semaine de 4 jours pour les volontaires.', 'Revaloriser le SMIC et les bas salaires.', 'Faciliter le télétravail et le droit à la déconnexion.'],
  'Logement': ['Encadrer les loyers dans les zones tendues.', 'Construire 150 000 logements sociaux par an.', 'Lutter contre les passoires thermiques.'],
}

async function main() {
  console.log('Seeding parties...')
  const partyRecords: Record<string, string> = {}
  for (const p of PARTIES) {
    const party = await prisma.party.upsert({
      where: { slug: p.slug },
      update: { ...p },
      create: { ...p },
    })
    partyRecords[p.slug] = party.id
  }

  console.log('Seeding program themes and points...')
  for (const partySlug of Object.keys(partyRecords)) {
    const partyId = partyRecords[partySlug]
    // Programme officiel (data/programmes/<slug>.json) en priorité
    const prog = loadProgramme(partySlug)
    if (prog) {
      const themeCount = await prisma.programTheme.count({ where: { partyId } })
      if (themeCount === 0) await createProgrammeFromJson(prisma, partyId, prog)
      continue
    }
    for (let ti = 0; ti < THEMES.length; ti++) {
      const themeName = THEMES[ti]
      const existing = await prisma.programTheme.findFirst({ where: { partyId, title: themeName } })
      if (existing) continue
      const theme = await prisma.programTheme.create({
        data: { partyId, title: themeName, order: ti },
      })
      const points = SAMPLE_POINTS[themeName] ?? []
      for (let pi = 0; pi < points.length; pi++) {
        await prisma.programPoint.create({
          data: { themeId: theme.id, content: points[pi], order: pi },
        })
      }
    }
  }

  // Hidden test account
  console.log('Seeding test account...')
  const testHash = await bcrypt.hash('c1lCh78O3*', 12)
  await prisma.user.upsert({
    where: { email: 'abacus-604303d7@example.com' },
    update: {},
    create: {
      email: 'abacus-604303d7@example.com',
      hashedPassword: testHash,
      pseudo: 'TestAdmin',
      role: 'ADMIN',
      mode: 'COMPETITION',
      partyId: partyRecords['re'],
    },
  })

  // Admin account
  console.log('Seeding admin account...')
  const adminHash = await bcrypt.hash('Bibao66650@', 12)
  await prisma.user.upsert({
    where: { email: 'maximeengleraud@gmail.com' },
    update: {},
    create: {
      email: 'maximeengleraud@gmail.com',
      hashedPassword: adminHash,
      pseudo: 'maxou',
      role: 'ADMIN',
      mode: 'COMPETITION',
      partyId: partyRecords['lfi'],
    },
  })

  // Sample users for testing
  const sampleUsers = [
    { email: 'alice@test.fr', pseudo: 'Alice_LFI', partySlug: 'lfi', mode: 'COMPETITION' as const },
    { email: 'bob@test.fr', pseudo: 'Bob_PS', partySlug: 'ps', mode: 'COMPETITION' as const },
    { email: 'claire@test.fr', pseudo: 'Claire_LR', partySlug: 'lr', mode: 'TRANQUILLITE' as const },
    { email: 'david@test.fr', pseudo: 'David_RN', partySlug: 'rn', mode: 'COMPETITION' as const },
    { email: 'emma@test.fr', pseudo: 'Emma_EELV', partySlug: 'eelv', mode: 'COMPETITION' as const },
  ]
  const testPwd = await bcrypt.hash('Test1234!', 12)
  for (const su of sampleUsers) {
    await prisma.user.upsert({
      where: { email: su.email },
      update: {},
      create: {
        email: su.email,
        hashedPassword: testPwd,
        pseudo: su.pseudo,
        role: 'USER',
        mode: su.mode,
        partyId: partyRecords[su.partySlug],
        pointsBalance: Math.floor(Math.random() * 500),
      },
    })
  }

  // Sample ideas
  console.log('Seeding sample ideas...')
  const alice = await prisma.user.findUnique({ where: { email: 'alice@test.fr' } })
  const bob = await prisma.user.findUnique({ where: { email: 'bob@test.fr' } })
  if (alice && bob) {
    const ideaData = [
      { partyId: partyRecords['lfi'], authorId: alice.id, title: 'Taxe sur les superprofits', content: 'Instaurer une taxe exceptionnelle sur les superprofits des grandes entreprises pour financer la transition écologique.' },
      { partyId: partyRecords['lfi'], authorId: alice.id, title: 'Retraite à 60 ans', content: 'Revenir à l\'âge de départ à la retraite à 60 ans avec 40 annuités de cotisation.' },
      { partyId: partyRecords['ps'], authorId: bob.id, title: 'Service public de la petite enfance', content: 'Créer un grand service public de la petite enfance avec 200 000 nouvelles places en crèche.' },
    ]
    for (const idea of ideaData) {
      const existing = await prisma.idea.findFirst({ where: { title: idea.title, partyId: idea.partyId } })
      if (!existing) {
        await prisma.idea.create({ data: { ...idea, likesCount: Math.floor(Math.random() * 20), dislikesCount: Math.floor(Math.random() * 5) } })
      }
    }
  }

  console.log('Seed complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
