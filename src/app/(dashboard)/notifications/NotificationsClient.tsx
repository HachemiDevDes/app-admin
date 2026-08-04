'use client'

import { useState } from 'react'
import { Send, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type NotificationHistory = {
  id: string
  target: string
  title: string
  message: string
  sent_by_email: string
  sent_at: string
}

export function NotificationsClient({ initialHistory }: { initialHistory: NotificationHistory[] }) {
  const [history, setHistory] = useState<NotificationHistory[]>(initialHistory)
  const [target, setTarget] = useState('All Users')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) return
    
    const confirmed = window.confirm(`Are you sure you want to send this push notification to ${target}?`)
    if (!confirmed) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Call Edge Function to send actual push notification via Firebase
      const { data: functionData, error: functionError } = await supabase.functions.invoke('send-notification', {
        body: { target, title, message }
      })

      if (functionError) {
        console.error("Edge function error:", functionError)
        throw new Error(`Edge Function Error: ${functionError.message || JSON.stringify(functionError)}`)
      }

      if (functionData?.error) {
        throw new Error(functionData.error)
      }

      // Insert into history
      const { data, error } = await supabase.from('notification_history').insert({
        target,
        title,
        message,
        sent_by: user?.id
      }).select().single()

      if (error) throw error

      // Optimistic UI update
      setHistory(prev => [{
        ...data,
        sent_by_email: user?.email || 'You'
      }, ...prev])
      
      // Reset form
      setTitle('')
      setMessage('')
      alert('Notification sent successfully!')
    } catch (err: any) {
      alert('Failed to send notification: ' + err.message)
    } finally {
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <>
      {/* Compose Form */}
      <div className="w-1/3">
        <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg sticky top-8">
          <h2 className="text-lg font-semibold text-white mb-6">Compose Notification</h2>
          
          <form onSubmit={handleSend} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Target Audience</label>
              <select 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1A73E8] appearance-none"
              >
                <option value="All Users">All Users</option>
                <option value="Free Users">Free Users</option>
                <option value="Paid Users">Paid Users</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Title</label>
              <input 
                type="text" 
                required
                maxLength={50}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#1A73E8]"
                placeholder="New Feature Alert!"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-300">Message</label>
                <span className={`text-xs ${message.length > 180 ? 'text-red-400' : 'text-zinc-500'}`}>
                  {message.length} / 200
                </span>
              </div>
              <textarea 
                required
                maxLength={200}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#1A73E8] resize-none"
                placeholder="Write your push notification message here..."
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading || !title || !message}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-[#1A73E8] px-4 py-3 font-semibold text-white hover:bg-[#1664C8] hover:shadow-[0_0_15px_rgba(26,115,232,0.4)] focus:outline-none disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Sending...' : 'Send Push Notification'}
            </button>
          </form>
        </div>
      </div>

      {/* History Table */}
      <div className="w-2/3">
        <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md overflow-hidden shadow-lg h-full flex flex-col">
          <div className="p-5 border-b border-white/10 flex items-center gap-2 bg-white/5">
            <Clock className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-white">Notification History</h2>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="text-xs uppercase bg-black/40 text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Notification</th>
                  <th className="px-6 py-4 font-medium">Target</th>
                  <th className="px-6 py-4 font-medium">Sent By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                      {new Date(item.sent_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white mb-1">{item.title}</div>
                      <div className="text-xs text-zinc-400 line-clamp-2">{item.message}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded border text-xs font-medium bg-white/5 border-white/10 text-zinc-300">
                        {item.target}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {item.sent_by_email}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No push notifications sent yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
