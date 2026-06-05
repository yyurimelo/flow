import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/notifications/configuracoes')({
  component: ConfiguracoesPage,
})

function ConfiguracoesPage() {
  return (
    <p className="text-sm font-light text-muted-foreground/50 py-16 text-center">
      Configurações — em breve
    </p>
  )
}
