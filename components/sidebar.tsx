'use client'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Vote, Lightbulb, Trophy, ArrowRightLeft, MessageSquare, User, Settings, Shield, Coins, Menu, X, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const userNav = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/programme', label: 'Programme', icon: BookOpen },
  { href: '/votes', label: 'Votes en cours', icon: Vote },
  { href: '/idees', label: 'Boîte à idées', icon: Lightbulb },
  { href: '/classement', label: 'Classement', icon: Trophy },
  { href: '/idees-recues', label: 'Idées reçues', icon: MessageSquare },
  { href: '/mes-points', label: 'Mes points', icon: Coins },
  { href: '/profil', label: 'Profil', icon: User },
]

const adminNav = [
  { href: '/admin', label: 'Admin', icon: Shield },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const partyColor = session?.user?.partyColor ?? '#2563EB'
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR'

  const allNav = [...userNav, ...(isAdmin ? adminNav : [])]

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card shadow-md"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: partyColor }}>
              {session?.user?.partyAcronym?.slice(0, 2) ?? 'PP'}
            </div>
            <span className="font-display font-bold text-sm">Plateforme Politique</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1"><X className="w-4 h-4" /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {allNav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'text-white font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                style={active ? { backgroundColor: partyColor } : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: partyColor }}>
              {session?.user?.pseudo?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.pseudo ?? 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.partyAcronym ?? ''} · {session?.user?.mode === 'COMPETITION' ? 'Compétition' : 'Tranquillité'}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectTo: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}
