import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/src/providers/auth-provider'

export const Route = createFileRoute('/')({
  component: IndexRedirect,
})

function IndexRedirect() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: user ? '/dashboard' : '/auth/login', replace: true })
  }, [user, navigate])

  return null
}
