import { createFileRoute } from '@tanstack/react-router'
import { ManagementPage } from '@/src/features/notifications/pages/management-page'

export const Route = createFileRoute('/notifications/gerenciamento')({
  component: ManagementPage,
})
