export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: "/api/auth",
    ME: "/api/auth/me",
  },
  USER: {
    CREATE: "/api/users",
    UPDATE: (id: string) => `/api/users/${id}`,
    LIST: "/api/users",
    LIST_PAGINATED: "/api/users/paginated",
    GET: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
  },
  NOTIFICATION: {
    CREATE: "/api/notifications",
    LIST_PAGINATED: "/api/notifications/paginated",
    GET: (id: string) => `/api/notifications/${id}`,
    UPDATE_READ_STATUS: (id: string) => `/api/notifications/${id}/read-status`,
    DELETE: (id: string) => `/api/notifications/${id}`,
  },
} as const;
