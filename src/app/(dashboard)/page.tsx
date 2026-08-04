import { createClient } from '@/utils/supabase/server'
import { AnalyticsClient } from '@/components/AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // --- Fetch Raw Data ---
  const { data: profiles } = await supabase.from('profiles').select('id, created_at, industry, job_title, address, phone')
  const { data: connections } = await supabase.from('connections').select('created_at, source, user_id')
  const { data: subscriptions } = await supabase.from('subscriptions').select('id, user_id, tier, start_date, end_date, created_at, status')
  const { data: transactions } = await supabase.from('subscription_transactions').select('id, user_id, amount_dzd, transaction_date, status')

  return (
    <>
      <header className="border-b border-white/10 bg-[#111827]/40 backdrop-blur-xl px-8 py-4 z-10 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">Financial Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#1A73E8] flex items-center justify-center text-sm font-bold shadow-md">
            {user?.email?.charAt(0).toUpperCase() ?? 'A'}
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-8 relative z-0 space-y-8">
        <AnalyticsClient 
          profiles={profiles || []}
          connections={connections || []}
          subscriptions={subscriptions || []}
          transactions={transactions || []}
        />
      </main>
    </>
  )
}
