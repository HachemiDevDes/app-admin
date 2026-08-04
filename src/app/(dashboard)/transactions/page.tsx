import { createClient } from '@/utils/supabase/server'
import { TransactionsClient } from './TransactionsClient'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch raw data for profiles to get user names/emails
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, username, email')
  const { data: dbTransactions } = await supabase.from('subscription_transactions').select('*')

  // --- Fetch Chargily Data ---
  let chargilyTransactions: any[] = []
  if (process.env.CHARGILY_SECRET_KEY) {
    try {
      const isTestMode = process.env.CHARGILY_SECRET_KEY.startsWith('test_')
      const apiUrl = isTestMode 
          ? 'https://pay.chargily.net/test/api/v2/checkouts'
          : 'https://pay.chargily.net/api/v2/checkouts'

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
                status: 'Success',
                source: 'Chargily'
              }
            })
        }
      }
    } catch (e) {
      console.error('Failed to fetch Chargily checkouts', e)
    }
  }

  const allTransactions = [...(dbTransactions || []).map(t => ({ ...t, source: 'Database', plan_months: t.plan_months || 1 })), ...chargilyTransactions]
  
  // Sort by newest first
  allTransactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())

  return (
    <>
      <header className="border-b border-white/10 bg-[#111827]/40 backdrop-blur-xl px-8 py-4 z-10 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">Transactions History</h1>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#10B981] flex items-center justify-center text-sm font-bold shadow-md">
            {user?.email?.charAt(0).toUpperCase() ?? 'A'}
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-8 relative z-0 space-y-8">
        <TransactionsClient 
          transactions={allTransactions} 
          profiles={profiles || []} 
        />
      </main>
    </>
  )
}
