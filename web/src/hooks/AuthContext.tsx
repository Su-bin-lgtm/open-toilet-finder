import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginAccount, logoutAccount, registerAccount, type AuthUser } from '../api/auth'
import { setAccessToken } from '../api/client'

interface AuthContextValue {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: async (username, password) => {
      const session = await loginAccount(username, password)
      setAccessToken(session.accessToken); setUser(session.user)
    },
    register: async (username, password) => {
      const session = await registerAccount(username, password)
      setAccessToken(session.accessToken); setUser(session.user)
    },
    logout: async () => {
      try { await logoutAccount() } finally { setAccessToken(null); setUser(null) }
    },
  }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.')
  return value
}
