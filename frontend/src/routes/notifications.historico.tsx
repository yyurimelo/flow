import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/notifications/historico')({
  component: HistoricoPage,
})

function HistoricoPage() {
  return (
    <p className="text-sm font-light text-muted-foreground/50 py-16 text-center">
      Histórico de Notificações — em breve
    </p>
  )
}
