# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in the `frontend/` workspace.

## Commands

```bash
npm run dev:front                  # dev server (from root)
npm -w frontend run dev            # dev server (direct)
npm -w frontend run build          # type-check + Vite build
npm -w frontend run lint           # ESLint
```

## Directory layout

```
frontend/
├── src/
│   ├── main.tsx                   # Providers entry point — do not add logic here
│   ├── routeTree.gen.ts           # Auto-generated — never edit manually
│   ├── routes/                    # TanStack Router file-based routes
│   │   ├── __root.tsx             # Root layout
│   │   ├── index.tsx              # "/"
│   │   └── _auth/                 # Layout group prefix: _
│   ├── api/                       # Axios call functions + query keys
│   │   └── client.ts              # Axios instance (import `api` from here)
│   ├── providers/                 # React context providers
│   └── features/                  # Feature modules (auth, users, notifications…)
│       └── [feature]/
│           ├── components/        # Components scoped to this feature
│           ├── hooks/             # useQuery/useMutation hooks for this feature
│           └── api.ts             # Axios call fns for this feature
├── components/
│   ├── ui/                        # shadcn primitives — NEVER MODIFY
│   └── [shared components]        # Reusable across features
├── hooks/                         # App-wide hooks (useIsMobile, useTheme…)
└── lib/
    └── utils.ts                   # cn() only
```

## Routing (TanStack Router)

File naming in `src/routes/`:

| File | Route |
|---|---|
| `index.tsx` | `/` |
| `users.tsx` | `/users` |
| `users.$id.tsx` | `/users/:id` |
| `_auth.tsx` | Layout wrapper (no URL segment) |
| `_auth.login.tsx` | `/login` inside auth layout |

Every route file exports `Route` as a named export:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users')({
  component: UsersPage,
})

function UsersPage() {
  return <div />
}
```

- Keep route files thin — orchestration only. No business logic, no inline styles.
- Use `loader` for data that must exist before render. Use hooks for interactive fetching.
- Navigate with `useNavigate` or `<Link>` from `@tanstack/react-router`.

## Data fetching (TanStack Query)

Define query/mutation functions in `src/features/[feature]/hooks/`:

```tsx
// features/users/hooks/use-users.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/src/api/client'
import { API_ENDPOINTS } from '@flow/shared'
import type { PaginatedUsersResponse } from '@flow/shared'

export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () =>
      api.get<PaginatedUsersResponse>(API_ENDPOINTS.USER.LIST_PAGINATED).then((r) => r.data),
  })
}
```

Rules:
- Query keys in a `keys` object in the same file (never inline strings).
- `queryFn` returns the unwrapped `.data` from Axios.
- Mutations call `queryClient.invalidateQueries` on success.
- Components never call `api` directly — always via a hook.

## API client

```ts
import { api } from '@/src/api/client'
```

- `api` is the Axios instance with base URL + JWT interceptor.
- Token stored at `localStorage['flow:token']` — set it on login, remove on logout.
- 401 responses auto-redirect to `/login` via response interceptor.

## Shared types and constants

Always import types and constants from `@flow/shared` — never redefine them:

```ts
import type { User, AuthResponse, Notification } from '@flow/shared'
import { USER_ROLE, NOTIFICATION_TYPE, API_ENDPOINTS } from '@flow/shared'
```

Available:
- Types: `User`, `UserRole`, `AuthResponse`, `Notification`, `NotificationType`, `NotificationDestination`
- Constants: `USER_ROLE`, `NOTIFICATION_TYPE`, `NOTIFICATION_DESTINATION`, `NOTIFICATION_SCOPE`, `API_ENDPOINTS`

## Components

### shadcn/ui — `components/ui/`

Never modify files in `components/ui/`. Compose them, don't fork them.

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
```

### Writing components

- One component per file. Named export, not default.
- Props via `interface`, not `type`.
- No business logic in components — receive data and callbacks as props.
- Derive state from props/queries; avoid `useEffect` for derived values.

```tsx
interface UserCardProps {
  user: User
  onDelete: (id: string) => void
}

export function UserCard({ user, onDelete }: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
    </Card>
  )
}
```

## Design system (Tailwind CSS 4 + shadcn)

- Use design tokens via CSS variables: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `text-primary`, `bg-destructive`.
- Never hardcode colors (`text-gray-500` → `text-muted-foreground`).
- Use `cn()` from `@/lib/utils` to merge conditional classes.
- Spacing: Tailwind scale only (`gap-4`, `p-6`, `mt-2`). No arbitrary values unless unavoidable.
- Responsive: mobile-first (`sm:`, `md:`, `lg:`).
- Use `useIsMobile()` from `@/hooks/use-mobile` for JS-based responsive logic.

### Typography

Two font families:

| Token | Family | Use |
|---|---|---|
| `font-sans` (default) | Inter Variable | All UI text, labels, body, buttons |
| `font-display` | Newsreader (italic) | Brand logotype "Flow" only |

**Inter weight scale** — use contrast between weights to create hierarchy, never flat:

| Class | Weight | Use |
|---|---|---|
| `font-extralight` | 200 | Metadata labels, section eyebrows, low-hierarchy hints |
| `font-light` | 300 | Secondary body, form labels, subtitles, footer links |
| `font-normal` | 400 | Primary body text, input values, nav items |
| `font-medium` | 500 | Button text, active states, important labels |
| `font-semibold` | 600 | Page headings, card titles |
| `font-bold` | 700 | Hero copy only |

**Rules:**
- "Flow" brand name: always `font-display italic text-primary` — never any other style.
- Form labels: `font-light` (already set as default in `components/ui/form.tsx`).
- Muted secondary text: `font-light text-muted-foreground`.
- Never use uniform weights across a full page — vary for rhythm.

### Dark/light theme

Theme is controlled by `ThemeProvider` in `main.tsx`. Access with:

```tsx
import { useTheme } from '@/components/ui/theme-provider'

const { theme, setTheme } = useTheme()
setTheme('dark') // 'light' | 'dark' | 'system'
```

Use `dark:` Tailwind variants for per-element overrides, not JS theme checks.

## Toast (Sonner)

```tsx
import { toast } from 'sonner'

toast.success('Usuário criado')
toast.error('Erro ao salvar')
toast.loading('Salvando…')
toast.info('Atualização disponível')
toast.warning('Atenção: prazo próximo')
```

Call in mutation `onSuccess`/`onError` callbacks. Never call inside render.

## Imports

Always use `@/` alias. Never use relative paths (`../`, `./`):

```ts
// ✓
import { Button } from '@/components/ui/button'
import { api } from '@/src/api/client'
import { cn } from '@/lib/utils'

// ✗
import { Button } from '../../components/ui/button'
```

## Design reviews

Use the `/impeccable` skill when building or refining UI. It reviews visual hierarchy, spacing, contrast, component composition, and Tailwind class quality.
