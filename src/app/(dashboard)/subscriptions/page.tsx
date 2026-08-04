import { createClient } from '@/utils/supabase/server'
import { SubscriptionsClient } from './SubscriptionsClient'

export default async function SubscriptionsPage() {
  const supabase = await createClient()

  // Fetch all subscriptions with user profiles
  // We'll use a left join assuming the relation is set up, or fetch separately
  // Since we haven't defined foreign keys to public.profiles natively, we'll fetch profiles and subscriptions and merge them
  
  const { data: subscriptions } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(500)
  const userIds = subscriptions?.map(s => s.user_id) || []
  
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
  const { data: transactions } = await supabase.from('subscription_transactions').select('user_id').in('user_id', userIds)
  
  const payingUserIds = new Set(transactions?.map(tx => tx.user_id) || [])

  // Create a combined data structure
  const usersWithSubs = profiles?.map(profile => {
    const userSub = subscriptions?.find(sub => sub.user_id === profile.id)
    if (userSub) {
      if (userSub.end_date && new Date(userSub.end_date) < new Date()) {
        userSub.status = 'Expired'
      }
      userSub.isManual = !payingUserIds.has(profile.id)
    }
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      subscription: userSub || null
    }
  }) || []

  // Get active subscriptions to calculate totals and MRR correctly
  const activeSubs = usersWithSubs.filter(u => u.subscription && u.subscription.status !== 'Expired')
  
  const totalBasic = activeSubs.filter(u => u.subscription.tier === 'Basic').length
  const totalPopular = activeSubs.filter(u => u.subscription.tier === 'Popular').length
  const totalPremium = activeSubs.filter(u => ['Premium', 'Pro', 'Business'].includes(u.subscription.tier)).length
  const totalFree = usersWithSubs.length - totalBasic - totalPopular - totalPremium
  
  // Calculate estimated MRR (only counting non-manual active subscriptions)
  const paidActiveSubs = activeSubs.filter(u => !u.subscription.isManual)
  const paidBasic = paidActiveSubs.filter(u => u.subscription.tier === 'Basic').length
  const paidPopular = paidActiveSubs.filter(u => u.subscription.tier === 'Popular').length
  const paidPremium = paidActiveSubs.filter(u => ['Premium', 'Pro', 'Business'].includes(u.subscription.tier)).length

  const estimatedMRR = (paidBasic * 1000) + (paidPopular * 2500) + (paidPremium * 5000)

  return (
    <>
      <header className="border-b border-white/10 bg-[#111827]/40 backdrop-blur-xl px-8 py-4 z-10">
        <h1 className="text-xl font-semibold text-white">Subscriptions</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Total Basic</h3>
            <p className="text-3xl font-bold text-[#1A73E8]">{totalBasic}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Total Popular</h3>
            <p className="text-3xl font-bold text-[#8B5CF6]">{totalPopular}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Total Premium</h3>
            <p className="text-3xl font-bold text-[#10B981]">{totalPremium}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Total Free</h3>
            <p className="text-3xl font-bold text-zinc-300">{totalFree}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Estimated MRR</h3>
            <p className="text-xl font-bold text-white">{estimatedMRR.toLocaleString()} DZD</p>
          </div>
        </div>

        <SubscriptionsClient initialData={usersWithSubs} />
      </main>
    </>
  )
}
