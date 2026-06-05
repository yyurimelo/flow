import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { authSchema, type AuthRequest } from '@flow/shared'
import { AuthCard } from '@/src/features/auth/components/auth-card'
import { useAuth } from '@/src/providers/auth-provider'
import { Spinner } from '@/components/ui/spinner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const form = useForm<AuthRequest>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: AuthRequest) {
    try {
      await login(data.email, data.password)
      navigate({ to: '/dashboard', replace: true })
    } catch {
      toast.error('Email ou senha incorretos')
    }
  }

  return (
    <AuthCard>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            size="lg"
            className="w-full mt-2 font-medium"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? <><Spinner />Entrando...</> : 'Entrar'}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm font-light text-muted-foreground">
        Não possui conta?{' '}
        <Link to="/auth/register" className="text-primary font-normal hover:underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </AuthCard>
  )
}
