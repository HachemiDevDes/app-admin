'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('You are not authorized to access the admin dashboard.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-transparent text-white relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1A73E8]/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#10B981]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-sm rounded-2xl bg-[#111827]/40 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10">
        <div className="flex justify-center mb-6">
           <div className="h-12 w-12 rounded-xl bg-[#1A73E8] flex items-center justify-center font-bold text-2xl shadow-[0_0_20px_rgba(26,115,232,0.6)]">E</div>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-center text-white tracking-tight">Admin Login</h1>
        <p className="text-sm text-zinc-400 mb-8 text-center px-4">
          Enter your email and password to access the dashboard.
        </p>
        
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300" htmlFor="email">Email address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-zinc-500 focus:border-[#1A73E8] focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-[#1A73E8] transition-all"
              placeholder="admin@eventzone.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-zinc-500 focus:border-[#1A73E8] focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-[#1A73E8] transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-[#1A73E8] px-4 py-3 font-semibold text-white hover:bg-[#1664C8] hover:shadow-[0_0_15px_rgba(26,115,232,0.4)] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2 focus:ring-offset-[#0B0F19] disabled:opacity-50 transition-all duration-200 ease-in-out"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0B0F19] text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
