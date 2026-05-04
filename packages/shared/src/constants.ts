export const API_ENDPOINTS = {
  USER: {
    CREATE: "/api/user",
    UPDATE: "/api/user",
    LIST: "/api/user",
    GET: (id: string) => `/api/user/${id}`,
    DELETE: (id: string) => `/api/user/${id}`,
  }
}