'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Link as LinkIcon, Settings, LogOut, CreditCard, MessageSquare, Bell, BarChart3, LayoutDashboard, Calendar } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function Sidebar({ unreadSupportCount = 0 }: { unreadSupportCount?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { name: 'Support', href: '/support', icon: MessageSquare, badge: unreadSupportCount },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="w-64 border-r border-white/10 bg-[#111827]/40 backdrop-blur-xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-start mb-10">
        <div className="relative h-10 w-40">
          <Image src="/logo.png" alt="Eventzone" fill className="object-contain object-left brightness-0 invert" />
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.name}
              href={item.href} 
              className={`flex justify-between items-center rounded-lg px-3 py-2 transition-all ${
                isActive 
                  ? 'bg-white/10 text-white border border-white/5 shadow-sm' 
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-5 w-5 ${isActive ? 'text-[#1A73E8]' : ''}`} />
                {item.name}
              </div>
              {!!item.badge && item.badge > 0 && (
                <span className="bg-[#1A73E8] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      
      <div className="pt-6 border-t border-white/10 mt-auto">
        <button 
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
