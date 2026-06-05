import { create } from 'zustand'
import type { UserRole } from '@flow/shared'

export interface LoggedUser {
  id: string
  name: string
  email: string
  role: UserRole
  permissions: string[]
}

interface LoggedUserStore {
  loggedUser: LoggedUser | null
  setLoggedUser: (user: LoggedUser | null) => void
}

export const useLoggedUserStore = create<LoggedUserStore>((set) => ({
  loggedUser: null,
  setLoggedUser: (user) => set({ loggedUser: user }),
}))
