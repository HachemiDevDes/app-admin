'use client'

import { useState, useMemo } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts'
import { Calendar, TrendingUp, Users, DollarSign, Activity, Zap, CreditCard, UserMinus, Globe } from 'lucide-react'
import { WorldMap } from './WorldMap'

type Profile = { id: string; created_at: string; industry: string; job_title: string; address?: string; phone?: string }
type Connection = { created_at: string; source?: string; user_id?: string }
type Subscription = { id: string; user_id: string; tier: string; start_date: string; end_date: string; created_at: string; status: string }
type Transaction = { id: string; user_id: string; amount_dzd: number; transaction_date: string; status: string }

const TIER_COLORS = {
  'Free': '#9CA3AF', // zinc-400
  'Basic': '#1A73E8', // Blue
  'Popular': '#8B5CF6', // Purple
  'Premium': '#10B981', // Emerald
  'Pro': '#10B981', 
  'Business': '#10B981'
}

export function AnalyticsClient({ 
  profiles, 
  connections, 
  subscriptions, 
  transactions 
}: { 
  profiles: Profile[],
  connections: Connection[],
  subscriptions: Subscription[],
  transactions: Transaction[]
}) {
  const [timePeriod, setTimePeriod] = useState<number>(30) // 7, 30, 90, 365, 0 (all)

  const data = useMemo(() => {
    const now = new Date()
    const startDate = new Date()
    if (timePeriod > 0) {
      startDate.setDate(now.getDate() - timePeriod)
    } else {
      startDate.setFullYear(2000) // effectively 'all time'
    }

    // Filter raw data based on time period
    const filteredProfiles = profiles.filter(p => new Date(p.created_at) >= startDate)
    const filteredConnections = connections.filter(c => new Date(c.created_at) >= startDate)
    const filteredTransactions = transactions.filter(t => new Date(t.transaction_date) >= startDate && t.status === 'success')

    // Find all paying users globally
    const payingUserIds = new Set(transactions.map(t => t.user_id))

    // MRR is a current snapshot, so we calculate it based on currently active subs that are paid
    let currentMRR = 0
    let activePaidUsers = 0
    let totalActiveUsers = 0
    
    // For churn, we look at subscriptions that expired DURING the time period
    let expiredInPeriod = 0
    let activeAtStartOfPeriod = 0

    const tierMRR: Record<string, number> = { Basic: 0, Popular: 0, Premium: 0 }
    const tierCounts: Record<string, number> = { Free: 0, Basic: 0, Popular: 0, Premium: 0 }

    subscriptions.forEach(sub => {
      const isPaid = payingUserIds.has(sub.user_id)
      const isCurrentlyActive = sub.end_date && new Date(sub.end_date) > now
      const isExpiredInPeriod = sub.end_date && new Date(sub.end_date) >= startDate && new Date(sub.end_date) <= now
      const wasActiveAtStart = sub.start_date && new Date(sub.start_date) <= startDate && (!sub.end_date || new Date(sub.end_date) > startDate)

      if (wasActiveAtStart) activeAtStartOfPeriod++
      if (isExpiredInPeriod) expiredInPeriod++

      if (isCurrentlyActive) {
        totalActiveUsers++
        if (isPaid) {
          activePaidUsers++
          let price = 0
          if (sub.tier === 'Basic') price = 1000
          else if (sub.tier === 'Popular') price = 2500
          else if (['Premium', 'Pro', 'Business'].includes(sub.tier)) {
            price = 5000
            sub.tier = 'Premium'
          }
          currentMRR += price
          if(tierMRR[sub.tier] !== undefined) tierMRR[sub.tier] += price
          if(tierCounts[sub.tier] !== undefined) tierCounts[sub.tier]++
        } else {
          tierCounts['Free']++
        }
      }
    })

    // Base free users
    const currentTotalProfiles = profiles.length
    tierCounts['Free'] = currentTotalProfiles - activePaidUsers

    // Scan Counting Logic
    let totalScans = 0
    let freeUserScans = 0
    let paidUserScans = 0

    filteredConnections.forEach(c => {
      const isScan = c.source && (c.source.toLowerCase().includes('scan') || c.source.toLowerCase().includes('qr') || c.source.toLowerCase().includes('badge') || c.source.toLowerCase().includes('card'))
      
      if (isScan) {
        totalScans++
        if (c.user_id && payingUserIds.has(c.user_id)) {
          paidUserScans++
        } else {
          freeUserScans++
        }
      }
    })

    // Financial Metrics
    const grossRevenue = filteredTransactions.reduce((sum, t) => sum + (t.amount_dzd || 0), 0)
    const arpu = activePaidUsers > 0 ? currentMRR / activePaidUsers : 0
    
    // Monthly Churn Rate = Expired / (Active at start)
    const churnRate = activeAtStartOfPeriod > 0 ? (expiredInPeriod / activeAtStartOfPeriod) * 100 : 0
    
    // LTV = ARPU / Churn Rate (if churn is 0, cap LTV at 12 months of ARPU for estimation)
    const estimatedChurnDecimal = churnRate > 0 ? churnRate / 100 : 0.05
    const ltv = arpu / estimatedChurnDecimal

    // Timeline Generation
    const daysToGenerate = timePeriod > 0 ? timePeriod : 365 // limit to 1 year if 'all' for timeline
    const timelineArray = Array.from({ length: daysToGenerate }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (daysToGenerate - 1 - i))
      return d.toISOString().split('T')[0]
    })

    const usersPerDay: Record<string, number> = {}
    const countryCounts: Record<string, number> = {}

    filteredProfiles.forEach(p => {
      // Date grouping
      const d = p.created_at.split('T')[0]
      usersPerDay[d] = (usersPerDay[d] || 0) + 1

      // Country extraction
      let country = 'Unknown'
      if (p.address && p.address.length > 2) {
        const lowerAddr = p.address.toLowerCase()
        if (lowerAddr.includes('algeria')) country = 'Algeria'
        else if (lowerAddr.includes('france')) country = 'France'
        else if (lowerAddr.includes('united states') || lowerAddr.includes('usa')) country = 'United States'
        else if (lowerAddr.includes('united kingdom') || lowerAddr.includes('uk')) country = 'United Kingdom'
        else if (lowerAddr.includes('emirates') || lowerAddr.includes('uae')) country = 'United Arab Emirates'
        else if (lowerAddr.includes('canada')) country = 'Canada'
        else if (lowerAddr.includes('saudi')) country = 'Saudi Arabia'
        else if (lowerAddr.includes('morocco')) country = 'Morocco'
        else if (lowerAddr.includes('tunisia')) country = 'Tunisia'
        else if (lowerAddr.includes('germany')) country = 'Germany'
        else if (lowerAddr.includes('spain')) country = 'Spain'
        else if (lowerAddr.includes('italy')) country = 'Italy'
        else {
          const parts = p.address.split(',')
          country = parts[parts.length - 1].trim()
        }
      } else if (p.phone) {
        if (p.phone.startsWith('+213')) country = 'Algeria'
        else if (p.phone.startsWith('+33')) country = 'France'
        else if (p.phone.startsWith('+1')) country = 'United States' // Also Canada, but fallback
        else if (p.phone.startsWith('+44')) country = 'United Kingdom'
        else if (p.phone.startsWith('+971')) country = 'United Arab Emirates'
        else if (p.phone.startsWith('+966')) country = 'Saudi Arabia'
        else if (p.phone.startsWith('+212')) country = 'Morocco'
        else if (p.phone.startsWith('+216')) country = 'Tunisia'
        else if (p.phone.startsWith('+49')) country = 'Germany'
        else if (p.phone.startsWith('+34')) country = 'Spain'
        else if (p.phone.startsWith('+39')) country = 'Italy'
      }

      if (country !== 'Unknown') {
        const nameMap: Record<string, string> = { 'US': 'United States', 'USA': 'United States', 'UK': 'United Kingdom' }
        const finalCountry = nameMap[country] || country
        countryCounts[finalCountry] = (countryCounts[finalCountry] || 0) + 1
      }
    })

    const extractedCountryData = Object.entries(countryCounts).map(([id, users]) => ({ id, name: id, users }))

    const revenuePerDay: Record<string, number> = {}
    filteredTransactions.forEach(t => {
      const d = t.transaction_date.split('T')[0]
      revenuePerDay[d] = (revenuePerDay[d] || 0) + (t.amount_dzd || 0)
    })

    const timelineData = timelineArray.map(date => {
      // Create cumulative MRR simulation for the "Revenue Forecast / Growth"
      return {
        date: date.slice(5), // MM-DD
        fullDate: date,
        users: usersPerDay[date] || 0,
        revenue: revenuePerDay[date] || 0
      }
    })

    // Format Data for Charts
    const tierData = [
      { name: 'Free', value: tierCounts['Free'] },
      { name: 'Basic', value: tierCounts['Basic'] },
      { name: 'Popular', value: tierCounts['Popular'] },
      { name: 'Premium', value: tierCounts['Premium'] },
    ]

    const mrrByTierData = [
      { name: 'Basic', value: tierMRR['Basic'] },
      { name: 'Popular', value: tierMRR['Popular'] },
      { name: 'Premium', value: tierMRR['Premium'] },
    ].filter(d => d.value > 0)

    const industryCounts: Record<string, number> = {}
    filteredProfiles.forEach(p => {
      const ind = p.industry || p.job_title || 'Unknown'
      industryCounts[ind] = (industryCounts[ind] || 0) + 1
    })
    
    const industryData = Object.entries(industryCounts)
      .filter(([name]) => name !== 'Unknown')
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalUsers: filteredProfiles.length,
      currentMRR,
      grossRevenue,
      arpu,
      ltv,
      churnRate,
      activePaidUsers,
      timelineData,
      tierData,
      industryData,
      mrrByTierData,
      totalScans,
      freeUserScans,
      paidUserScans,
      extractedCountryData
    }
  }, [profiles, connections, subscriptions, transactions, timePeriod])

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#111827]/40 border border-white/10 rounded-xl p-4 backdrop-blur-md gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="h-5 w-5 text-[#1A73E8]" />
          <h2 className="font-medium text-white">Financial & Analytics Overview</h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {[
            { label: '7D', value: 7 },
            { label: '30D', value: 30 },
            { label: '90D', value: 90 },
            { label: '1Y', value: 365 },
            { label: 'All', value: 0 }
          ].map(period => (
            <button
              key={period.label}
              onClick={() => setTimePeriod(period.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                timePeriod === period.value 
                  ? 'bg-[#1A73E8] text-white shadow-[0_0_15px_rgba(26,115,232,0.4)]' 
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#111827]/40 backdrop-blur-md p-5 shadow-lg group hover:border-[#1A73E8]/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors"><Users className="h-4 w-4 text-blue-400" /></div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">New Users</h3>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalUsers.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#111827]/40 backdrop-blur-md p-5 shadow-lg group hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors"><TrendingUp className="h-4 w-4 text-emerald-400" /></div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Estimated MRR</h3>
          </div>
          <p className="text-2xl font-bold text-[#10B981]">{data.currentMRR.toLocaleString()} <span className="text-sm font-normal text-zinc-500">DZD</span></p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#111827]/40 backdrop-blur-md p-5 shadow-lg group hover:border-purple-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors"><DollarSign className="h-4 w-4 text-purple-400" /></div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Gross Vol</h3>
          </div>
          <p className="text-2xl font-bold text-white">{data.grossRevenue.toLocaleString()} <span className="text-sm font-normal text-zinc-500">DZD</span></p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#111827]/40 backdrop-blur-md p-5 shadow-lg group hover:border-amber-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors"><CreditCard className="h-4 w-4 text-amber-400" /></div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ARPU</h3>
          </div>
          <p className="text-2xl font-bold text-white">{Math.round(data.arpu).toLocaleString()} <span className="text-sm font-normal text-zinc-500">DZD</span></p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#111827]/40 backdrop-blur-md p-5 shadow-lg group hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors"><Zap className="h-4 w-4 text-indigo-400" /></div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Proj. LTV</h3>
          </div>
          <p className="text-2xl font-bold text-white">{Math.round(data.ltv).toLocaleString()} <span className="text-sm font-normal text-zinc-500">DZD</span></p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#111827]/40 backdrop-blur-md p-5 shadow-lg group hover:border-red-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors"><UserMinus className="h-4 w-4 text-red-400" /></div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Churn Rate</h3>
          </div>
          <p className="text-2xl font-bold text-white">{data.churnRate.toFixed(1)}<span className="text-sm font-normal text-zinc-500">%</span></p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue/Transactions Timeline */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-6">Revenue Growth (Gross)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickMargin={10} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff20', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" name="Gross Revenue (DZD)" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MRR by Tier Pie */}
        <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-6">MRR by Tier</h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            {data.mrrByTierData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.mrrByTierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.mrrByTierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.name as keyof typeof TIER_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value || 0).toLocaleString()} DZD`, 'MRR']}
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff20', borderRadius: '8px' }} 
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-zinc-500">No MRR data available</div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scans Overview Widget */}
        <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-6">QR Code Scans</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-white">{data.totalScans.toLocaleString()}</p>
              <p className="text-sm text-zinc-400">Total Scans</p>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Zap className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
          
          <div className="space-y-3 mt-6">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm font-medium text-zinc-300">By Paid Users</span>
              <span className="font-bold text-[#10B981]">{data.paidUserScans.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm font-medium text-zinc-300">By Free Users</span>
              <span className="font-bold text-zinc-400">{data.freeUserScans.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* User Acquisition */}
        <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-6">User Acquisition</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickMargin={10} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff20', borderRadius: '8px' }} />
                <Line type="monotone" name="New Users" dataKey="users" stroke="#1A73E8" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Industries */}
        <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-6">Top Target Industries</h2>
          {data.industryData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-zinc-500">No industry data available.</div>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data.industryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} width={100} />
                  <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff20', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]} fill="#8B5CF6" barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Global Audience Map */}
      <div className="rounded-xl border border-white/10 bg-[#111827]/40 backdrop-blur-md p-6 shadow-lg relative overflow-hidden">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" /> Users by Region
        </h2>
        <p className="text-sm text-zinc-400 mb-6">Geographical distribution of our user base.</p>
        <div className="h-[600px] w-full bg-gradient-to-b from-[#1E293B]/50 to-[#111827]/80 rounded-xl overflow-hidden border border-white/5 shadow-inner">
          <WorldMap data={data.extractedCountryData} />
        </div>
      </div>
    </div>
  )
}
