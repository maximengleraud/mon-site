import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { ReceivedIdeasPopup } from '@/components/received-ideas'
import { getReceivedIdeas } from '@/lib/received-ideas'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/connexion')
  const receivedIdeas = await getReceivedIdeas(session.user.partyId).catch((e) => { console.error('Idées reçues indisponibles', e); return [] })

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <ReceivedIdeasPopup ideas={receivedIdeas} />
      <main className="flex-1 lg:ml-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 pt-16 lg:pt-6 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
