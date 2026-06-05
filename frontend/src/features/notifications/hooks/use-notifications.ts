import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, patchReadStatus } from '../api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (read?: boolean) => [...notificationKeys.all, 'list', { read }] as const,
}

export function useNotifications(read?: boolean) {
  return useQuery({
    queryKey: notificationKeys.list(read),
    queryFn: () => fetchNotifications({ page: 1, limit: 3, ...(read !== undefined && { read }) }),
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
