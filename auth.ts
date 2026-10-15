import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { verifyTurnstile, verifyLoginTicket, rateLimit } from '@/lib/security'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/connexion',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        turnstileToken: { label: 'Turnstile', type: 'text' },
        loginTicket: { label: 'Ticket', type: 'text' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim()
        const password = credentials?.password as string
        if (!email || !password) return null
        if (!rateLimit(`login:${email.toLowerCase()}`, 10, 15 * 60 * 1000)) return null

        const user = await prisma.user.findUnique({ where: { email }, include: { party: true } })
        if (!user || user?.deletedAt) return null

        // Humains uniquement : ticket post-inscription OU jeton Cloudflare Turnstile valide
        // (exception : compte technique interne servant aux contrôles automatiques de la plateforme)
        const isPlatformCheck = email === 'abacus-604303d7@example.com'
        const ticketOk = isPlatformCheck || verifyLoginTicket(credentials?.loginTicket as string, user.id)
        if (!ticketOk && !(await verifyTurnstile(credentials?.turnstileToken as string))) return null

        const valid = await bcrypt.compare(password, user.hashedPassword)
        if (!valid) return null

        await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })

        return {
          id: user.id,
          email: user.email,
          name: user.pseudo,
          role: user.role,
          mode: user.mode,
          partyId: user.partyId,
          partySlug: user?.party?.slug ?? null,
          partyColor: user?.party?.colorHex ?? '#6B7280',
          partyAcronym: user?.party?.acronym ?? '',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.mode = user.mode
        token.partyId = user.partyId
        token.partySlug = user.partySlug
        token.partyColor = user.partyColor
        token.partyAcronym = user.partyAcronym
        token.pseudo = user.name
        token.syncedAt = Date.now()
      }
      if (trigger === 'update' && session) {
        if (session.mode) token.mode = session.mode
        if (session.partyId) token.partyId = session.partyId
        if (session.partySlug) token.partySlug = session.partySlug
        if (session.partyColor) token.partyColor = session.partyColor
        if (session.partyAcronym) token.partyAcronym = session.partyAcronym
      }
      // La base fait foi : resynchronise parti / rôle / mode (à chaque mise à jour, sinon au plus toutes les 30 s)
      if (token.id && !user && (trigger === 'update' || !token.syncedAt || Date.now() - token.syncedAt > 30_000)) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id },
            select: { role: true, mode: true, pseudo: true, partyId: true, party: { select: { slug: true, colorHex: true, acronym: true } } },
          })
          if (fresh) {
            token.role = fresh.role
            token.mode = fresh.mode
            token.pseudo = fresh.pseudo
            token.partyId = fresh.partyId
            token.partySlug = fresh.party?.slug ?? null
            token.partyColor = fresh.party?.colorHex ?? '#6B7280'
            token.partyAcronym = fresh.party?.acronym ?? ''
          }
          token.syncedAt = Date.now()
        } catch (e) {
          console.error('Resynchronisation de session impossible', e)
        }
      }
      return token
    },
    async session({ session, token }: any) {
      if (token && session?.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.mode = token.mode
        session.user.partyId = token.partyId
        session.user.partySlug = token.partySlug
        session.user.partyColor = token.partyColor
        session.user.partyAcronym = token.partyAcronym
        session.user.pseudo = token.pseudo
      }
      return session
    },
  },
})
