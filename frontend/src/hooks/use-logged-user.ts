import { USER_ROLE } from '@flow/shared'
import { useLoggedUserStore } from '@/src/stores/logged-user.store'

export function useLoggedUser() {
  const loggedUser = useLoggedUserStore((s) => s.loggedUser)

  return {
    loggedUser,
    isAdmin: loggedUser?.role === USER_ROLE.ADMIN,
    isUser: loggedUser?.role === USER_ROLE.USER,
    hasPermission: (permission: string) =>
      loggedUser?.permissions.includes(permission) ?? false,
  }
}
