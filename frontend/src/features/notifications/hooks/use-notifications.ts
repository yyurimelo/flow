import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NotificationDestination, NotificationScope, NotificationType } from '@flow/shared'
import { fetchNotifications, fetchManagedNotifications, patchReadStatus, patchActiveStatus } from '../api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (read?: boolean) => [...notificationKeys.all, 'list', { read }] as const,
  infinite: (filters: object) => [...notificationKeys.all, 'infinite', filters] as const,
  managed: (filters: object) => [...notificationKeys.all, 'managed', filters] as const,
}

export function useNotifications(read?: boolean) {
  return useQuery({
    queryKey: notificationKeys.list(read),
    queryFn: () => fetchNotifications({ page: 1, limit: 3, ...(read !== undefined && { read }) }),
  })
}

interface InfiniteNotificationFilters {
  scope?: NotificationScope
  destination?: NotificationDestination
  read?: boolean
}

export function useInfiniteNotifications(filters: InfiniteNotificationFilters = {}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.infinite(filters),
    queryFn: ({ pageParam }) =>
      fetchNotifications({ page: pageParam as number, limit: 10, ...filters }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
  })
}

interface ManagedNotificationFilters {
  active?: boolean
  destination?: NotificationDestination
  type?: NotificationType
}

export function useInfiniteManagedNotifications(filters: ManagedNotificationFilters = {}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.managed(filters),
    queryFn: ({ pageParam }) =>
      fetchManagedNotifications({ page: pageParam as number, limit: 10, ...filters }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => patchReadStatus(id, read),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useSetNotificationActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => patchActiveStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
