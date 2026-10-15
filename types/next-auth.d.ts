import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      mode: string
      partyId: string | null
      partySlug: string | null
      partyColor: string
      partyAcronym: string
      pseudo: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    mode: string
    partyId: string | null
    partySlug: string | null
    partyColor: string
    partyAcronym: string
    pseudo: string
  }
}
