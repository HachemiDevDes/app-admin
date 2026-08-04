import { createClient } from '@/utils/supabase/server'
import { UsersClient } from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createClient()

  // Fetch all profiles
  let profiles = []
  
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    
    if (data) profiles = data
  } catch (e) {
    console.error('Error fetching users/profiles')
  }

  // Fetch subscriptions to attach to profiles
  let subscriptions = []
  if (profiles.length > 0) {
    try {
      const profileIds = profiles.map((p: any) => p.id)
      const { data } = await supabase.from('subscriptions').select('*').in('user_id', profileIds)
      if (data) subscriptions = data
    } catch (e) {
      console.error('Error fetching subscriptions')
    }
  }


  // Fetch connections to count contacts per user
  let connections = []
  if (profiles.length > 0) {
    try {
      const profileIds = profiles.map((p: any) => p.id)
      const { data } = await supabase.from('connections').select('user_id').in('user_id', profileIds)
      if (data) connections = data
    } catch (e) {
      console.error('Error fetching connections')
    }
  }


  // Merge subscriptions and contacts count into profiles
  const mergedUsers = profiles.map((p: any) => {
    // Find active subscription if any
    const userSubs = subscriptions.filter((s: any) => s.user_id === p.id)
    const activeSub = userSubs.find((s: any) => s.status === 'Active') || userSubs[0] || null

    if (activeSub && activeSub.end_date) {
      if (new Date(activeSub.end_date) < new Date()) {
        activeSub.status = 'Expired'
      }
    }

    const contacts_count = connections.filter((c: any) => c.user_id === p.id).length

    return {
      ...p,
      subscription: activeSub,
      contacts_count
    }
  })

  return (
    <>
      <header className="border-b border-white/10 bg-[#111827]/40 backdrop-blur-xl px-8 py-4 z-10">
        <h1 className="text-xl font-semibold text-white">Users</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <UsersClient initialUsers={mergedUsers} />
      </main>
    </>
  )
}
