import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { UserResponse, AuthResponse } from '@flow/shared'
import { API_ENDPOINTS } from '@flow/shared'
import { api } from '@/src/api/client'

export interface AuthContextValue {
  user: UserResponse | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (name: string, email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('flow:token'))

  useEffect(() => {
    const token = localStorage.getItem('flow:token')
    if (!token) return

    api
      .get<UserResponse>(API_ENDPOINTS.AUTH.ME)
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.removeItem('flow:token'))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGN_IN, { email, password })
    localStorage.setItem('flow:token', data.accessToken)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken: _token, ...userWithoutToken } = data
    setUser(userWithoutToken)
  }

  function logout() {
    localStorage.removeItem('flow:token')
    setUser(null)
  }

  async function register(name: string, email: string, password: string) {
    await api.post(API_ENDPOINTS.USER.CREATE, { name, email, password })
    await login(email, password)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
