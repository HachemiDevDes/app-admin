import { Sidebar } from '@/components/Sidebar'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Check if user is in admins table
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .single()

  if (adminError || !adminData) {
    // Not an admin, log them out and redirect
    await supabase.auth.signOut()
    redirect('/login?error=unauthorized')
  }

  // Safely fetch unread support messages count
  let unreadSupportCount = 0
  try {
    const { count } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Open')
    
    if (count) unreadSupportCount = count
  } catch (e) {
    // Table might not exist yet
  }

  return (
    <div className="flex h-screen bg-transparent text-white w-full">
      <Sidebar unreadSupportCount={unreadSupportCount} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}
