import { api } from '@/src/api/client'
import { API_ENDPOINTS } from '@flow/shared'
import type { PaginatedNotificationsResponse } from '@flow/shared'

export function fetchNotifications(params: {
  page?: number
  limit?: number
  read?: boolean
  destination?: 'USER' | 'SYSTEM'
}) {
  const { page = 1, limit = 3, read, destination } = params
  const body: Record<string, unknown> = {}
  if (read !== undefined) body.read = read
  if (destination !== undefined) body.destination = destination
  return api
    .post<PaginatedNotificationsResponse>(
      API_ENDPOINTS.NOTIFICATION.LIST_PAGINATED,
      body,
      { params: { page, limit } },
    )
    .then((r) => r.data)
}

export function patchReadStatus(id: string, read: boolean) {
  return api
    .patch(API_ENDPOINTS.NOTIFICATION.UPDATE_READ_STATUS(id), { read })
    .then((r) => r.data)
}
