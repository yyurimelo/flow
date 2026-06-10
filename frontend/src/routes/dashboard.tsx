import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import type { FileRoutesByTo } from '@/src/routeTree.gen'
import { useEffect } from 'react'
import { LogOut, Moon, Sun, PenLine, History, Cog } from 'lucide-react'
import { USER_ROLE } from '@flow/shared'
import { useAuth } from '@/src/providers/auth-provider'
import { useTheme } from '@/components/ui/theme-provider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from '@/src/features/notifications/components/notification-bell'
import { NovadesBell } from '@/src/features/notifications/components/novidades-bell'
import { NovaBanner } from '@/src/features/notifications/components/novidade-banner'
import { useLoggedUserStore } from '@/src/stores/logged-user.store'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    // @ts-expect-error context type
    if (context?.auth && !context.auth.isAuthenticated) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: DashboardLayout,
})

type AppRoutePath = keyof FileRoutesByTo

const NAV_ITEMS: { to: AppRoutePath; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { to: '/dashboard/criar', label: 'Criar Notificação', icon: PenLine },
  { to: '/dashboard/historico', label: 'Histórico', icon: History },
  { to: '/dashboard/gerenciamento', label: 'Gerenciamento', icon: Cog },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function DashboardLayout() {
  const { user, isLoading, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const setLoggedUser = useLoggedUserStore((s) => s.setLoggedUser)

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/auth/login', replace: true })
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (user) {
      setLoggedUser({
        id: user.id,
        name: user.name ?? '',
        email: user.email,
        role: user.role,
        permissions: user.role === USER_ROLE.ADMIN ? ['send:system', 'send:user'] : ['send:user'],
      })
    } else {
      setLoggedUser(null)
    }
  }, [user, setLoggedUser])

  if (isLoading || !user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-3">
          <span
            className="font-display italic text-primary leading-none select-none"
            style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}
          >
            Flow
          </span>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
              <a
                href="https://github.com/yyurimelo/flow"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Alternar tema"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>

            <NovadesBell userId={user.id} />
            <NotificationBell userId={user.id} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 ml-1">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {getInitials(user.name ?? 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none text-foreground">{user.name}</span>
                    <span className="text-xs font-light text-muted-foreground truncate mt-1">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="gap-2 cursor-pointer text-muted-foreground focus:text-foreground"
                >
                  <LogOut className="size-3.5" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <NovaBanner />

        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Olá, {user.name ?? 'usuário'}
          </h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            Bem-vindo ao Flow.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          <nav className="lg:w-52 lg:shrink-0">
            <div className="border border-border/60 rounded-lg p-1.5 sm:p-2 flex flex-row lg:flex-col gap-0.5 overflow-x-auto lg:overflow-x-visible">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-2 shrink-0 lg:shrink px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg text-sm transition-colors text-left lg:w-full',
                    'text-muted-foreground hover:bg-accent hover:text-foreground font-light',
                  )}
                  activeProps={{
                    className: 'bg-primary/10 text-primary font-medium hover:bg-primary/10 hover:text-primary',
                  }}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="flex-1 min-w-0 border border-border/60 rounded-lg p-4 sm:p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
