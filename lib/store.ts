'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, User } from '@/types'

interface Store extends AuthState {
  setTokens: (accessToken: string, refreshToken?: string) => void
  setUser: (user: User | null) => void
  logout: () => void
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

export const useAuthStore = create<Store>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: !!user || !!state.accessToken,
        })),
      setTokens: (accessToken) =>
        set({
          accessToken,
          isAuthenticated: !!accessToken,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    { 
      name: 'tukir-auth',
      onRehydrateStorage: () => (state) => {
        if (state && state.accessToken) {
          state.isAuthenticated = true;
        }
      }
    }
  )
)

export { BASE_URL }
