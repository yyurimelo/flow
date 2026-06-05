import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { USER_ROLE } from '@flow/shared'
import { useAuth } from '@/src/providers/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/auth/login', replace: true })
    }
  }, [user, isLoading, navigate])

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <span
            className="font-display italic text-primary leading-none select-none"
            style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}
          >
            Flow
          </span>
          <Button variant="ghost" size="sm" onClick={logout} className="font-light text-muted-foreground hover:text-foreground">
            Sair
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {user.name ?? 'usuário'}
          </h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            Bem-vindo ao Flow.
          </p>
        </div>

        {/* Account info */}
        <div className="max-w-xs space-y-5">
          <p className="text-xs font-light text-muted-foreground/60">
            Sua conta
          </p>

          <div className="space-y-4">
            <Row label="Nome" value={user.name ?? '—'} />
            <Row label="Email" value={user.email} />
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-xs font-light text-muted-foreground">Perfil</span>
              <Badge
                variant={user.role === USER_ROLE.ADMIN ? 'default' : 'secondary'}
                className="text-[11px] font-normal"
              >
                {user.role === USER_ROLE.ADMIN ? 'Admin' : 'Usuário'}
              </Badge>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs font-light text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-normal text-foreground truncate text-right">{value}</span>
    </div>
  )
}
