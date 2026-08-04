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

  // --- Fetch Chargily Data ---
  let chargilyTransactions: any[] = []
  let fetchError = null
  if (process.env.CHARGILY_SECRET_KEY) {
    try {
      const apiUrl = 'https://pay.chargily.net/api/v2/checkouts'

      const res = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${process.env.CHARGILY_SECRET_KEY}` },
        next: { revalidate: 60 }
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.data) {
          chargilyTransactions = data.data
            .filter((c: any) => c.status === 'paid')
            .map((c: any) => {
              let userId = null
              let planMonths = 1
              if (Array.isArray(c.metadata)) {
                userId = c.metadata.find((m: any) => m.user_id)?.user_id
                planMonths = c.metadata.find((m: any) => m.plan_months)?.plan_months || 1
              } else if (c.metadata && typeof c.metadata === 'object') {
                userId = c.metadata.user_id
                planMonths = c.metadata.plan_months || 1
              }
              return {
                id: c.id,
                user_id: userId || 'unknown',
                amount_dzd: c.amount,
                plan_months: planMonths,
                transaction_date: new Date(typeof c.created_at === 'number' ? c.created_at * 1000 : c.created_at).toISOString(),
                status: 'Success'
              }
            })
        } else {
          fetchError = 'No data property in response'
        }
      } else {
        fetchError = `Status ${res.status}: ${await res.text()}`
      }
    } catch (e: any) {
      console.error('Failed to fetch Chargily checkouts', e)
      fetchError = e.message
    }
  }

  const allTransactions = [...(transactions || []), ...chargilyTransactions]

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
          transactions={allTransactions}
        />
      </main>
    </>
  )
}
