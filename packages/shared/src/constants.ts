export const API_ENDPOINTS = {
  USER: {
    CREATE: "/api/user",
    UPDATE: (id: string) => `/api/user/${id}`,
    LIST: "/api/user",
    LIST_PAGINATED: "/api/user/paginated",
    GET: (id: string) => `/api/user/${id}`,
    DELETE: (id: string) => `/api/user/${id}`,
  },
  NOTIFICATION: {
    CREATE: "/api/notifications",
    LIST_PAGINATED: "/api/notifications/paginated",
    GET: (id: string) => `/api/notifications/${id}`,
    UPDATE_READ_STATUS: (id: string) => `/api/notifications/${id}/read-status`,
    DELETE: (id: string) => `/api/notifications/${id}`,
  },
} as const;
