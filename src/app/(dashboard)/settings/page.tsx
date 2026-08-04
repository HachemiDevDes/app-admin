import { createClient } from '@/utils/supabase/server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Safely fetch app config
  let configMap: Record<string, string> = {
    maintenance_mode: 'false',
    free_tier_limit: '15',
    admin_emails: '[]',
    plan_basic_price: '500',
    plan_popular_price: '2500',
    plan_premium_price: '5000',
    plan_popular_free_months: '1 MONTH FREE',
    plan_premium_free_months: '2 MONTHS FREE'
  }

  try {
    const { data } = await supabase.from('app_config').select('*')
    if (data) {
      data.forEach((row: any) => {
        configMap[row.key] = row.value
      })
    }
  } catch (e) {
    console.error('Error fetching app_config')
  }

  return (
    <>
      <header className="border-b border-white/10 bg-[#111827]/40 backdrop-blur-xl px-8 py-4 z-10 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">System Settings</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <div className="max-w-3xl">
          <SettingsClient initialConfig={configMap} />
        </div>
      </main>
    </>
  )
}
