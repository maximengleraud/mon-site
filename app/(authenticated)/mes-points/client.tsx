'use client'
import { Coins, ArrowUp, ArrowDown } from 'lucide-react'
import { SafeDate } from '@/components/safe-format'

export function MesPointsClient({ points, mode, transactions }: { points: number; mode: string; transactions: any[] }) {
  if (mode === 'TRANQUILLITE') {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Coins className="w-6 h-6" /> Mes points</h1>
        <div className="bg-card rounded-xl border p-8 text-center"><p className="text-muted-foreground">Le système de points n'est pas actif en mode Tranquillité.</p></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Coins className="w-6 h-6 text-yellow-500" /> Mes points</h1>
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-xl p-6 text-white">
        <p className="text-sm text-white font-medium">Solde actuel</p>
        <p className="text-4xl font-bold font-mono">{points} pts</p>
      </div>
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-4 border-b"><h2 className="font-semibold text-sm">Historique des transactions</h2></div>
        <div className="divide-y">
          {(transactions ?? []).map((t: any) => (
            <div key={t?.id} className="flex items-center gap-3 p-4">
              {(t?.amount ?? 0) > 0 ? <ArrowUp className="w-4 h-4 text-green-500" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
              <div className="flex-1">
                <p className="text-sm font-medium">{t?.description ?? 'Transaction'}</p>
                <SafeDate date={t?.createdAt} options={{ dateStyle: 'short', timeStyle: 'short' }} className="text-xs text-muted-foreground" />
              </div>
              <span className={`font-mono text-sm font-bold ${(t?.amount ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(t?.amount ?? 0) > 0 ? '+' : ''}{t?.amount ?? 0} pts
              </span>
            </div>
          ))}
          {(transactions?.length ?? 0) === 0 && <p className="text-center text-muted-foreground py-8">Aucune transaction pour le moment.</p>}
        </div>
      </div>
    </div>
  )
}
