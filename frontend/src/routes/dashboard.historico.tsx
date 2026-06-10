import { createFileRoute } from '@tanstack/react-router'
import { HistoricoPage } from '@/src/features/notifications/pages/historico-page'

export const Route = createFileRoute('/dashboard/historico')({
  component: HistoricoPage,
})
