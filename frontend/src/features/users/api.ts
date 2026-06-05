import { api } from '@/src/api/client'
import { API_ENDPOINTS, type User } from '@flow/shared'

export function fetchAllUsers() {
  return api
    .get<User[]>(API_ENDPOINTS.USER.LIST)
    .then((r) => r.data)
}
