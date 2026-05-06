export const API_ENDPOINTS = {
  USER: {
    CREATE: "/api/user",
    UPDATE: (id: string) => `/api/user/${id}`,
    LIST: "/api/user",
    LIST_PAGINATED: "/api/user/paginated",
    GET: (id: string) => `/api/user/${id}`,
    DELETE: (id: string) => `/api/user/${id}`,
  }
} as const;
