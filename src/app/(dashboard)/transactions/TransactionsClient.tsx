'use client'

import { useState } from 'react'
import { DollarSign, Calendar as CalendarIcon, User, Search, Filter } from 'lucide-react'

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
  profiles,
  fetchError
}: { 
  transactions: Transaction[], 
  profiles: Profile[],
  fetchError?: string | null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')

  const getProfile = (userId: string) => {
    if (!userId) return undefined
    const cleanId = userId.trim().toLowerCase()
    return profiles.find(p => p.id.toLowerCase() === cleanId)
  }

  const filteredTransactions = transactions.filter(tx => {
    const profile = getProfile(tx.user_id)
    
    // Status Filter
    if (statusFilter !== 'all' && tx.status.toLowerCase() !== statusFilter.toLowerCase()) return false
    
    // Plan Filter
    if (planFilter !== 'all' && tx.plan_months.toString() !== planFilter) return false

    // Search Query (User Name, Email, ID)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const nameMatch = profile?.full_name?.toLowerCase().includes(q)
      const emailMatch = profile?.email?.toLowerCase().includes(q)
      const idMatch = tx.user_id.toLowerCase().includes(q)
      
      if (!nameMatch && !emailMatch && !idMatch) return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          Recent Transactions
        </h2>
        <div className="text-sm text-zinc-400">
          Showing {filteredTransactions.length} records
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-[#111827]/60 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 sm:text-sm backdrop-blur-md"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-zinc-500" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-8 py-2 border border-white/10 rounded-lg leading-5 bg-[#111827]/60 text-zinc-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 sm:text-sm backdrop-blur-md appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="block w-full pl-3 pr-8 py-2 border border-white/10 rounded-lg leading-5 bg-[#111827]/60 text-zinc-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 sm:text-sm backdrop-blur-md appearance-none"
          >
            <option value="all">All Plans</option>
            <option value="1">1 Month</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">12 Months</option>
          </select>
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
              {fetchError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-red-400 font-medium mb-1">Error Loading Transactions</div>
                    <div className="text-red-400/70 text-sm">{fetchError}</div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const profile = getProfile(tx.user_id)
                  
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
                          <div className="flex flex-col">
                            <div className="font-medium text-white">
                              {profile?.full_name || 'Unknown User'}
                            </div>
                            {profile?.email && (
                              <div className="text-xs text-zinc-400">{profile.email}</div>
                            )}
                            {profile?.phone && (
                              <div className="text-xs text-zinc-500">{profile.phone}</div>
                            )}
                            <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{tx.user_id.slice(0, 8)}...</div>
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
