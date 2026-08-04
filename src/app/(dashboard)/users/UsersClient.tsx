'use client'

import { useState } from 'react'
import { Search, MoreVertical, X, Mail, ShieldAlert, Trash2, CalendarPlus, Gift } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { updateUserSubscription } from './actions'

type UserProfile = {
  id: string
  full_name?: string
  email?: string
  avatar_url?: string
  company_name?: string
  job_title?: string
  created_at: string
  subscription_end_date?: string
  subscription?: {
    id: string
    tier: string
    status: string
    end_date: string
  } | null
  contacts_count?: number
}

export function UsersClient({ initialUsers }: { initialUsers: UserProfile[] }) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [customExpiryDate, setCustomExpiryDate] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const filteredUsers = users.filter(user => {
    return (
      (user.full_name?.toLowerCase().includes(search.toLowerCase()) || false) || 
      (user.email?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (user.company_name?.toLowerCase().includes(search.toLowerCase()) || false)
    )
  })

  const handleDeleteUser = async (id: string) => {
    const confirmed = window.confirm('WARNING: Are you sure you want to completely delete this user and all their data? This action cannot be undone.')
    if (!confirmed) return

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      
      setUsers(prev => prev.filter(u => u.id !== id))
      if (selectedUser?.id === id) setSelectedUser(null)
      alert('User deleted successfully.')
      router.refresh()
    } catch (err: any) {
      alert('Failed to delete user. Please ensure cascading deletes are configured or use an Edge Function with service_role. Error: ' + err.message)
    }
  }

  const handleSuspendUser = async (id: string) => {
    const confirmed = window.confirm('Suspend this user account?')
    if (!confirmed) return
    alert('Suspend feature requires a custom field in profiles or calling an Edge Function. (Pending Backend setup)')
  }

  const handleGrantTrial = async (userId: string) => {
    const confirmed = window.confirm('Grant this user a 14-day Premium Free Trial?')
    if (!confirmed) return

    setIsUpdating(true)
    try {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      await updateUserSubscription(userId, d.toISOString(), 'Premium', 'Active')
      alert('14-Day Free Trial granted successfully.')
      router.refresh()
      setSelectedUser(prev => prev ? { ...prev, subscription_end_date: d.toISOString(), subscription: { id: 'new', tier: 'Premium', status: 'Active', end_date: d.toISOString() } } : null)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_end_date: d.toISOString(), subscription: { id: 'new', tier: 'Premium', status: 'Active', end_date: d.toISOString() } } : u))
    } catch (err: any) {
      alert('Error updating subscription: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleExtendSub = async (userId: string, currentEndDate?: string) => {
    const confirmed = window.confirm('Extend this subscription by 1 month?')
    if (!confirmed) return

    setIsUpdating(true)
    try {
      const d = currentEndDate ? new Date(currentEndDate) : new Date()
      if (d < new Date()) {
        d.setTime(new Date().getTime())
      }
      d.setMonth(d.getMonth() + 1)
      
      await updateUserSubscription(userId, d.toISOString(), selectedUser?.subscription?.tier || 'Premium', 'Active')
      alert('Subscription extended by 1 month successfully.')
      router.refresh()
      setSelectedUser(prev => prev ? { ...prev, subscription_end_date: d.toISOString(), subscription: { ...prev.subscription, tier: prev.subscription?.tier || 'Premium', status: 'Active', end_date: d.toISOString(), id: prev.subscription?.id || 'new' } } : null)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_end_date: d.toISOString(), subscription: { ...u.subscription, tier: u.subscription?.tier || 'Premium', status: 'Active', end_date: d.toISOString(), id: u.subscription?.id || 'new' } } : u))
    } catch (err: any) {
      alert('Error updating subscription: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSetCustomExpiry = async (userId: string, targetDateStr: string) => {
    if (!targetDateStr) {
      alert("Please select a date and time first.");
      return;
    }
    const confirmed = window.confirm(`Set expiry date to ${new Date(targetDateStr).toLocaleString()}?`)
    if (!confirmed) return

    setIsUpdating(true)
    try {
      const d = new Date(targetDateStr)
      const newStatus = d < new Date() ? 'Expired' : 'Active'
      await updateUserSubscription(userId, d.toISOString(), selectedUser?.subscription?.tier || 'Premium', newStatus)
      alert('Subscription expiry updated successfully.')
      router.refresh()
      setSelectedUser(prev => prev ? { ...prev, subscription_end_date: d.toISOString(), subscription: { ...prev.subscription, tier: prev.subscription?.tier || 'Premium', status: newStatus, end_date: d.toISOString(), id: prev.subscription?.id || 'new' } } : null)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_end_date: d.toISOString(), subscription: { ...u.subscription, tier: u.subscription?.tier || 'Premium', status: newStatus, end_date: d.toISOString(), id: u.subscription?.id || 'new' } } : u))
    } catch (err: any) {
      alert('Error updating subscription: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex gap-6 relative">
      <div className={`flex-1 transition-all duration-300 ${selectedUser ? 'w-2/3' : 'w-full'}`}>
        <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md overflow-hidden shadow-lg">
          
          <div className="p-4 border-b border-white/10 flex items-center bg-white/5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search users by name, email, or company..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
            <div className="ml-auto text-sm text-zinc-400">
              Total: {filteredUsers.length}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="text-xs uppercase bg-black/40 text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">User Profile</th>
                  <th className="px-6 py-4 font-medium">Company / Job</th>
                  <th className="px-6 py-4 font-medium">Tier</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#1A73E8]/20 flex items-center justify-center font-bold text-[#1A73E8] border border-[#1A73E8]/30 overflow-hidden shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name || ''} className="h-full w-full object-cover" />
                          ) : (
                            user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.full_name || 'No Name Provided'}</div>
                          <div className="text-xs text-zinc-500">{user.email || 'No email available'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{user.company_name || '-'}</div>
                      <div className="text-xs text-zinc-500">{user.job_title || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        ['Basic', 'Popular', 'Premium', 'Pro', 'Business'].includes(user.subscription?.tier || '')
                          ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                          : 'bg-white/5 text-zinc-400 border-white/10'
                      }`}>
                        {user.subscription?.tier || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 hover:bg-white/10 rounded-md text-zinc-400 transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}>
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No users match your search.
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
        <div className="w-1/3 rounded-xl border border-white/10 bg-[#111827] shadow-2xl flex flex-col h-[calc(100vh-140px)] sticky top-0 animate-in slide-in-from-right-8 duration-300">
          <div className="p-5 border-b border-white/10 flex justify-between items-start bg-white/5">
            <div>
              <h2 className="text-lg font-semibold text-white">User Details</h2>
            </div>
            <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative h-20 w-20 rounded-full bg-[#1A73E8]/20 flex items-center justify-center font-bold text-2xl text-[#1A73E8] border border-[#1A73E8]/30 mb-4 overflow-visible">
                <div className="h-full w-full rounded-full overflow-hidden flex justify-center items-center">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt={selectedUser.full_name || ''} className="h-full w-full object-cover" />
                  ) : (
                    selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : '?'
                  )}
                </div>
                {['Basic', 'Popular', 'Premium', 'Pro', 'Business'].includes(selectedUser.subscription?.tier || '') && (
                  <div className="absolute -bottom-1 -right-1 bg-[#10B981] text-black text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[#111827]">
                    {selectedUser.subscription?.tier.toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-white">{selectedUser.full_name || 'Unnamed User'}</h3>
              <p className="text-zinc-400 mt-1">{selectedUser.email || 'No Email Provided'}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
                Joined {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown'}
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-white/5 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Company:</span>
                <span className="text-sm text-white font-medium">{selectedUser.company_name || 'Not Provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Job Title:</span>
                <span className="text-sm text-white font-medium">{selectedUser.job_title || 'Not Provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Contacts:</span>
                <span className="text-sm text-white font-medium">{selectedUser.contacts_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">User ID:</span>
                <span className="text-xs text-zinc-500 font-mono truncate max-w-[150px]">{selectedUser.id}</span>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Subscription Management</h4>
            <div className="bg-black/30 rounded-lg p-4 border border-white/5 mb-8 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Current Tier:</span>
                <span className={`text-sm font-medium ${selectedUser.subscription?.tier === 'Basic' || selectedUser.subscription?.tier === 'Popular' || selectedUser.subscription?.tier === 'Premium' ? 'text-[#10B981]' : 'text-white'}`}>
                  {selectedUser.subscription?.tier || 'Free'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">End Date:</span>
                <span className="text-white">
                  {selectedUser.subscription_end_date 
                    ? new Date(selectedUser.subscription_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                    : selectedUser.subscription?.end_date 
                      ? new Date(selectedUser.subscription.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                      : '-'}
                </span>
              </div>

              <div className="pt-3 border-t border-white/5 flex gap-2">
                <button 
                  onClick={() => handleGrantTrial(selectedUser.id)}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#1A73E8]/10 hover:bg-[#1A73E8]/20 text-[#1A73E8] py-2 rounded-md text-xs font-medium transition-colors border border-[#1A73E8]/20 disabled:opacity-50"
                >
                  <Gift className="h-3.5 w-3.5" /> 14-Day Trial
                </button>
                <button 
                  onClick={() => handleExtendSub(selectedUser.id, selectedUser.subscription_end_date || selectedUser.subscription?.end_date)}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] py-2 rounded-md text-xs font-medium transition-colors border border-[#10B981]/20 disabled:opacity-50"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> +1 Month
                </button>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="text-xs text-zinc-500 font-medium">Set Custom Expiry Date & Time</div>
                <div className="flex gap-2">
                  <input 
                    type="datetime-local" 
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#1A73E8]"
                  />
                  <button 
                    onClick={() => handleSetCustomExpiry(selectedUser.id, customExpiryDate)}
                    disabled={isUpdating || !customExpiryDate}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-white/10 disabled:opacity-50"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Admin Actions</h4>
            <div className="space-y-2">
              <a href={selectedUser.email ? `mailto:${selectedUser.email}` : '#'} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg text-sm font-medium transition-colors border border-white/5">
                <Mail className="h-4 w-4" /> Email User
              </a>
              
              <button 
                onClick={() => handleSuspendUser(selectedUser.id)} 
                className="w-full flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 py-2.5 rounded-lg text-sm font-medium transition-colors border border-orange-500/10"
              >
                <ShieldAlert className="h-4 w-4" /> Suspend Account
              </button>
              
              <button 
                onClick={() => handleDeleteUser(selectedUser.id)} 
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-lg text-sm font-medium transition-colors border border-red-500/10"
              >
                <Trash2 className="h-4 w-4" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
