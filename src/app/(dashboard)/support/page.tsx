import { createClient } from '@/utils/supabase/server'
import { SupportClient } from './SupportClient'

export default async function SupportPage() {
  const supabase = await createClient()

  // Safely fetch support messages
  let messages = []
  try {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (data) messages = data
  } catch (e) {
    console.error('Error fetching support messages, table might not exist')
  }

  return (
    <>
      <header className="border-b border-white/10 bg-[#111827]/40 backdrop-blur-xl px-8 py-4 z-10 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">Support Messages</h1>
      </header>
      
      <main className="flex-1 overflow-hidden relative z-0 flex flex-col p-8">
        <SupportClient initialMessages={messages} />
      </main>
    </>
  )
}
