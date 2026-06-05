import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/notifications/templates')({
  component: TemplatesPage,
})

function TemplatesPage() {
  return (
    <p className="text-sm font-light text-muted-foreground/50 py-16 text-center">
      Templates — em breve
    </p>
  )
}
