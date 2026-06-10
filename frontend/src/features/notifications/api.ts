import { api } from '@/src/api/client'
import {
  API_ENDPOINTS,
  type Notification,
  type NotificationDestination,
  type NotificationScope,
  type NotificationType,
} from '@flow/shared'
import type { PaginatedNotificationsResponse } from '@flow/shared'

export function fetchNotifications(params: {
  page?: number
  limit?: number
  read?: boolean
  destination?: NotificationDestination
  scope?: NotificationScope
}) {
  const { page = 1, limit = 3, read, destination, scope } = params
  const body: Record<string, unknown> = {}
  if (read !== undefined) body.read = read
  if (destination !== undefined) body.destination = destination
  if (scope !== undefined) body.scope = scope
  return api
    .post<PaginatedNotificationsResponse>(
      API_ENDPOINTS.NOTIFICATION.LIST_PAGINATED,
      body,
      { params: { page, limit } },
    )
    .then((r) => r.data)
}

export function fetchManagedNotifications(params: {
  page?: number
  limit?: number
  active?: boolean
  destination?: NotificationDestination
  type?: NotificationType
}) {
  const { page = 1, limit = 10, active, destination, type } = params
  const body: Record<string, unknown> = {}
  if (active !== undefined) body.active = active
  if (destination !== undefined) body.destination = destination
  if (type !== undefined) body.type = type
  return api
    .post<PaginatedNotificationsResponse>(
      API_ENDPOINTS.NOTIFICATION.MANAGE_PAGINATED,
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

export function patchActiveStatus(id: string, active: boolean) {
  return api
    .patch<Notification>(API_ENDPOINTS.NOTIFICATION.SET_ACTIVE(id), { active })
    .then((r) => r.data)
}
