import { createClient } from '@/utils/supabase/server'
import { NotificationsClient } from './NotificationsClient'

export default async function NotificationsPage() {
  const supabase = await createClient()

  // Safely fetch history
  let history = []
  try {
    // Fetch history without risky joins
    const { data, error } = await supabase
      .from('notification_history')
      .select('*') 
      .order('sent_at', { ascending: false })
      .limit(500)
    
    if (error) {
      console.error('Supabase error fetching notification history:', error)
    }
    
    if (data) {
      // Fetch admins and profiles to resolve emails
      const sentByMap = Array.from(new Set(data.map((n: any) => n.sent_by).filter(Boolean)))
      const { data: admins } = await supabase.from('admins').select('id, email')
      const { data: profiles } = sentByMap.length > 0 ? await supabase.from('profiles').select('id, email').in('id', sentByMap) : { data: [] }
      
      const emailMap = new Map()
      admins?.forEach(a => emailMap.set(a.id, a.email))
      profiles?.forEach(p => emailMap.set(p.id, p.email))

      history = data.map((n: any) => ({
        ...n,
        sent_by_email: emailMap.get(n.sent_by) || n.sent_by || 'System'
      }))
    }
  } catch (e) {
    console.error('Error fetching notification history:', e)
  }

  return (
    <>
      <header className="border-b border-white/10 bg-[#111827]/40 backdrop-blur-xl px-8 py-4 z-10">
        <h1 className="text-xl font-semibold text-white">Push Notifications</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-8 relative z-0 flex gap-6">
        <NotificationsClient initialHistory={history} />
      </main>
    </>
  )
}
