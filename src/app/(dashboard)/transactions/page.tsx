import { createClient } from '@/utils/supabase/server'
import { TransactionsClient } from './TransactionsClient'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dbTransactions } = await supabase.from('subscription_transactions').select('*')

  // --- Fetch Chargily Data ---
  let chargilyTransactions: any[] = []
  let fetchError: string | null = null
  if (process.env.CHARGILY_SECRET_KEY) {
    try {
      const isTestMode = process.env.CHARGILY_SECRET_KEY.startsWith('test_')
      const apiUrl = isTestMode 
          ? 'https://pay.chargily.net/test/api/v2/checkouts'
          : 'https://pay.chargily.net/api/v2/checkouts'

      const res = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${process.env.CHARGILY_SECRET_KEY?.trim()}` },
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.data) {
          chargilyTransactions = data.data.map((c: any) => {
            let userId = 'unknown'
            let planMonths = 1
            if (c.metadata) {
              if (Array.isArray(c.metadata)) {
                userId = c.metadata.find((m: any) => m.user_id)?.user_id
                planMonths = c.metadata.find((m: any) => m.plan_months)?.plan_months || 1
              } else if (c.metadata && typeof c.metadata === 'object') {
                userId = c.metadata.user_id
                planMonths = c.metadata.plan_months || 1
              }
            }
            return {
              id: c.id,
              user_id: userId || 'unknown',
              amount_dzd: c.amount,
              transaction_date: new Date(typeof c.created_at === 'number' ? c.created_at * 1000 : c.created_at).toISOString(),
              status: c.status === 'paid' ? 'Success' : c.status === 'failed' || c.status === 'canceled' ? 'Failed' : 'Pending',
              source: 'Chargily',
              plan_months: planMonths
            }
          }).filter((t: any) => t !== null)
        }
      } else {
        const text = await res.text()
        console.error('Chargily API Error:', res.status, text)
        fetchError = `Chargily Error ${res.status}: ${text}`
      }
    } catch (e: any) {
      console.error('Chargily fetch failed:', e)
      fetchError = e.message
    }
  } else {
    fetchError = 'CHARGILY_SECRET_KEY is not set'
  }

  const allTransactions = [...(dbTransactions || []).map(t => ({ ...t, source: 'Database', plan_months: t.plan_months || 1 })), ...chargilyTransactions]
  
  // Fetch profiles only for users who have transactions
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const userIds = Array.from(new Set(allTransactions.map(t => t.user_id?.trim()).filter(id => id && uuidRegex.test(id))))
  let profiles: any[] = []
  if (userIds.length > 0) {
    const { data, error } = await supabase.from('profiles').select('id, full_name, email, phone').in('id', userIds)
    if (error) console.error('Error fetching profiles:', error)
    if (data) profiles = data
  }

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
          fetchError={fetchError}
        />
      </main>
    </>
  )
}
