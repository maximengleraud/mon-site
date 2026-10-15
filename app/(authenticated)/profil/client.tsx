'use client'
import { useState } from 'react'
import { User, Shield, Trophy, Trash2, ArrowRightLeft, Settings } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { SafeDate } from '@/components/safe-format'
import Link from 'next/link'

export function ProfilClient({ user }: { user: any }) {
  const { update } = useSession()
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [switching, setSwitching] = useState(false)

  const toggleMode = async () => {
    setSwitching(true)
    try {
      const newMode = user?.mode === 'COMPETITION' ? 'TRANQUILLITE' : 'COMPETITION'
      const res = await fetch('/api/profile/mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: newMode }) })
      if (res.ok) {
        await update({ mode: newMode })
        toast.success(`Mode ${newMode === 'COMPETITION' ? 'Compétition' : 'Tranquillité'} activé`)
        router.refresh()
      } else toast.error('Erreur')
    } catch { toast.error('Erreur') }
    setSwitching(false)
  }

  const toggleShowPartyChange = async () => {
    try {
      const res = await fetch('/api/profile/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ showPartyChange: !user?.showPartyChange }) })
      if (res.ok) { toast.success('Paramètre mis à jour'); router.refresh() }
    } catch { toast.error('Erreur') }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/profile/delete', { method: 'POST' })
      if (res.ok) { toast.success('Compte supprimé'); signOut({ redirectTo: '/' }) }
      else toast.error('Erreur')
    } catch { toast.error('Erreur') }
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><User className="w-6 h-6" /> Mon profil</h1>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: user?.party?.colorHex ?? '#2563EB' }}>
            {user?.pseudo?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{user?.pseudo}</h2>
            <p className="text-sm text-muted-foreground">{user?.party?.acronym} — {user?.party?.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Membre depuis <SafeDate date={user?.createdAt} options={{ dateStyle: 'long' }} /></p>
          </div>
        </div>
      </div>

      {/* Mode */}
      <div className="bg-card rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.mode === 'COMPETITION' ? <Trophy className="w-5 h-5 text-blue-600" /> : <Shield className="w-5 h-5 text-gray-500" />}
            <div>
              <p className="font-medium text-sm">Mode {user?.mode === 'COMPETITION' ? 'Compétition' : 'Tranquillité'}</p>
              <p className="text-xs text-muted-foreground">{user?.mode === 'COMPETITION' ? 'Points et classement actifs' : 'Contributions anonymes'}</p>
            </div>
          </div>
          <button onClick={toggleMode} disabled={switching} className="text-sm text-blue-600 font-semibold hover:underline disabled:opacity-50">
            {switching ? 'Changement...' : 'Changer'}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Settings className="w-4 h-4" /> Paramètres</h3>
        <label className="flex items-center justify-between">
          <span className="text-sm">Afficher mes changements de parti</span>
          <input type="checkbox" checked={user?.showPartyChange ?? true} onChange={toggleShowPartyChange} className="w-4 h-4" />
        </label>
      </div>

      {/* Change party */}
      <Link href="/profil/changer-parti" className="flex items-center gap-3 bg-card rounded-xl border shadow-sm p-5 hover:bg-accent/50 transition-colors">
        <ArrowRightLeft className="w-5 h-5 text-amber-500" />
        <div>
          <p className="font-medium text-sm">Changer de parti</p>
          <p className="text-xs text-muted-foreground">Votre solde de points sera remis à zéro</p>
        </div>
      </Link>

      {/* Delete account */}
      <div className="bg-card rounded-xl border border-red-200 shadow-sm p-5">
        <button onClick={() => setShowDelete(!showDelete)} className="flex items-center gap-2 text-red-600 text-sm font-semibold">
          <Trash2 className="w-4 h-4" /> Supprimer mon compte
        </button>
        {showDelete && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
            <p className="text-sm text-red-700">Cette action est irréversible. Vos données personnelles seront anonymisées.</p>
            <div className="flex gap-2">
              <button onClick={deleteAccount} disabled={deleting} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">{deleting ? 'Suppression...' : 'Confirmer la suppression'}</button>
              <button onClick={() => setShowDelete(false)} className="text-sm text-muted-foreground hover:text-foreground">Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
