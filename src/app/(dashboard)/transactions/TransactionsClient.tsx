'use client'

import { DollarSign, ExternalLink, Calendar as CalendarIcon, User } from 'lucide-react'

type Profile = { id: string; full_name?: string; username?: string; email?: string; phone?: string }
type Transaction = { 
  id: string; 
  user_id: string; 
  amount_dzd: number; 
  transaction_date: string; 
  status: string;
  plan_months: number;
  source: string;
}

export function TransactionsClient({ 
  transactions,
  profiles
}: { 
  transactions: Transaction[],
  profiles: Profile[]
}) {
  const getProfile = (userId: string) => {
    return profiles.find(p => p.id === userId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          Recent Transactions
        </h2>
        <div className="text-sm text-zinc-400">
          Showing {transactions.length} records
        </div>
      </div>

      <div className="bg-[#111827]/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const profile = getProfile(tx.user_id)
                  const displayName = profile?.full_name || profile?.username || profile?.email || profile?.phone || 'Unknown User'
                  
                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <CalendarIcon className="h-4 w-4 text-zinc-500" />
                          {new Date(tx.transaction_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                            <User className="h-4 w-4 text-zinc-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{displayName}</div>
                            <div className="text-xs text-zinc-500 font-mono">{tx.user_id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {tx.plan_months} Month{tx.plan_months > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-400">
                          {tx.amount_dzd.toLocaleString()} <span className="text-xs text-emerald-500/70 font-normal">DZD</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          tx.status.toLowerCase() === 'success' || tx.status.toLowerCase() === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            tx.status.toLowerCase() === 'success' || tx.status.toLowerCase() === 'paid' ? 'bg-emerald-400' : 'bg-zinc-400'
                          }`}></span>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
