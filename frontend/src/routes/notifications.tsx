import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import type { FileRoutesByTo } from '@/src/routeTree.gen'
import { useEffect } from 'react'
import { PenLine, History, Cog } from 'lucide-react'
import { USER_ROLE } from '@flow/shared'
import { useAuth } from '@/src/providers/auth-provider'
import { useLoggedUserStore } from '@/src/stores/logged-user.store'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/notifications')({
  beforeLoad: ({ context }) => {
    // @ts-expect-error context type
    if (context?.auth && !context.auth.isAuthenticated) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: NotificationsLayout,
})

type AppRoutePath = keyof FileRoutesByTo

interface NavLinkProps {
  to: AppRoutePath
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

function NavLink({ to, icon: Icon, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
        'text-muted-foreground hover:bg-accent hover:text-foreground font-light',
      )}
      activeProps={{
        className: 'bg-primary/10 text-primary font-medium hover:bg-primary/10 hover:text-primary',
      }}
    >
      <Icon className="size-4 shrink-0" />
      {children}
    </Link>
  )
}

function NotificationsLayout() {
  const { user } = useAuth()
  const setLoggedUser = useLoggedUserStore((s) => s.setLoggedUser)

  useEffect(() => {
    if (user) {
      setLoggedUser({
        id: user.id,
        name: user.name ?? '',
        email: user.email,
        role: user.role,
        permissions: user.role === USER_ROLE.ADMIN
          ? ['send:system', 'send:user']
          : ['send:user'],
      })
    } else {
      setLoggedUser(null)
    }
  }, [user, setLoggedUser])

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <nav className="flex flex-row lg:flex-col lg:w-56 lg:shrink-0 overflow-x-auto lg:overflow-x-visible">
            <div className="border border-border/60 rounded-lg p-2 space-y-0.5 w-full">
              <NavLink to="/notifications/criar" icon={PenLine}>
                Criar Notificação
              </NavLink>
              <NavLink to="/notifications/historico" icon={History}>
                Histórico
              </NavLink>
              <NavLink to="/notifications/gerenciamento" icon={Cog}>
                Gerenciamento
              </NavLink>
            </div>
          </nav>

          <main className="flex-1 min-w-0 border border-border/60 rounded-lg p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
