'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Device } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { Wifi, Power } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { accessToken, user, setUser, logout } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)
  const [checking, setChecking] = useState(true)

  // Tunggu zustand persist selesai membaca localStorage (hindari redirect prematur)
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    if (useAuthStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    if (!hydrated) return

    if (!accessToken) {
      router.replace('/')
      return
    }

    let cancelled = false

    // Revalidate token dengan /api/auth/me saat load
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (res.status === 401) throw new Error('Unauthorized')
        if (!res.ok) throw new Error('Server Error')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setUser(data)
        setChecking(false)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.message === 'Unauthorized') {
          logout()
          router.replace('/')
        } else {
          setChecking(false) // Tetap izinkan masuk jika server error (bukan auth)
        }
      })

    return () => {
      cancelled = true
    }
  }, [hydrated, accessToken, router, setUser, logout])

  if (checking) return <div className="flex h-screen items-center justify-center">Verifying session...</div>

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold">Tukir.ID Admin</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
              router.push('/')
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="flex">
        <aside className="w-64 border-r bg-card p-6">
          <nav className="space-y-2">
            <NavLink href="/dashboard" label="Overview" />
            <NavLink href="/dashboard/devices" label="Devices" />
            <NavLink href="/dashboard/users" label="Users" />
            <NavLink href="/dashboard/logs" label="Activity Logs" />
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className="w-full px-4 py-2 text-left text-sm hover:bg-accent rounded-md transition"
    >
      {label}
    </button>
  )
}
