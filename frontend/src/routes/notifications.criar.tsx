import { createFileRoute } from '@tanstack/react-router'
import { CreateNotificationPage } from '@/src/features/notifications/pages/create-notification-page'

export const Route = createFileRoute('/notifications/criar')({
  component: CreateNotificationPage,
})
