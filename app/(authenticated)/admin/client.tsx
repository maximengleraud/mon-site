'use client'
import { Shield, Users, BookOpen, Lightbulb, Flag, MessageSquare, Check, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { SafeDate } from '@/components/safe-format'

export function AdminClient({ stats, recentReports, pendingCrossParty }: { stats: any; recentReports: any[]; pendingCrossParty: any[] }) {
  const [reports, setReports] = useState(recentReports ?? [])
  const [crossParty, setCrossParty] = useState(pendingCrossParty ?? [])

  const resolveReport = async (id: string, action: 'RESOLVED' | 'DISMISSED') => {
    try {
      const res = await fetch('/api/admin/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: id, action }) })
      if (res.ok) { setReports(prev => (prev ?? []).filter((r: any) => r?.id !== id)); toast.success('Signalement traité') }
    } catch { toast.error('Erreur') }
  }

  const handleCrossParty = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/admin/cross-party', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) })
      if (res.ok) { setCrossParty(prev => (prev ?? []).filter((c: any) => c?.id !== id)); toast.success(action === 'APPROVED' ? 'Idée approuvée' : 'Idée rejetée') }
    } catch { toast.error('Erreur') }
  }

  const statCards = [
    { icon: Users, label: 'Utilisateurs', value: stats?.userCount ?? 0, color: 'bg-blue-100 text-blue-700' },
    { icon: BookOpen, label: 'Propositions actives', value: stats?.proposalCount ?? 0, color: 'bg-purple-100 text-purple-700' },
    { icon: Lightbulb, label: 'Idées actives', value: stats?.ideaCount ?? 0, color: 'bg-amber-100 text-amber-700' },
    { icon: Flag, label: 'Signalements', value: stats?.reportCount ?? 0, color: 'bg-red-100 text-red-700' },
    { icon: MessageSquare, label: 'Idées inter-partis', value: stats?.crossPartyCount ?? 0, color: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Shield className="w-6 h-6" /> Administration</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border p-4 text-center">
            <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold font-mono">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reports */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-4 border-b"><h2 className="font-semibold text-sm flex items-center gap-2"><Flag className="w-4 h-4" /> Signalements en attente</h2></div>
        <div className="divide-y">
          {(reports ?? []).map((r: any) => (
            <div key={r?.id} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium">{r?.targetType} #{r?.targetId?.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{r?.reason}</p>
                <p className="text-xs text-muted-foreground">par {r?.reporter?.pseudo ?? 'Membre'}</p>
              </div>
              <button onClick={() => resolveReport(r?.id, 'RESOLVED')} className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"><Check className="w-4 h-4" /></button>
              <button onClick={() => resolveReport(r?.id, 'DISMISSED')} className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {(reports?.length ?? 0) === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Aucun signalement.</p>}
        </div>
      </div>

      {/* Cross-party moderation */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-4 border-b"><h2 className="font-semibold text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Idées inter-partis à modérer</h2></div>
        <div className="divide-y">
          {(crossParty ?? []).map((c: any) => (
            <div key={c?.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{c?.fromParty?.acronym} → {c?.toParty?.acronym}</span>
                <span className="text-xs text-muted-foreground">par {c?.author?.pseudo ?? 'Membre'}</span>
              </div>
              <h3 className="text-sm font-medium">{c?.title}</h3>
              <p className="text-sm text-muted-foreground">{c?.content}</p>
              <div className="flex gap-2">
                <button onClick={() => handleCrossParty(c?.id, 'APPROVED')} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"><Check className="w-3 h-3" /> Approuver</button>
                <button onClick={() => handleCrossParty(c?.id, 'REJECTED')} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"><X className="w-3 h-3" /> Rejeter</button>
              </div>
            </div>
          ))}
          {(crossParty?.length ?? 0) === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Aucune idée à modérer.</p>}
        </div>
      </div>
    </div>
  )
}
