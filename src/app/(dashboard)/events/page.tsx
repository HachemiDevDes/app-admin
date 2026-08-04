import { createClient } from '@/utils/supabase/server'
import EventsClient from './EventsClient'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          Error loading events: {error.message}
        </div>
      </div>
    )
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? 'A'

  return <EventsClient initialEvents={events || []} userInitial={userInitial} />
}
