'use client'

import { useState } from 'react'
import { Search, Filter, MoreVertical, X, Calendar, Edit2, Ban } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type UserWithSub = {
  id: string
  name: string
  email: string
  subscription: any
}

export function SubscriptionsClient({ initialData }: { initialData: UserWithSub[] }) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  
  const [selectedUser, setSelectedUser] = useState<UserWithSub | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  
  const supabase = createClient()

  // Filter logic
  const filteredData = data.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) || 
                          user.email?.toLowerCase().includes(search.toLowerCase())
    const userTier = user.subscription?.tier || 'Free'
    const matchesTier = tierFilter === 'All' || userTier === tierFilter
    const userStatus = user.subscription?.status || 'Active' // Free is considered Active generally
    const matchesStatus = statusFilter === 'All' || userStatus === statusFilter
    
    return matchesSearch && matchesTier && matchesStatus
  })

  const openDetails = async (user: UserWithSub) => {
    setSelectedUser(user)
    setLoadingTransactions(true)
    
    if (user.subscription) {
      const { data: txs } = await supabase
        .from('subscription_transactions')
        .select('*')
        .eq('subscription_id', user.subscription.id)
        .order('transaction_date', { ascending: false })
      setTransactions(txs || [])
    } else {
      setTransactions([])
    }
    
    setLoadingTransactions(false)
  }

  const handleAction = async (action: string) => {
    if (!selectedUser) return
    const confirmed = window.confirm(`Are you sure you want to ${action} for ${selectedUser.email}?`)
    if (!confirmed) return
    
    // Stub for actual update logic
    // This requires updating the 'subscriptions' table via supabase
    // Then refreshing the local state
    alert(`${action} executed successfully. (Backend link pending setup)`)
  }

  return (
    <div className="flex gap-6 relative">
      {/* Main Table Area */}
      <div className={`flex-1 transition-all duration-300 ${selectedUser ? 'w-2/3' : 'w-full'}`}>
        <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md overflow-hidden shadow-lg">
          
          {/* Controls */}
          <div className="p-4 border-b border-white/10 flex flex-wrap gap-4 items-center bg-white/5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1A73E8] appearance-none"
              >
                <option value="All">All Tiers</option>
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Popular">Popular</option>
                <option value="Premium">Premium</option>
              </select>
              
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1A73E8] appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="text-xs uppercase bg-black/40 text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Tier</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Interval</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => openDetails(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.name || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          ['Basic'].includes(user.subscription?.tier) ? 'bg-[#1A73E8]/10 text-[#1A73E8] border-[#1A73E8]/20' : 
                          ['Popular'].includes(user.subscription?.tier) ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20' : 
                          ['Premium', 'Pro', 'Business'].includes(user.subscription?.tier) ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 
                          'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}>
                          {user.subscription?.tier || 'Free'}
                        </span>
                        {user.subscription?.isManual && user.subscription?.tier !== 'Free' && user.subscription?.tier && (
                          <span className="text-[10px] text-zinc-500 font-medium px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/50">
                            Manual
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${
                        user.subscription?.status === 'Expired' ? 'text-red-400' :
                        user.subscription?.status === 'Cancelled' ? 'text-orange-400' : 'text-green-400'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          user.subscription?.status === 'Expired' ? 'bg-red-400' :
                          user.subscription?.status === 'Cancelled' ? 'bg-orange-400' : 'bg-green-400'
                        }`}></div>
                        {user.subscription?.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {user.subscription?.interval || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 hover:bg-white/10 rounded-md text-zinc-400 transition-colors" onClick={(e) => { e.stopPropagation(); openDetails(user); }}>
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No users found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-out Detail Panel */}
      {selectedUser && (
        <div className="w-1/3 rounded-xl border border-white/10 bg-[#111827] shadow-2xl flex flex-col h-[calc(100vh-140px)] sticky top-0 overflow-hidden animate-in slide-in-from-right-8 duration-300">
          <div className="p-5 border-b border-white/10 flex justify-between items-start bg-white/5">
            <div>
              <h2 className="text-lg font-semibold text-white">{selectedUser.name || 'User Details'}</h2>
              <p className="text-sm text-zinc-400">{selectedUser.email}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 uppercase tracking-wider">Current Plan</h3>
            
            <div className="bg-black/30 rounded-lg p-4 border border-white/5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-white">{selectedUser.subscription?.tier || 'Free'}</span>
                <span className="text-sm font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">
                  {selectedUser.subscription?.status || 'Active'}
                </span>
              </div>
              
              {selectedUser.subscription && (
                <div className="space-y-2 text-sm text-zinc-400 mb-4">
                  <div className="flex justify-between">
                    <span>Interval:</span>
                    <span className="text-white">{selectedUser.subscription.interval}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span className="text-white">{new Date(selectedUser.subscription.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {selectedUser.subscription.end_date && (
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className="text-white">{new Date(selectedUser.subscription.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
                <button onClick={() => handleAction('Change Tier')} className="flex items-center justify-center gap-2 bg-[#1A73E8]/10 hover:bg-[#1A73E8]/20 text-[#1A73E8] py-2 rounded-lg text-sm font-medium transition-colors">
                  <Edit2 className="h-3 w-3" /> Change Tier
                </button>
                <button onClick={() => handleAction('Extend Expiry')} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  <Calendar className="h-3 w-3" /> Extend Expiry
                </button>
                <button onClick={() => handleAction('Cancel Subscription')} className="col-span-2 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-sm font-medium transition-colors mt-1">
                  <Ban className="h-3 w-3" /> Cancel Subscription
                </button>
              </div>
            </div>

            <h3 className="text-sm font-medium text-zinc-300 mb-4 uppercase tracking-wider">Transaction History</h3>
            
            {loadingTransactions ? (
              <div className="text-center py-8 text-sm text-zinc-500">Loading history...</div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="bg-black/20 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-white">{tx.amount_dzd} DZD</div>
                      <div className="text-xs text-zinc-500">{new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-green-400">{tx.status}</div>
                      <div className="text-xs text-zinc-500">{tx.payment_method}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-zinc-500 bg-black/20 rounded-lg border border-white/5">
                No transactions found for this user.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
