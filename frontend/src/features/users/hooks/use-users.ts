import { useQuery } from '@tanstack/react-query'
import { fetchAllUsers } from '../api'

export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
}

export function useUsers(search?: string) {
  const query = useQuery({
    queryKey: userKeys.list(),
    queryFn: fetchAllUsers,
    staleTime: 60_000,
  })

  const filtered = search
    ? (query.data ?? []).filter((u) =>
        (u.name ?? u.email).toLowerCase().includes(search.toLowerCase()),
      )
    : (query.data ?? [])

  return { ...query, users: filtered }
}
