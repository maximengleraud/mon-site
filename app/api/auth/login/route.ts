export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { signIn } from '@/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body ?? {}
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erreur de connexion' }, { status: 500 })
  }
}
