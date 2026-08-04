'use client'

import { useState } from 'react'
import { Search, CheckCircle, Trash2, X, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type SupportMessage = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
}

export function SupportClient({ initialMessages }: { initialMessages: SupportMessage[] }) {
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.name.toLowerCase().includes(search.toLowerCase()) || 
                          msg.email.toLowerCase().includes(search.toLowerCase()) ||
                          msg.subject.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || msg.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    // Optimistic UI
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, status: newStatus } : m))
    if (selectedMessage?.id === id) {
      setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null)
    }

    await supabase.from('support_messages').update({ status: newStatus }).eq('id', id)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this support message?')) return
    
    setMessages(msgs => msgs.filter(m => m.id !== id))
    if (selectedMessage?.id === id) setSelectedMessage(null)

    await supabase.from('support_messages').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="flex gap-6 relative h-full">
      {/* Messages List Area */}
      <div className={`flex-1 transition-all duration-300 flex flex-col h-[calc(100vh-140px)] ${selectedMessage ? 'w-1/2' : 'w-full'}`}>
        <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md overflow-hidden shadow-lg flex flex-col h-full">
          
          {/* Controls */}
          <div className="p-4 border-b border-white/10 flex gap-4 items-center bg-white/5 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1A73E8] appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">No messages found.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${selectedMessage?.id === msg.id ? 'bg-[#1A73E8]/10' : ''}`}
                    onClick={() => setSelectedMessage(msg)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium text-white flex items-center gap-2">
                        {msg.status === 'Open' ? (
                          <div className="h-2 w-2 rounded-full bg-[#1A73E8]" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-zinc-600" />
                        )}
                        {msg.name}
                      </div>
                      <div className="text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-zinc-300 mb-1 line-clamp-1">{msg.subject}</div>
                    <div className="text-xs text-zinc-500 line-clamp-2">{msg.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Reading Panel */}
      {selectedMessage && (
        <div className="w-1/2 rounded-xl border border-white/10 bg-[#111827] shadow-2xl flex flex-col h-[calc(100vh-140px)] sticky top-0 animate-in slide-in-from-right-8 duration-300">
          {/* Header Controls */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
            <div className="flex gap-2">
              {selectedMessage.status === 'Open' ? (
                <button 
                  onClick={() => handleStatusUpdate(selectedMessage.id, 'Resolved')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 text-sm font-medium transition-colors"
                >
                  <CheckCircle className="h-4 w-4" /> Mark Resolved
                </button>
              ) : (
                <button 
                  onClick={() => handleStatusUpdate(selectedMessage.id, 'Open')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm font-medium transition-colors"
                >
                  <Clock className="h-4 w-4" /> Reopen
                </button>
              )}
              <button 
                onClick={() => handleDelete(selectedMessage.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
            <button onClick={() => setSelectedMessage(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Message Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="mb-6 pb-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">{selectedMessage.subject}</h2>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-[#1A73E8]">
                  {selectedMessage.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-white">{selectedMessage.name}</div>
                  <div className="text-sm text-zinc-400">{selectedMessage.email}</div>
                </div>
                <div className="ml-auto text-sm text-zinc-500">
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {selectedMessage.message}
            </div>
            
            <div className="mt-12 pt-6 border-t border-white/5">
              <a 
                href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                className="inline-flex items-center justify-center rounded-lg bg-[#1A73E8] px-4 py-2 font-medium text-white hover:bg-[#1A73E8]/80 transition-colors"
              >
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
