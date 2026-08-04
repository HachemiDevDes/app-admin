'use client'

import { useState, useEffect } from 'react'
import { Save, ShieldAlert, Users, Link as LinkIcon, Trash2, Plus, Ticket, CreditCard } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function SettingsClient({ initialConfig }: { initialConfig: Record<string, string> }) {
  const [maintenanceMode, setMaintenanceMode] = useState(initialConfig.maintenance_mode === 'true')
  const [freeLimit, setFreeLimit] = useState(initialConfig.free_tier_limit || '15')
  
  let initialAdmins: string[] = []
  try { initialAdmins = JSON.parse(initialConfig.admin_emails || '[]') } catch {}
  
  const [admins, setAdmins] = useState<string[]>(initialAdmins)
  const [newAdmin, setNewAdmin] = useState('')
  
  const [promoCodes, setPromoCodes] = useState<any[]>([])
  const [newPromoCode, setNewPromoCode] = useState('')
  const [newDiscount, setNewDiscount] = useState('')

  const [planBasicPrice, setPlanBasicPrice] = useState(initialConfig.plan_basic_price || '500')
  const [planPopularPrice, setPlanPopularPrice] = useState(initialConfig.plan_popular_price || '2500')
  const [planPremiumPrice, setPlanPremiumPrice] = useState(initialConfig.plan_premium_price || '5000')
  const [planPopularFree, setPlanPopularFree] = useState(initialConfig.plan_popular_free_months || '1 MONTH FREE')
  const [planPremiumFree, setPlanPremiumFree] = useState(initialConfig.plan_premium_free_months || '2 MONTHS FREE')

  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchPromoCodes = async () => {
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
      if (data) setPromoCodes(data)
    }
    fetchPromoCodes()
  }, [])

  const handleSave = async (key: string, value: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('app_config').upsert({ key, value })
      if (error) throw error
    } catch (err: any) {
      alert(`Failed to update ${key}: ` + err.message)
    } finally {
      setLoading(false)
      router.refresh()
    }
  }

  const toggleMaintenance = () => {
    const newValue = !maintenanceMode
    setMaintenanceMode(newValue)
    handleSave('maintenance_mode', String(newValue))
  }

  const saveFreeLimit = () => {
    handleSave('free_tier_limit', freeLimit)
  }

  const saveSubscriptionPlans = async () => {
    setLoading(true)
    try {
      await Promise.all([
        supabase.from('app_config').upsert({ key: 'plan_basic_price', value: planBasicPrice }),
        supabase.from('app_config').upsert({ key: 'plan_popular_price', value: planPopularPrice }),
        supabase.from('app_config').upsert({ key: 'plan_premium_price', value: planPremiumPrice }),
        supabase.from('app_config').upsert({ key: 'plan_popular_free_months', value: planPopularFree }),
        supabase.from('app_config').upsert({ key: 'plan_premium_free_months', value: planPremiumFree }),
      ])
    } catch (err: any) {
      alert('Failed to update plans: ' + err.message)
    } finally {
      setLoading(false)
      router.refresh()
    }
  }

  const addAdmin = () => {
    if (!newAdmin || !newAdmin.includes('@')) return
    if (admins.includes(newAdmin)) return
    
    const newAdmins = [...admins, newAdmin]
    setAdmins(newAdmins)
    setNewAdmin('')
    handleSave('admin_emails', JSON.stringify(newAdmins))
  }

  const removeAdmin = (email: string) => {
    const newAdmins = admins.filter(a => a !== email)
    setAdmins(newAdmins)
    handleSave('admin_emails', JSON.stringify(newAdmins))
  }

  const addPromoCode = async () => {
    if (!newPromoCode || !newDiscount) return
    const discount = parseInt(newDiscount)
    if (isNaN(discount) || discount < 1 || discount > 100) {
      alert("Discount must be between 1 and 100")
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('promo_codes').insert({
        code: newPromoCode.toUpperCase(),
        discount_percentage: discount
      })
      if (error) throw error
      setNewPromoCode('')
      setNewDiscount('')
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
      if (data) setPromoCodes(data)
    } catch (err: any) {
      alert('Error creating promo code: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePromoCode = async (id: string, currentStatus: boolean) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('promo_codes').update({ is_active: !currentStatus }).eq('id', id)
      if (error) throw error
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
      if (data) setPromoCodes(data)
    } catch (err: any) {
      alert('Error updating promo code: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      
      {/* Maintenance Mode */}
      <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${maintenanceMode ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-zinc-400'}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Maintenance Mode</h2>
            <p className="text-sm text-zinc-400 mt-1">
              When enabled, all mobile app users will see a maintenance screen and will not be able to log in or use the app.
            </p>
          </div>
          <div className="pt-2">
            <button 
              onClick={toggleMaintenance}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2 focus:ring-offset-[#0B0F19] ${maintenanceMode ? 'bg-red-500' : 'bg-zinc-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* App Limits */}
      <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-white/5 text-zinc-400">
            <LinkIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">App Limits</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Configure system-wide limits for users based on their subscription tier.
            </p>
          </div>
        </div>
        
        <div className="ml-16 max-w-sm">
          <label className="block text-sm font-medium mb-2 text-zinc-300">Free Tier Connection Limit</label>
          <div className="flex gap-3">
            <input 
              type="number" 
              value={freeLimit}
              onChange={(e) => setFreeLimit(e.target.value)}
              className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1A73E8]"
            />
            <button 
              onClick={saveFreeLimit}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20 transition-colors"
            >
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-white/5 text-zinc-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Subscription Plans</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Configure pricing and free trial badges for the mobile app subscription screen.
            </p>
          </div>
          <div className="pt-2">
            <button 
              onClick={saveSubscriptionPlans}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#1A73E8] px-4 py-2 font-medium text-white hover:bg-[#1A73E8]/80 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Plans
            </button>
          </div>
        </div>
        
        <div className="ml-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Plan */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white/80">Basic (1 Month)</h3>
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-400">Price (DZD)</label>
              <input 
                type="number" 
                value={planBasicPrice}
                onChange={(e) => setPlanBasicPrice(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
          </div>

          {/* Popular Plan */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white/80">Popular (6 Months)</h3>
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-400">Price (DZD)</label>
              <input 
                type="number" 
                value={planPopularPrice}
                onChange={(e) => setPlanPopularPrice(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-400">Free Trial Badge Text</label>
              <input 
                type="text" 
                value={planPopularFree}
                onChange={(e) => setPlanPopularFree(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
          </div>

          {/* Premium Plan */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white/80">Premium (12 Months)</h3>
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-400">Price (DZD)</label>
              <input 
                type="number" 
                value={planPremiumPrice}
                onChange={(e) => setPlanPremiumPrice(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-400">Free Trial Badge Text</label>
              <input 
                type="text" 
                value={planPremiumFree}
                onChange={(e) => setPlanPremiumFree(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Accounts */}
      <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-white/5 text-zinc-400">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Admin Accounts</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Emails listed here will be granted access to this dashboard. (Ensure this matches your RLS policies if applicable).
            </p>
          </div>
        </div>
        
        <div className="ml-16">
          <div className="flex gap-3 max-w-sm mb-6">
            <input 
              type="email" 
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="admin@example.com"
              className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1A73E8]"
            />
            <button 
              onClick={addAdmin}
              disabled={loading || !newAdmin}
              className="flex items-center gap-2 rounded-lg bg-[#1A73E8] px-4 py-2 font-medium text-white hover:bg-[#1A73E8]/80 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          <div className="space-y-2 max-w-md">
            {admins.map(email => (
              <div key={email} className="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-white/5">
                <span className="text-sm text-white font-medium">{email}</span>
                <button 
                  onClick={() => removeAdmin(email)}
                  disabled={loading}
                  className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {admins.length === 0 && (
              <div className="p-4 text-center text-sm text-zinc-500 border border-dashed border-white/10 rounded-lg">
                No extra admins configured.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Promo Codes */}
      <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-white/5 text-zinc-400">
            <Ticket className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Promo Codes</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Create and manage discount codes for user subscriptions.
            </p>
          </div>
        </div>
        
        <div className="ml-16">
          <div className="flex gap-3 max-w-lg mb-6">
            <input 
              type="text" 
              value={newPromoCode}
              onChange={(e) => setNewPromoCode(e.target.value)}
              placeholder="Code (e.g. SUMMER20)"
              className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1A73E8] uppercase"
            />
            <input 
              type="number" 
              value={newDiscount}
              onChange={(e) => setNewDiscount(e.target.value)}
              placeholder="% Discount"
              className="w-32 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1A73E8]"
            />
            <button 
              onClick={addPromoCode}
              disabled={loading || !newPromoCode || !newDiscount}
              className="flex items-center gap-2 rounded-lg bg-[#1A73E8] px-4 py-2 font-medium text-white hover:bg-[#1A73E8]/80 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          <div className="space-y-2 max-w-xl">
            {promoCodes.map(promo => (
              <div key={promo.id} className="flex justify-between items-center p-4 rounded-lg border border-white/5 bg-white/5">
                <div>
                  <span className="text-base text-white font-bold">{promo.code}</span>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      {promo.discount_percentage}% OFF
                    </span>
                    <span className="text-xs text-zinc-500">
                      Used: {promo.usage_count} times
                    </span>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={() => togglePromoCode(promo.id, promo.is_active)}
                    disabled={loading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2 focus:ring-offset-[#0B0F19] ${promo.is_active ? 'bg-[#1A73E8]' : 'bg-zinc-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promo.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            ))}
            {promoCodes.length === 0 && (
              <div className="p-4 text-center text-sm text-zinc-500 border border-dashed border-white/10 rounded-lg">
                No promo codes created yet.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
